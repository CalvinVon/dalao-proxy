const { Plugin, PluginInterrupt } = require('../plugins');
const request = require('request');
const zlib = require('zlib');
const querystring = require('querystring');
const _ = require('lodash');

const {
    joinUrl,
    addHttpProtocol,
    isStaticResouce,
    splitTargetAndPath,
    transformPath,
    fixJson
} = require('../utils');

let shouldCleanUpAllConnections;
// * Why collect connections?
// When switch cache option(or config options), HTTP/1.1 will use `Connection: Keep-Alive` by default,
// which will cause client former TCP socket conection still work, or in short, it makes hot reload did
// not work immediately.
let connections = [];
let plugins = [];


// Calling Plugin instance method (not middleware defined method)
function _invokeMethod(target, method, context, next) {
    if (!target) return;
    const targetMethod = target[method];
    if (typeof targetMethod === 'function') {
        targetMethod.call(target, context, next);
    }
}

// base function for invoke all middlewares
function _invokeAllPlugins(functionName, context, next) {
    plugins.forEach(plugin => {
        _invokeMethod(plugin, functionName, context, (...args) => {
            next.call(null, ...args, plugin, functionName);
        });
    });
}

// plugin interrupter handler
function interrupter(context, resolve, reject) {
    return function (reason, plugin, functionName) {
        if (reason) {
            reject(new PluginInterrupt(plugin, functionName, reason));
        }
        else resolve(context);
    }
}

/**
 * proxyRequestWrapper
 * @summary proxy life cycle flow detail
 * - Middleware: Resolve request params data          [life-cycle:onRequest]
 * - Route matching
 * - Middleware: Route matching result                [life-cycle:onRouteMatch]
 * - Route proxy
 * - Calculate proxy route
 * - Middleware: before proxy request                 [life-cycle:beforeProxy]
 * - Proxy request
 * - Collect request/proxy-response data
 * - Middleware: after proxy request                  [life-cycle:afterProxy]
 */
function proxyRequestWrapper(config) {
    shouldCleanUpAllConnections = true;

    function proxyRequest(req, res) {
        const {
            info,
            host,
            port,
            headers,
            proxyTable,
        } = config;

        const { method, url } = req;
        const { host: requestHost } = req.headers;
        const _request = request[method.toLowerCase()];
        let matched;

        if (!isStaticResouce(url)) {
            cleanUpConnections();
            collectConnections();
        }

        // set response CORS
        setHeaders();

        Promise.resolve()
            .then(() => {
                const context = {
                    config,
                    request: req,
                    response: res
                };
                return context;
            })

            /**
             * Middleware: on request arrived
             * @lifecycle onRequest
             * @param {Object} context
             * @returns {Object} context
             */
            .then(context => Middleware_onRequest(context))

            /**
             * Route matching
             * @resolve context.matched
             * @returns {Object} context
             */
            .then(context => {
                // Matching strategy
                const proxyPaths = Object.keys(proxyTable);
                let mostAccurateMatch;
                let matchingLength = url.length;
                for (let index = 0; index < proxyPaths.length; index++) {
                    const proxyPath = proxyPaths[index];
                    const matchReg = new RegExp(`^${proxyPath}(.*)`);
                    let matchingResult;
                    if (matchingResult = url.match(matchReg)) {
                        const currentLenth = matchingResult[1].length;
                        if (currentLenth < matchingLength) {
                            matchingLength = currentLenth;
                            mostAccurateMatch = proxyPaths[index];
                            matched = matchingResult;
                        }
                    }
                }

                let proxyPath;
                let matchedRoute;

                // Matched Proxy
                if (mostAccurateMatch) {
                    proxyPath = mostAccurateMatch;
                    matchedRoute = proxyTable[proxyPath];

                    context.matched = {
                        path: proxyPath,
                        route: matchedRoute,
                    };
                    return context;
                }

                // if the request not in the proxy table
                else {
                    Promise.reject('\n> 😫  Oops, dalao can\'t match any route'.red);
                }
            })

            /**
             * Route matching result
             * @param {Object} context
             * @param {Object} context.matched
             * @resolve context.matched
             * @returns {Object} context
             */
            .then(context => Middleware_onRouteMatch(context))

            /**
             * Calculate proxy route
             * @desc transform url
             * @param {Object} context
             * @param {Object} context.matched
             * @resolve context.proxy
             * @returns {Object} context
             */
            .then(context => {
                const { route: matchedRoute, path: matchedPath } = context.matched;
                // route config
                const {
                    path: overwritePath,
                    target: overwriteHost,
                    pathRewrite: overwritePathRewrite,
                } = matchedRoute;

                const { target: overwriteHost_target, path: overwriteHost_path } = splitTargetAndPath(overwriteHost);
                const proxyedPath = overwriteHost_target + joinUrl(overwriteHost_path, overwritePath, matched[0]);
                const proxyUrl = transformPath(addHttpProtocol(proxyedPath), overwritePathRewrite);

                // invalid request
                if (new RegExp(`\\b${host}:${port}\\b`).test(overwriteHost)) {
                    res.writeHead(403, {
                        'Content-Type': 'text/html; charset=utf-8'
                    });
                    res.end(`
                        <h1>🔴  403 Forbidden</h1>
                        <p>Path to ${overwriteHost} proxy cancelled</p>
                        <h3>Can NOT proxy request to proxy server address, which may cause endless proxy loop.</h3>
                    `);

                    return Promise.reject(`> 🔴   Forbidden Hit! [${matchedPath}]`.red);
                }

                context.proxy = {
                    route: matchedRoute,
                    uri: proxyUrl
                };
                return context;
            })

            /**
             * Middleware: before proxy request
             * @lifecycle beforeProxy
             * @param {Object} context
             * @returns {Object} context
             */
            .then(context => Middleware_beforeProxy(context))

            /**
             * Proxy request
             * @desc send request
             * @proxy
             * @param {Object} context
             * @param {Object} context.matched
             * @param {Object} context.proxy
             * @resolve context.proxy.response
             * @returns {Object} context
             */
            .then(context => {
                const { uri: proxyUrl } = context.proxy;
                const { path: matchedPath } = context.matched;
                
                const proxyReq = _request(proxyUrl);
                const responseStream = req.pipe(proxyReq);
                responseStream.pipe(res);
                req.pipe(responseStream);
                // proxyReq.setHeader('Content-Length', Buffer.byteLength(context.data.rawBody));
                // responseStream.end(context.data.rawBody);
                info && console.log(`> 🎯   Hit! [${matchedPath}]`.green + `   ${method.toUpperCase()}   ${url}  ${'>>>>'.green}  ${proxyUrl}`.white)

                context.proxy.response = responseStream;
                return context;
            })

            /**
             * Collect request/proxy-response data received
             * @desc collect raw data
             * @param {Object} context
             * @resolve context.data
             * @returns {Object} context
             */
            .then(context => collectRequestData(context))
            .then(context => collectProxyResponseData(context))

            /**
             * Middleware: after proxy request
             * @lifecycle afterProxy
             * @param {Object} context
             * @returns {Object} context
             */
            .then(context => Middleware_afterProxy(context))
            .catch(error => {
                if (!error instanceof PluginInterrupt || config.info) {
                    console.error(error);
                }
            })


        /********************************************************/
        /* Functions in Content ------------------------------- */
        /********************************************************/

        // Collect request data
        function collectRequestData(context) {
            return new Promise((resolve, reject) => {
                const reqContentType = req.headers['content-type'];

                const data = {
                    rawBody: '',
                    body: '',
                    query: querystring.parse(url.split('?')[1] || ''),
                    type: reqContentType
                };
                context.data = {
                    request: data,
                    response: null
                };
                req.on('data', chunk => data.rawBody += chunk);
                req.on('end', onRequestData);

                function onRequestData() {
                    if (!data.rawBody) return;

                    try {
                        if (/application\/x-www-form-urlencoded/.test(reqContentType)) {
                            data.body = querystring.parse(data.rawBody);
                        } else if (/application\/json/.test(reqContentType)) {
                            data.body = JSON.parse(data.rawBody);
                        } else if (/multipart\/form-data/.test(reqContentType)) {
                            data.body = data.rawBody;
                        }
                        resolve(context);
                    } catch (error) {
                        reject(error);
                        info && console.log(' > Error: can\'t parse requset body. ' + error.message);
                    }
                }
            });
        }

        // Collect response data
        function collectProxyResponseData(context) {
            const { response: proxyResponse } = context.proxy;

            return new Promise((resolve) => {
                let responseData = [];
                const data = {
                    rawData: '',
                    data: '',
                    type: null,
                    encode: null
                };
                context.data.response = data;
                proxyResponse.on('data', chunk => {
                    responseData.push(chunk);
                });

                proxyResponse.on('end', onResponseData);

                function onResponseData() {
                    const buffer = Buffer.concat(responseData);
                    const response = proxyResponse.response;

                    // gunzip first
                    if (/gzip/.test(data.encode = response.headers['content-encoding'])) {
                        responseData = zlib.gunzipSync(buffer);
                    }
                    
                    try {
                        data.rawData = responseData.toString();
                        if (/(^text|json$)/.test(data.type = response.headers['content-type'])) {
                            data.data = JSON.parse(fixJson(data.rawData));
                        }
                        resolve(context);
                    } catch (error) {
                        console.error(` > An error occurred (${error.message}) while parsing response data.`.red);
                        resolve(context);
                    }
                }
            });
        }

        function setHeaders() {
            res.setHeader('Via', 'HTTP/1.1 dalao-proxy');
            res.setHeader('Access-Control-Allow-Origin', requestHost);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Allow-Headers', 'Authorization, Token');

            for (const header in headers) {
                res.setHeader(header.split('-').map(item => _.upperFirst(item.toLowerCase())).join('-'), headers[header]);
            }
        }

        // collect socket connection
        function collectConnections() {
            const connection = req.connection;
            if (connections.indexOf(connection) === -1) {
                connections.push(connection);
            }
        }

        // destroy all tcp connections
        function cleanUpConnections() {
            if (shouldCleanUpAllConnections) {
                connections.forEach(connection => connection.destroy());
                connections = [];
                shouldCleanUpAllConnections = false;
            }
        }


        /********************************************************/
        /* Middleware Functions in Content --------------------- */
        /********************************************************/

        // after request data resolved
        function Middleware_onRequest(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPlugins('onRequest', context, interrupter(context, resolve, reject));
            });
        }

        // on route match
        function Middleware_onRouteMatch(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPlugins('onRouteMatch', context, interrupter(context, resolve, reject));
            });
        }

        function Middleware_beforeProxy(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPlugins('beforeProxy', context, interrupter(context, resolve, reject));
            });
        }

        function Middleware_afterProxy(context) {
            _invokeAllPlugins('afterProxy', context);
        }
    }

    (function Middleware_beforeCreate() {
        _invokeAllPlugins('beforeCreate');
    })();
    return proxyRequest;
}

/**
 * Install plugins as proxy middleware
 * @param {Array} plugins plugin name array to install
 */
function usePlugins(pluginNames) {
    plugins = [];
    pluginNames.forEach(pluginName => {
        plugins.push(new Plugin(pluginName));
    });
}

module.exports = {
    httpCallback: proxyRequestWrapper,
    usePlugins
}
const chalk = require('chalk');
const request = require('request');
const through = require('through2');
const _ = require('lodash');
const concat = require('concat-stream');
const querystring = require('querystring');
const { PluginInterrupt } = require('../plugin');
const { version } = require('../../config/index');

const {
    joinUrl,
    addHttpProtocol,
    splitTargetAndPath,
    transformPath,
    fixJson
} = require('../utils');


let plugins = [];

/**
 * Calling single plugin instance method (not middleware defined method)
 * @private
 * @param {Plugin} plugin
 * @param {String} method method name
 * @param {Object} context
 * @returns {Promise}
 */
function _invokePluginMiddleware(plugin, method, context) {
    return new Promise((resolve, reject) => {
        if (!plugin) return resolve();
        const targetMethod = plugin[method];
        if (typeof targetMethod === 'function') {
            targetMethod.call(plugin, context, error => {
                if (error) {
                    reject({
                        error,
                        plugin,
                        method
                    });
                }
                else {
                    resolve();
                }
            });
        }
    });
}


/**
 * Base function to invoke all middlewares
 * @param {String} hookName
 * @param {Object} context
 * @param {Function} next
 */
function _invokeAllPluginsMiddlewares(hookName, context, next) {
    const allPluginPromises = plugins.map(plugin => {
        return _invokePluginMiddleware(plugin, hookName, context);
    });
    Promise.all(allPluginPromises)
        .then(() => {
            next.call(null, null, null, hookName);
        })
        .catch(ctx => {
            if (next) {
                next.call(null, ctx.error, ctx.plugin, hookName);
            }
            else {
                console.error(hookName, ctx)
            }
        })
}


/**
 * Invoke all plugins. Used for `onPipeRequest`, `onPipeResponse`
 * @private
 * @param {String} hookName
 * @param {Object} context
 * @param {Buffer} chunk
 * @param {String} enc
 * @param {Function} callback
 */
function _invokePipeAllPlugin(hookName, context, chunk, enc, callback) {

    let total = plugins.length;
    if (!total) {
        callback(null, chunk);
    }

    let index = 0,
        currentPlugin = plugins[index],
        lastValue = chunk;


    actuator(currentPlugin, () => {
        callback(null, lastValue);
    });

    function actuator(plugin, cb) {
        if (plugin.middleware) {
            const hook = plugin.middleware[hookName];
            if (typeof (hook) === 'function') {
                hook.call(plugin, {
                    ...context,
                    chunk,
                    enc
                }, (err, returnValue) => {
                    if (!err) {
                        lastValue = returnValue;
                    }
                    next();
                })
            }
            else {
                next();
            }
        }
        else {
            next();
        }

        function next() {
            if (index < total - 1) {
                currentPlugin = plugins[++index];
                actuator(currentPlugin, cb);
            }
            else {
                cb();
            }
        }
    }

}

// plugin interrupter handler
function interrupter(context, resolve, reject) {
    return function (reason, plugin, hookName) {
        if (reason) {
            if (reason instanceof Error) {
                reject(reason);
            }
            else {
                reject(new PluginInterrupt(plugin, hookName, reason));
            }
        }
        else {
            resolve(context);
        }
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
function proxyRequestWrapper(config, corePlugins) {
    plugins = corePlugins;

    function proxyRequest(req, res) {
        const {
            info,
            host,
            port,
            headers: userHeaders,
            proxyTable,
        } = config;

        const { method, url } = req;
        const { host: requestHost } = req.headers;
        const _request = request[method.toLowerCase()];
        let matched;

        res.setHeader('Via', 'dalao-proxy/' + version);
        res.setHeader('Access-Control-Allow-Origin', requestHost);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Token');
        res.setHeader('Connection', 'close');

        Promise.resolve()
            .then(() => {
                const context = {
                    config,
                    request: req,
                    response: res
                };
                req.URL = require('url').parse(req.url);
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
                        notFound: false
                    };
                    return context;
                }

                // if the request not in the proxy table
                else {
                    context.matched = {
                        notFound: true
                    };
                    return context;
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
                context.proxy = {};
                const {
                    route: matchedRoute,
                    path: matchedPath,
                    notFound,
                    redirect
                } = context.matched;

                if (notFound) {
                    const { request: { method, url }, response } = context;
                    console.log(`404   ${method.toUpperCase()}   ${url}  can\'t match any route`);
                    response.writeHead(404);
                    response.end();
                    return Promise.reject('404 Not found');
                }
                else if (!redirect) {
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

                        return Promise.reject(chalk.red(`> 🔴   Forbidden Hit! [${matchedPath}]`));
                    }

                    context.proxy = {
                        route: matchedRoute,
                        uri: proxyUrl,
                        URL: require('url').parse(proxyUrl)
                    };
                }


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
                const { path: matchedPath, redirectMeta = {} } = context.matched;

                const x = _request(proxyUrl, { gzip: true });
                setProxyRequestHeaders(x);

                return new Promise(resolve => {
                    let pluginOnProxyRespondPromise;

                    x.on('response', response => {
                        collectProxyResponseData(context);
                        /**
                        * Real proxy request
                        * Instance of http.ClientRequest
                        */
                        context.proxy.req = x.req;
                        /**
                         * Real proxy response
                         * Instance of http.IncomingMessage
                         */
                        context.proxy.response = response;
                        setResponseHeaders(response.headers);
                        res.writeHead(response.statusCode, response.statusMessage);

                        pluginOnProxyRespondPromise = Middleware_onProxyRespond(context);
                        pluginOnProxyRespondPromise.catch(() => { });
                    });

                    x.on('end', () => {
                        resolve(pluginOnProxyRespondPromise);
                    });

                    const xReqStream = req
                        .pipe(
                            through(function (chunk, enc, callback) {

                                /**
                                 * Middleware: on request pipe proxy request
                                 * @lifecycle onPipeRequest
                                 * @param {Object} context
                                 * @param {Buffer} chunk
                                 * @param {String} enc
                                 * @param {Function} next
                                 */
                                _invokePipeAllPlugin('onPipeRequest', context, chunk, enc, (err, value) => {
                                    this.push(err ? chunk : value);
                                    callback();
                                });

                            })
                        );

                    const xResStream = xReqStream
                        .pipe(x)
                        .pipe(
                            through(function (chunk, enc, callback) {

                                /**
                                 * Middleware: on proxy response pipe response
                                 * @lifecycle onPipeResponse
                                 * @param {Object} context
                                 * @param {Buffer} chunk
                                 * @param {String} enc
                                 * @param {Function} next
                                 */
                                _invokePipeAllPlugin('onPipeResponse', context, chunk, enc, (err, value) => {
                                    this.push(err ? chunk : value);
                                    callback();
                                });
                            })
                        );

                    xResStream.pipe(res);

                    info && console.log(chalk.green(`> Proxy [${matchedPath}]`) + `   ${method.toUpperCase()}   ${redirectMeta.matched ? chalk.yellow(url) : url}  ${chalk.green('>>>>')}  ${proxyUrl}`);

                    /**
                     * x is an instance of request.Request
                     */
                    context.proxy.request = x;

                    context.proxy.requestStream = xReqStream;
                    context.proxy.responseStream = xResStream;

                    collectRequestData(context);
                });
            })

            /**
             * Middleware: after proxy request
             * @lifecycle afterProxy
             * @param {Object} context
             * @returns {Object} context
             */
            .then((context) => Middleware_afterProxy(context))
            .catch(error => {
                if (!error instanceof PluginInterrupt || config.debug) {
                    console.error(error);
                    console.log();
                }
            })


        /********************************************************/
        /* Functions in Content ------------------------------- */
        /********************************************************/

        // Collect request data
        function collectRequestData(context) {

            const reqContentType = req.headers['content-type'];
            context.proxy.requestStream.pipe(concat(buffer => {
                const data = {
                    rawBuffer: buffer,
                    rawBody: buffer.toString(),
                    body: '',
                    query: querystring.parse(context.request.URL.query),
                    type: reqContentType
                };
                context.data = {
                    error: null,
                    request: data,
                    response: null
                };

                if (!data.rawBody || !reqContentType) return;

                try {
                    if (/application\/x-www-form-urlencoded/.test(reqContentType)) {
                        data.body = querystring.parse(data.rawBody);
                    } else if (/application\/json/.test(reqContentType)) {
                        data.body = JSON.parse(data.rawBody);
                    } else if (/multipart\/form-data/.test(reqContentType)) {
                        data.body = data.rawBody;
                    }
                } catch (error) {
                    info && console.log(' > Error: can\'t parse requset body. ' + error.message);
                }
            }));
        }

        // Collect response data
        function collectProxyResponseData(context) {
            const { request: proxyRequest, responseStream } = context.proxy;

            responseStream.pipe(concat(buffer => {
                const data = {
                    rawBuffer: buffer,
                    rawData: buffer.toString(),
                    data: '',
                    type: null,
                    size: 0,
                    encode: null
                };
                context.data.response = data;
                proxyRequest.on('error', err => {
                    context.data.error = err;
                    res.writeHead(503, 'Service Unavailable');
                    res.end('Connect to server failed with code ' + err.code);
                });

                data.size = Buffer.byteLength(data.rawData);

                try {
                    if (/json/.test(data.type = proxyRequest.response.headers['content-type'])) {
                        data.data = JSON.parse(fixJson(data.rawData));
                    }
                } catch (error) {
                    console.error(chalk.red(` > An error occurred (${error.message}) while parsing response data.`));
                }
            }))
        }


        // set headers for proxy request
        function setProxyRequestHeaders(proxyRequest) {
            const mergeList = [];
            const rewriteHeaders = {
                'Connection': 'close',
            };
            let _headers = req.headers;

            // originalHeaders < rewriteHeaders < userHeaders
            mergeList.push(rewriteHeaders);
            if (typeof (userHeaders.request) === 'object') {
                mergeList.push(userHeaders.request);
            }
            else if (typeof (userHeaders) === 'object') {
                mergeList.push(userHeaders);
            }

            _headers = Object.assign(_headers, ...mergeList);

            const formattedHeaders = formatHeaders(_headers);
            setHeadersFor(proxyRequest, formattedHeaders);
        }

        // set headers for response
        function setResponseHeaders(proxyResponseHeaders) {
            const mergeList = [];
            const rewriteHeaders = {
                'Transfer-Encoding': 'chunked',
                'Connection': 'close',
                'Via': 'dalao-proxy/' + version,
                'Access-Control-Allow-Origin': requestHost,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': 'Authorization, Token',
            };

            let _headers = proxyResponseHeaders;

            // originalHeaders < rewriteHeaders < userHeaders
            mergeList.push(rewriteHeaders);
            if (typeof (userHeaders.response) === 'object') {
                mergeList.push(userHeaders.response);
            }
            else if (typeof (userHeaders) === 'object') {
                mergeList.push(userHeaders);
            }

            _headers = Object.assign(_headers, ...mergeList);
            const formattedHeaders = formatHeaders(_headers);

            // response has been decoded
            delete formattedHeaders['Content-Encoding'];
            delete formattedHeaders['Content-Length'];
            setHeadersFor(res, formattedHeaders);
        }


        function setHeadersFor(target, headers) {
            for (const header in headers) {
                const value = headers[header];
                if (value) {
                    if (typeof (value) === 'string') {
                        target.setHeader(header, value);
                    }
                }
                else {
                    target.removeHeader(header);
                }
            }
        }


        /**
         * format headers to upper case word
         * @param {Object} headers
         */
        function formatHeaders(headers) {
            const formattedHeaders = {};
            Object.keys(headers).forEach(key => {
                const header = key.split('-').map(item => _.upperFirst(item.toLowerCase())).join('-');
                formattedHeaders[header] = headers[key];
            });
            return formattedHeaders;
        }


        /********************************************************/
        /* Middleware Functions in Content --------------------- */
        /********************************************************/

        // after request data resolved
        function Middleware_onRequest(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPluginsMiddlewares('onRequest', context, interrupter(context, resolve, reject));
            });
        }

        // on route match
        function Middleware_onRouteMatch(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPluginsMiddlewares('onRouteMatch', context, interrupter(context, resolve, reject));
            });
        }

        function Middleware_beforeProxy(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPluginsMiddlewares('beforeProxy', context, interrupter(context, resolve, reject));
            });
        }

        function Middleware_onProxyRespond(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPluginsMiddlewares('onProxyRespond', context, interrupter(context, resolve, reject));
            });
        }

        function Middleware_afterProxy(context) {
            _invokeAllPluginsMiddlewares('afterProxy', context);
        }
    }

    (function Middleware_beforeCreate() {
        _invokeAllPluginsMiddlewares('beforeCreate', { config }, new Function);
    })();
    return proxyRequest;
}


module.exports = {
    httpCallback: proxyRequestWrapper,
}
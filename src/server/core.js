const request = require('request');
const _ = require('lodash');

const {
    joinUrl,
    addHttpProtocol,
    isStaticResouce,
    splitTargetAndPath,
    transformPath,
} = require('../utils');

let shouldCleanUpAllConnections;
// * Why collect connections?
// When switch cache option(or config options), HTTP/1.1 will use `Connection: Keep-Alive` by default,
// which will cause client former TCP socket conection still work, or in short, it makes hot reload did
// not work immediately.
let connections = [];
let plugins = [];

function _invokeMethod(target, method, ...args) {
    if (!target) return;
    const targetMethod = target[method];
    if (typeof targetMethod === 'function') {
        targetMethod.call(target, ...args)
    }
}

// base function for invoke all middlewares
function _invokeAllPlugins(functionName, ...args) {
    plugins.forEach(plugin => {
        _invokeMethod(plugin, functionName, ...args);
    });
}

function noop() { }

function nonCallback(next) { next && next(false); }

// mainly function
function proxyRequestWrapper(config) {
    shouldCleanUpAllConnections = true;

    function proxyRequest(req, res) {
        const {
            target,
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

        const reqContentType = req.headers['content-type'];
        let reqRawBody = '';
        let reqParsedBody;

        // collect raw request data
        collectRequestData();

        // set response CORS
        setHeaders();

        Promise.resolve()
            .then(() => {
                const ctx = {
                    config,
                    req,
                    res,
                    data: reqParsedBody
                };
                return ctx;
            })
            // life cycle: on request data resolved
            .then(context => Middleware_onRequestData(context))

            // matching route
            .then(() => {
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
                let matchedRouter;

                // Matched Proxy
                if (mostAccurateMatch) {
                    proxyPath = mostAccurateMatch;
                    matchedRouter = proxyTable[proxyPath];

                    const context = {
                        config,
                        req,
                        res,
                        data: reqParsedBody,
                        matchedPath: proxyPath,
                        matchedRouter: matchedRouter,
                        proxyTable,
                    };
                    return {
                        matched: true,
                        context
                    };
                }

                // if the request not in the proxy table
                // default change request orign
                else {
                    let unmatchedUrl = target + url;

                    if (new RegExp(`\\b${host}:${port}\\b`).test(unmatchedUrl)) {
                        res.writeHead(403, {
                            'Content-Type': 'text/html; charset=utf-8'
                        });
                        res.end(`
                            <h1>🔴  403 Forbidden</h1>
                            <p>Path to ${unmatchedUrl} proxy cancelled</p>
                            <h3>Can NOT proxy request to proxy server address, which may cause endless proxy loop.</h3>
                        `);
                        console.log(`> 🔴   Forbidden Proxy! [${unmatchedUrl}]`.red);

                        return Promise.reject();
                    }

                    unmatchedUrl = addHttpProtocol(unmatchedUrl);

                    const context = {
                        req,
                        res,
                        unmatchedUrl,
                    };
                    return {
                        matched: false,
                        context
                    };
                }
            })

            // Route matching result
            .then(({ matched, context }) => {
                // life cycle: on proxy route matched
                if (matched) {
                    return Middleware_onRouteMatch(context);
                }
                // life cycle: before route dismatched
                else {
                    Middleware_onRouteMisMatch(context)
                        .then(() => {
                            req
                                .pipe(_request(unmatchedUrl))
                                .pipe(res);

                            return Promise.reject();
                        })
                }
            })

            .then(context => {
                const { matchedRouter, proxyPath } = context;
                // router config
                const {
                    path: overwritePath,
                    target: overwriteHost,
                    pathRewrite: overwritePathRewrite,
                } = matchedRouter;

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

                    console.log(`> 🔴   Forbidden Hit! [${proxyPath}]`.red);

                    return Promise.reject();
                }

                const ctx = Object.assign({}, context, {
                    proxyUrl
                });
                return ctx;
            })

            // life cycle: before proxy request
            .then(context => Middleware_beforeProxy(context))

            // Proxy request
            .then((context) => {
                const { proxyUrl, matchedPath, req, res } = context;
                const responseStream = req.pipe(_request(proxyUrl));
                responseStream.pipe(res);
                console.log(`> 🎯   Hit! [${matchedPath}]`.green + `   ${method.toUpperCase()}   ${url}  ${'>>>>'.green}  ${proxyUrl}`.white)

                const ctx = Object.assign({}, context, {
                    proxyResponse: responseStream
                });

                return ctx;
            })

            // life cycle: after proxy request
            .then(context => Middleware_afterProxy(context))






        /********************************************************/
        /* Functions in Content ------------------------------- */
        /********************************************************/

        function collectRequestData() {
            req.on('data', chunk => reqRawBody += chunk);
            req.on('end', () => {
                if (!reqRawBody) return;

                try {
                    if (/application\/x-www-form-urlencoded/.test(reqContentType)) {
                        reqParsedBody = require('querystring').parse(reqRawBody);
                    } else if (/application\/json/.test(reqContentType)) {
                        reqParsedBody = JSON.parse(reqRawBody);
                    } else if (/multipart\/form-data/.test(reqContentType)) {
                        reqParsedBody = reqRawBody;
                    }
                } catch (error) {
                    console.log(' > Error: can\'t parse requset body. ' + error.message);
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
        function Middleware_onRequestData(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPlugins('onRequestData', context, err => {
                    if (err) return reject(err);
                    else resolve(context);
                });
            });
        }

        // on route match
        function Middleware_onRouteMatch(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPlugins('onRouteMatch', context, err => {
                    if (err) return reject(err);
                    else resolve(context);
                });
            });
        }

        // on route match
        function Middleware_onRouteMisMatch(next) {
            const context = {
                config,
                req,
                res,
                data: reqParsedBody,
                proxyTable,
            };
            _invokeAllPlugins('onRouteMisMatch', context, next);
        }

        function Middleware_beforeProxy(context) {
            return new Promise((resolve, reject) => {
                _invokeAllPlugins('beforeProxy', context, err => {
                    if (err) return reject(err);
                    else resolve(context);
                });
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

class Plugin {
    /**
     * @param {String} id id of plugin
     * @param {String} pluginName
     */
    constructor(pluginName, id) {
        this.middleware = {};
        this.id = id || pluginName;
        try {
            this.middleware = require(pluginName);
        } catch (error) {
            let buildIns;
            if (buildIns = error.message.match(/^Cannot\sfind\smodule\s'(.+)'$/)) {
                console.log(`${error.message}. Please check if module '${buildIns[1]}' is installed`.red);
            }
            else {
                console.error(error);
            }
        }
    }

    _methodWrapper(method, replacement, ...args) {
        if (this.middleware[method]) {
            _invokeMethod(this.middleware, method, ...args);
        }
        else {
            replacement(args[1]);
        }
    }

    beforeCreate(context) {
        this._methodWrapper('beforeCreate', noop, context);
    }

    onRequestData(context, next) {
        this._methodWrapper('onRequestData', nonCallback, context, next);
    }

    onRouteMatch(context, next) {
        this._methodWrapper('onRouteMatch', nonCallback, context, next);
    }

    onRouteMisMatch(context, next) {
        this._methodWrapper('onRouteMisMatch', nonCallback, context, next);
    }

    beforeProxy(context, next) {
        this._methodWrapper('beforeProxy', nonCallback, context, next);
    }

    afterProxy(context) {
        this._methodWrapper('afterProxy', noop, context);
    }
}

module.exports = {
    httpCallback: proxyRequestWrapper,
    usePlugins
}
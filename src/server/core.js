let shouldCleanUpAllConnections;
// * Why collect connections?
// When switch cache option(or config options), HTTP/1.1 will use `Connection: Keep-Alive` by default,
// which will cause client former TCP socket conection still work, or in short, it makes hot reload did
// not work immediately.
let connections = [];

function proxyRequestWrapper(config) {
    shouldCleanUpAllConnections = true;
    
    function proxyRequest(req, res) {
        const {
            target,
            cacheDirname,
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

        // Matched Proxy
        if (mostAccurateMatch) {
            const proxyPath = mostAccurateMatch;
            // router config
            const {
                path: overwritePath,
                target: overwriteHost,
                pathRewrite: overwritePathRewrite,
                cache: overwriteCache,
                cacheContentType: overwriteCacheContentType,
                responseFilter,
                cacheMaxAge,
            } = proxyTable[proxyPath];

            const { target: overwriteHost_target, path: overwriteHost_path } = splitTargetAndPath(overwriteHost);
            const proxyedPath = overwriteHost_target + joinUrl(overwriteHost_path, overwritePath, matched[0]);
            const proxyUrl = transformPath(addHttpProtocol(proxyedPath), overwritePathRewrite);

            function logMatchedPath(cached) {
                process.stdout.write(`> 🎯   ${cached ? 'Cached' : 'Hit'}! [${proxyPath}]`.green);
                process.stdout.write(`   ${method.toUpperCase()}   ${url}  ${'>>>>'.green}  ${proxyUrl}`.white);
                process.stdout.write('\n');
            }

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
                return;
            }

            // Try to read cache
            // Cache Read Strategy:
            //      - `cache` option is `true`
            //      - `cacheDigit` field > 0
            //      - `cacheDigit` field is `*`
            //        `cacheDigit` field is considered to be `*` by default when it's empty
            if (overwriteCache) {
                checkAndCreateCacheFolder(cacheDirname);
                const cacheFileName = path
                    .resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`);
                const [cacheUnit = 'second', cacheDigit = '*'] = cacheMaxAge;
                try {
                    if (cacheDigit != 0 && fs.existsSync(cacheFileName)) {

                        const fileContent = fs.readFileSync(cacheFileName, 'utf8');
                        const jsonContent = JSON.parse(fileContent);

                        const cachedTimeStamp = jsonContent['CACHE_TIME'] || Date.now();
                        const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);

                        // need validate expire time
                        if (cacheDigit === '*') {
                            res.setHeader('X-Cache-Request', 'true');
                            res.setHeader('X-Cache-Expire-Time', 'permanently valid');
                            res.setHeader('X-Cache-Rest-Time', 'forever');

                            res.writeHead(200, {
                                'Content-Type': 'application/json'
                            });
                            res.end(fileContent);

                            logMatchedPath(true);
                            return;
                        }
                        // permanently valid
                        else {
                            // valid cache file
                            if (moment().isBefore(deadlineMoment)) {
                                res.setHeader('X-Cache-Request', 'true');
                                // calculate rest cache time
                                res.setHeader('X-Cache-Expire-Time', moment(deadlineMoment).format('llll'));
                                res.setHeader('X-Cache-Rest-Time', moment.duration(moment().diff(deadlineMoment)).humanize());

                                res.writeHead(200, {
                                    'Content-Type': 'application/json'
                                });
                                res.end(fileContent);

                                logMatchedPath(true);
                                return;
                            }
                            else {
                                // Do not delete expired cache automatically
                                // V0.6.4 2019.4.17
                                // fs.unlinkSync(cacheFileName);
                            }
                        }

                    }
                } catch (e) {
                    console.error(e);
                }
            }

            // real request proxy
            const responseStream = req.pipe(_request(proxyUrl));

            // cache the response data
            if (overwriteCache) {
                let responseData = [];
                responseStream.on('data', chunk => {
                    responseData.push(chunk);
                });

                responseStream.on('end', setResponseCache);

                function setResponseCache() {
                    try {
                        const buffer = Buffer.concat(responseData);
                        const response = responseStream.response;
                        const cacheFileName = path
                            .resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`)

                        // gunzip first
                        if (/gzip/.test(response.headers['content-encoding'])) {
                            responseData = zlib.gunzipSync(buffer);
                        }
                        // Only cache ajax request response
                        let contentTypeReg = /application\/json/;
                        if (overwriteCacheContentType.length) {
                            contentTypeReg = new RegExp(`(${
                                overwriteCacheContentType
                                    .map(it => it.replace(/^\s*/, '').replace(/\s*$/, ''))
                                    .join('|')
                            })`);
                        }
                        if (contentTypeReg.test(response.headers['content-type'])) {
                            const resJson = JSON.parse(fixJson(responseData.toString()));

                            if (_.get(resJson, responseFilter[0]) === responseFilter[1]) {
                                resJson.CACHE_INFO = 'Cached from Dalao Proxy';
                                resJson.CACHE_TIME = Date.now();
                                resJson.CACHE_TIME_TXT = moment().format('llll');
                                resJson.CACHE_DEBUG = {
                                    url,
                                    method,
                                    rawBody: reqRawBody,
                                    body: reqParsedBody
                                };
                                fs.writeFileSync(
                                    cacheFileName,
                                    JSON.stringify(resJson, null, 4),
                                    {
                                        encoding: 'utf8',
                                        flag: 'w'
                                    }
                                );

                                console.log('   > cached into [' + cacheFileName.yellow + ']');
                            }

                        }

                    } catch (error) {
                        console.error(` > An error occurred (${error.message}) while caching response data.`.red);
                    }
                }
            }

            responseStream.pipe(res);
            logMatchedPath();
            return;
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
                return;
            }

            unmatchedUrl = addHttpProtocol(unmatchedUrl);

            req
                .pipe(_request(unmatchedUrl))
                .pipe(res);
        }

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
    }

    return proxyRequest;
}

module.exports = {
    proxyRequestWrapper
}
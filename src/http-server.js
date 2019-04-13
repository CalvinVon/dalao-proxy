const moment = require('moment');
const http = require('http');
const path = require('path');
const URL = require('url');
const request = require('request');
const _ = require('lodash');
const zlib = require('zlib');
const fs = require('fs');

const {
    joinUrl,
    addHttpProtocol,
    url2filename,
    pathCompareFactory,
    transformPath,
} = require('./utils');

function proxyRequestWrapper(config) {
    const {
        target,
        cacheDirname,
        responseFilter,
        cacheMaxAge,
        host,
        port,
        headers,
        proxyTable,
    } = config;

    function proxyRequest(req, res) {
        const { method, url } = req;
        const { host: requestHost } = req.headers;
        const _request = request[method.toLowerCase()];
        let matched;

        const reqContentType = req.headers['Content-Type'] || req.headers['content-type'];
        let reqRawBody = '';
        let reqParsedBody;

        // req.setEncoding('utf8');

        req.on('data', chunk => reqRawBody += chunk);
        req.on('end', () => {
            if (/application\/x-www-form-urlencoded/.test(reqContentType)) {
                reqParsedBody = require('querystring').parse(reqRawBody);
            } else if (/application\/json/.test(reqContentType)) {
                reqParsedBody = JSON.parse(reqRawBody);
            } else if (/multipart\/form-data/.test(reqContentType)) {
                reqParsedBody = reqRawBody;
            }
        });

        // set response CORS
        setHeaders();

        // test url
        const reversedProxyPaths = Object.keys(proxyTable).sort(pathCompareFactory(-1));
        for (let index = 0; index < reversedProxyPaths.length; index++) {

            const proxyPath = reversedProxyPaths[index];
            // when proxy path is `/`, not need match word boundary
            const matchReg = new RegExp(`^${proxyPath}(.+)`);

            if (matched = url.match(matchReg)) {
                // router config
                const {
                    path: overwritePath,
                    target: overwriteHost,
                    pathRewrite: overwritePathRewrite,
                    cache: overwriteCache,
                } = proxyTable[proxyPath];

                const proxyedPath = overwriteHost + joinUrl(overwritePath, matched[1]);

                const proxyUrl = transformPath(addHttpProtocol(proxyedPath), overwritePathRewrite);

                function logMatchedPath(cached) {
                    process.stdout.write(`> 🎯   ${ cached ? 'Cached' : 'Hit' }! [${proxyPath}]`.green);
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

                // if cache option is on, try find current url cache
                // NOTE: only ajax request can be cached
                if (overwriteCache) {
                    const cacheFileName = path.resolve(
                        process.cwd(),
                        `./${cacheDirname}/${url2filename(method, url)}.json`
                    );
                    const [ cacheUnit = 'second', cacheDigit = '10' ] = cacheMaxAge;
                    try {
                        if (fs.existsSync(cacheFileName)) {

                            const fileContent = fs.readFileSync(cacheFileName, 'utf8');
                            const jsonContent = JSON.parse(fileContent);

                            const cachedTimeStamp = jsonContent['CACHE_TIME'];
                            const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);

                            // need validate expire time
                            if (Number(cacheDigit)) {
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
                                    fs.unlinkSync(cacheFileName);
                                }
                            }
                            // permanently valid
                            else {
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

                        }
                    } catch (e) {
                        console.error(e);
                    }
                }

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
                            if (/json/.test(response.headers['content-type'])) {
                                const resJson = JSON.parse(responseData.toString());

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
        }

        // if the request not in the proxy table
        // default change request orign
        if (!matched) {
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
    }

    return proxyRequest;
}

// attach server to port
function attachServerListener(server, config) {
    let { host, port } = config;

    server.on('listening', function () {
        console.log('\n> dalao has setup the Proxy for you 🚀'.green);
        console.log('> 😇  dalao is listening at 👉  ' + `http://${host}:${port}`.green);
        console.log('  You can enter `rs`,`restart`,`reload` to reload server anytime.'.gray);
        console.log('  You can enter `clean`,`cacheclr`,`cacheclean` to clean cached ajax data.'.gray);
    });

    server.on('error', function (err) {
        server.close();
        if (/EADDRINUSE/i.test(err.message)) {
            port++;
            console.log(`  Port ${port} has been used, dalao is trying to change port to ${port}`.grey);
            server.listen(port, host);
        }
        else {
            console.error(err);
        }
    });

    server.listen(port, host);
}

function createProxyServer(config) {

    // create server
    const server = http.createServer(proxyRequestWrapper(config));

    // attach server to port
    attachServerListener(server, config);

    return server;
}

exports.createProxyServer = createProxyServer;
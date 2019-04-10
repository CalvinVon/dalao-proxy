const http = require('http');
const path = require('path');
const URL = require('url');
const request = require('request');
const _ = require('lodash');
const zlib = require('zlib');
const fs = require('fs');
const Stream = require('stream');
const {
    isStaticResouce,
    completeUrl,
    url2filename,
    filename2url,
    pathCompareFactory,
    transformPath
} = require('./utils');

function proxyRequestWrapper(config) {
    const {
        target,
        static: staticTarget,
        cache,
        cacheDirname,
        responseFilter,
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
        res.setHeader('Via', 'HTTP/1.1 dalao-proxy');
        res.setHeader('Access-Control-Allow-Origin', requestHost);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Token');

        for (const header in headers) {
            res.setHeader(header.split('-').map(item => _.upperFirst(item.toLowerCase())).join('-'), headers[header]);
        }

        // test for static resource
        if (isStaticResouce(url)) {
            const _path = URL.parse(url).path;
            // if has set static target, proxy it
            if (staticTarget && requestHost === URL.parse(completeUrl(staticTarget)).hostname) {
                // replace host
                // let staticUrl = staticTarget + url;
                let staticUrl = completeUrl(staticTarget + _path);

                req.pipe(_request(staticUrl)).pipe(res);
                return;
            }
        }

        // test url
        const reversedProxyPaths = Object.keys(proxyTable).sort(pathCompareFactory(-1));
        for (let index = 0; index < reversedProxyPaths.length; index++) {
            const proxyPath = reversedProxyPaths[index];
            // when proxy path is `/`, not need match word boundary
            const matchReg = proxyPath === '/'
                ? new RegExp(`^(${proxyPath})`)
                : new RegExp(`^(${proxyPath})\\b`);

            if (matched = matchReg.test(url)) {
                const {
                    target: overwriteHost,
                    path: overwritePath,
                    rewrite: overwriteRewrite
                } = proxyTable[proxyPath];

                const proxyUrl = transformPath(proxyPath, overwriteHost, overwritePath, url, overwriteRewrite);

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

                process.stdout.write(`> 🎯   Target Hit! [${proxyPath}]`.green);
                process.stdout.write(`   ${method.toUpperCase()}   ${url}  ${'>>>>'.green}  ${proxyUrl}`.white);
                process.stdout.write('\n');

                // res.setHeader('Content-Encoding', 'gzip');

                // NOTE: only api can be cached
                // if cache option is on, try find current url cache
                if (cache) {
                    const cacheFileName = path.resolve(
                        process.cwd(),
                        `./${cacheDirname}/${url2filename(method, url)}`
                            .replace(/\?.+/, '')
                            .replace(/#.+/, '')
                    );
                    if (fs.existsSync(cacheFileName)) {
                        // res.writeHead(200, {
                        //     'Content-Type': 'application/json'
                        // });
                        res.setHeader('X-Cache-Request', 'true');
                        res.writeHead(200);
                        res.end(fs.readFileSync(cacheFileName, 'utf8'));
                        return;
                    }
                }

                const proxyStream = _request(proxyUrl);
                const orignStream = req.pipe(proxyStream);

                // proxyStream.setEncoding('utf8');

                // cache the response data
                if (cache) {
                    let responseData = [];
                    orignStream.on('data', chunk => {
                        responseData.push(chunk);
                    });

                    orignStream.on('end', () => {
                        try {
                            const buffer = Buffer.concat(responseData);
                            const response = orignStream.response;
                            const cacheFileName = path
                                .resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}`)
                                .replace(/\?.+/, '')
                                .replace(/#.+/, '');

                            // gunzip first
                            if (response.headers['content-encoding'].match(/gzip/)) {
                                responseData = zlib.gunzipSync(buffer);
                            }
                            // Ajax request cache
                            if (response.headers['content-type'].match(/json/)) {
                                const resJson = JSON.parse(responseData.toString());
                                if (_.get(resJson, (responseFilter[0] || 'code')) === (responseFilter[1] || 0)) {
                                    resJson.CACHE_INFO = 'Cached from Dalao Proxy';
                                    resJson.CACHE_TIME = new Date().toLocaleString('en');
                                    resJson.CACHE_DEBUG = {
                                        url,
                                        method,
                                        rawBody: reqRawBody,
                                        body: reqParsedBody
                                    };
                                    fs.writeFileSync(
                                        cacheFileName + '.json',
                                        JSON.stringify(resJson, null, 4),
                                        {
                                            encoding: 'utf8',
                                            flag: 'w'
                                        }
                                    );

                                    console.log('   > cached into [' + cacheFileName.yellow + ']');
                                }

                            }
                            else {
                                fs.writeFileSync(
                                    cacheFileName,
                                    responseData,
                                    {
                                        encoding: 'utf8',
                                        flag: 'w'
                                    }
                                );

                                console.log('   > cached into [' + cacheFileName.yellow + ']');
                            }

                        } catch (error) {
                            console.error(` > An error occurred (${error.message}) while caching response data.`.red);
                        }
                    })
                }

                orignStream.pipe(res);
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

            unmatchedUrl = completeUrl(unmatchedUrl);

            req
                .pipe(_request(unmatchedUrl))
                .pipe(res);
        }
    }

    return proxyRequest;
}

function createProxyServer(config) {

    const server = http.createServer(proxyRequestWrapper(config));

    server.listen(config.port, function () {
        console.log('\n> dalao has setup the Proxy for you 🚀'.green);
        console.log('> 😇  dalao is listening at 👉  ' + `http://${config.host}:${config.port}`.green);
        console.log('You can enter `rs`,`restart`,`reload` to reload server anytime.'.gray);
    });

    return server;
}

exports.createProxyServer = createProxyServer;
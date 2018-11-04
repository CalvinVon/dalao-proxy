const http = require('http');
const request = require('request');
const _ = require('lodash');
const createGzip = require('zlib').createGzip;
const { HTTP_PREFIX_REG, pathCompareFactory, transformPath } = require('./utils');

function createProxyServer (config) {

    const {
        target,
        host,
        port,
        headers,
        proxyTable,
    } = config;

    const server = http.createServer(function proxyRequest(req, res) {
        const { method, url } = req;
        const { host: requestHost } = req.headers;
        const _request = request[method.toLowerCase()];
        let matched;

        // set response CORS
        res.setHeader('Via', 'HTTP/1.1 dalao-proxy');
        res.setHeader('Access-Control-Allow-Origin', requestHost);
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, PATCH');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Token');
        
        for (const header in headers) {
            res.setHeader(_.upperFirst(_.upperFirst(header)), headers[header]);
        }

        // test url
        const reversedProxyPaths = Object.keys(proxyTable).sort(pathCompareFactory(-1));
        for (let index = 0; index < reversedProxyPaths.length; index++) {
            const proxyPath = reversedProxyPaths[index];
            const matchReg = new RegExp(`^(${proxyPath})\\b`);
            if (matched = matchReg.test(url)) {
                const {
                    target: overwriteHost,
                    path: overwritePath,
                    rewrite: overwriteRewrite
                } = proxyTable[proxyPath];

                const proxyUrl = transformPath(proxyPath, overwriteHost, overwritePath, url, overwriteRewrite);

                if (new RegExp(`\\b${host}:${port}\\b`).test(overwriteHost)) {
                    res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
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

                req
                    .pipe(_request(proxyUrl))
                    // .pipe(createGzip())
                    .pipe(res);
                return;
            }
        }

        // if the request not in the proxy table
        // default change request orign
        if (!matched) {
            let unmatchedUrl = target + url;

            if (new RegExp(`\\b${host}:${port}\\b`).test(unmatchedUrl)) {
                res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <h1>🔴  403 Forbidden</h1>
                    <p>Path to ${unmatchedUrl} proxy cancelled</p>
                    <h3>Can NOT proxy request to proxy server address, which may cause endless proxy loop.</h3>
                `);
                console.log(`> 🔴   Forbidden Proxy! [${unmatchedUrl}]`.red);
                return;
            }

            if (!HTTP_PREFIX_REG.test(unmatchedUrl)) {
                unmatchedUrl = 'http://' + unmatchedUrl;
            }

            // res.setHeader('Content-Encoding', 'gzip');
            req
                .pipe(_request(unmatchedUrl))
                // .pipe(createGzip())
                .pipe(res);
        }
    });

    server.listen(port, function () {
        console.log('\n> dalao has setup the Proxy for you 🚀'.green);
        console.log('> 😇  dalao is listening at 👉  ' + `http://${host}:${port}`.green);
    });

    return server;
}

exports.createProxyServer = createProxyServer;
const http = require('http');
const request = require('request');
const _ = require('lodash');
const createGzip = require('zlib').createGzip;
const { pathCompareFactory } = require('./utils');

const HTTP_PREFIX_REG = new RegExp(/^(https?:\/\/)/);

/**
 * Proxy path transformer
 * @param {String} proxyPath proxy matched path
 * @param {String} targetPath proxy target path
 * @param {String} path origin path
 * @param {Boolean} rewrite rewrite proxy matched path
 */
function transformPath (proxyPath, overwriteHost, overwritePath, url, rewrite) {
    let transformedUrl;
    let matched = overwriteHost.match(HTTP_PREFIX_REG);

    url = url.replace(HTTP_PREFIX_REG, '');

    if (rewrite) {
        const rewritedPath = url.replace(proxyPath, overwritePath)
        transformedUrl = joinUrl([overwriteHost, rewritedPath]);
    }
    else {
        transformedUrl = joinUrl([overwriteHost, overwritePath, url]);
    }

    if (matched) {
        transformedUrl = matched[1] + transformedUrl;
    }
    else {
        transformedUrl = 'http://' + transformedUrl;
    }

    return transformedUrl;
}

function joinUrl(urls) {
    return urls.map(url => url.replace(HTTP_PREFIX_REG, '')).join('/').replace(/\/{2,}/g, '/');
}

function createProxyServer (config) {

    const {
        target,
        host,
        port,
        headers,
        proxyTable,
        rewrite,
        cache,
    } = config;

    const Table = require('cli-table');

    // parse provided proxy table
    const outputTable = new Table({
        head: ['Proxy'.yellow, 'Target'.white, 'Rewrite Path'.white, 'Result'.yellow]
    });
    
    const proxyPaths = Object.keys(proxyTable).sort(pathCompareFactory(1));
    proxyPaths.forEach(proxyPath => {
        let {
            path: overwritePath,
            target: overwriteTarget,
            rewrite: overwriteRewrite
        } = proxyTable[proxyPath];

        // no value provided, replace with global/default value
        if (_.isUndefined(overwritePath)) {
            proxyTable[proxyPath].path = proxyPath;
            overwritePath = proxyPath;
        }

        if (_.isUndefined(overwriteTarget)) {
            proxyTable[proxyPath].target = target;
            overwriteTarget = target;
        }

        if (_.isUndefined(overwriteRewrite)) {
            proxyTable[proxyPath].rewrite = rewrite;
            overwriteRewrite = rewrite;
        }

        outputTable.push([
            proxyPath,
            overwriteTarget + overwritePath,
            overwriteRewrite,
            transformPath(proxyPath, overwriteTarget, overwritePath, proxyPath, overwriteRewrite)
        ]);
        // console.log('\n> %s \t-->\t %s:%s'.green, overwritePath, proxyTarget, proxyPath);
    });

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
                process.stdout.write(`   ${method.toUpperCase()}   ${url}  >>>>  ${proxyUrl}`.white);
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
        console.log(outputTable.toString().green);
        console.log('\n> dalao has setup the Proxy for you 🚀'.green);
        console.log('> 😇  dalao in waiting 👉  ' + `http://${host}:${port}`.green);
    });

    return server;
}

exports.transformPath = transformPath;
exports.createProxyServer = createProxyServer;
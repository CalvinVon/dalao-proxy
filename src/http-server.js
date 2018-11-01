const http = require('http');
const request = require('request');
const _ = require('lodash');

/**
 * Proxy path transformer
 * @param {String} proxyPath proxy matched path
 * @param {String} targetPath proxy target path
 * @param {String} path origin path
 * @param {Boolean} rewrite rewrite proxy matched path
 */
function transformPath (proxyPath, overwriteHost, overwritePath, url, rewrite) {
    if (rewrite) {
        const rewritedPath = url.replace(proxyPath, overwritePath)
        return joinUrl([overwriteHost, rewritedPath]);
    }
    else {
        return joinUrl([overwriteHost, overwritePath, url]);
    }
}

function joinUrl(urls) {
    return urls.join('/').replace(/\/{2,}/g, '/');
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
    
    const proxyPaths = Object.keys(proxyTable);
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
        const _request = request[method.toLowerCase()];
        let matched;

        // test url
        for (const proxyPath in proxyTable) {
            const matchReg = new RegExp(`^(${proxyPath})\\b`);
            if (matched = matchReg.test(url)) {
                const {
                    target: overwriteHost,
                    path: overwritePath,
                    rewrite: overwriteRewrite
                } = proxyTable[proxyPath];

                const proxyUrl = transformPath(proxyPath, overwriteHost, overwritePath, url, overwriteRewrite);

                req.pipe(_request(proxyUrl)).pipe(res);
                break;
            }
        }

        // if the request not in the proxy table
        // default change request orign
        if (!matched) {
            req.pipe(request[method.toLowerCase()](target + url)).pipe(res);
        }
    });

    server.listen(port, function () {
        console.log(outputTable.toString().green);
        console.log('\n> 😏  dalao has setup the Proxy for you'.blue);
        console.log('\n> 😇  dalao in waiting 👉  ' + `http://${host}:${port}`.blue);
    });

    return server;
}

exports.transformPath = transformPath;
exports.createProxyServer = createProxyServer;
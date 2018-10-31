const http = require('http');
const request = require('request');

exports.createProxyServer = function (config) {
    const {
        target,
        host,
        port,
        cache
    } = config;

    const server = http.createServer(function (req, res) {
        req.pipe(request(target)).pipe(res);
    });

    server.listen(port, function () {
        console.log('\n> dalao has setup the Proxy'.blue);
        console.log('\n> dalao in waiting you at ' + `http://${host}:${port}`.blue);
    });
    return server;
}
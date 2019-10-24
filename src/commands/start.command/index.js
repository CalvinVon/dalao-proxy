const baseConfig = require('../../../config');
const ProxyServer = require('../../server');

module.exports = function startCommand(program, callback) {
    program
        .version(baseConfig.version)
        .command('start')
        .description('start proxy server')
        .option('-C, --config <filepath>', 'use custom config file')
        .option('-w, --watch', 'reload when config file changes')
        .option('-P, --port <port>', 'custom proxy server listening port')
        .option('-H, --host <hostname>', 'custom proxy server hostname')
        .option('-t, --target <proxyTarget>', 'target server to proxy')
        .option('-c, --cache', 'enable request cache')
        .option('-i, --info', 'enable log print')
        .action(function () {
            program.enableInput();
            // start a proxy server
            const proxyServer = ProxyServer.createProxyServer(program);
            callback(proxyServer);
        });
};
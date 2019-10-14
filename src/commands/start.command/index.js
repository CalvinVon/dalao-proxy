const baseConfig = require('../../../config');
const ProxyServer = require('../../server');
let proxyServer;

module.exports = function startCommand(program, callback) {
    program
        .version(baseConfig.version)
        .command('start')
        .description('auto detect config & start proxy server'.green)
        .option('-C, --config <filepath>', 'use custom config file')
        .option('-w, --watch', 'reload when config file changes')
        .option('-P, --port <port>', 'custom proxy server listening port')
        .option('-H, --host <hostname>', 'custom proxy server hostname')
        .option('-t, --target <proxyTarget>', 'target server to proxy')
        .option('-c, --cache', 'enable request cache')
        .option('-i, --info', 'enable log print')
        .action(function () {
            if (proxyServer) {
                proxyServer.close();
            }

            // start a proxy server
            proxyServer = ProxyServer.createProxyServer(program);
            
            callback(proxyServer);
        });
};
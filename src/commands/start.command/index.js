const baseConfig = require('../../../config');
const printWelcome = require('../../../src').printWelcome;
const ProxyServer = require('../../server');
const parserEmitter = require('../../parser/config-parser').emitter;

let proxyServer;

module.exports = function startCommand(program) {
    program
        .version(baseConfig.version)
        .command('start')
        .description('start proxy server')
        .option('-w, --watch', 'reload when config file changes')
        .option('-P, --port <port>', 'custom proxy server listening port')
        .option('-H, --host <hostname>', 'custom proxy server hostname')
        .option('-t, --target <proxyTarget>', 'target server to proxy')
        .option('-c, --cache', 'enable request cache')
        .option('-i, --info', 'enable log print')
        .action(function (command) {
            printWelcome(baseConfig.version);
            program.enableInput();

            // On config parsed
            parserEmitter.on('config:parsed', function () {
                if (proxyServer) {
                    proxyServer.close();
                }

                proxyServer = ProxyServer.createProxyServer(command);
            });
        });
};
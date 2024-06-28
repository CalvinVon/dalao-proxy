const baseConfig = require('../../../config');
const { printWelcome } = require('../../utils');
const ProxyServer = require('../../server');
const parserEmitter = require('../../parser/config-parser').emitter;

let proxyServer;

module.exports = function startCommand(program, register) {
    register.addLineCommand('rs', 'restart', 'reload');
    
    program
        .version(baseConfig.version)
        .command('start')
        .description('Start the proxy server')
        .option('-s, --secure', 'enable https server')
        .option('-w, --watch', 'reload when config file changes')
        .option('-P, --port <port>', 'custom proxy server listening port')
        .option('-H, --host <hostname>', 'custom proxy server hostname')
        .option('-t, --target <proxyTarget>', 'target server to proxy')
        .option('-i, --logger', 'enable log print')
        .action(function (command) {
            printWelcome(baseConfig.version);
            program.enableInput();

            // On config parsed
            parserEmitter.on('config:parsed', async function () {
                if (proxyServer) {
                    proxyServer.close(async () => {
                        proxyServer = await ProxyServer.createProxyServer(command);
                    });
                }
                else {
                    proxyServer = await ProxyServer.createProxyServer(command);
                }

            });
        });
};
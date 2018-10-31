const ConfigParser = require('./config-parser');
const ProxyServer = require('./http-server');

module.exports = function Startup (program) {
    const { info } = program;

    let proxyServer;
    
    // registe listener
    ConfigParser.parseEmitter.on('config:parsed', function (config) {
        if (info) {
            console.log('> parsed user configuration'.yellow)
            console.log(config);
        }

        if (proxyServer) {
            proxyServer.close();
        }

        // start a proxy server
        proxyServer = ProxyServer.createProxyServer(config);
    });

    // start to parse
    ConfigParser.parse(program);

}
const ConfigParser = require('./config-parser');
const ProxyServer = require('./http-server');
const ConfigGenerator = require('./generate-config');

/**
 * Config Parse & Start Proxy Server
 */
exports.Startup = function Startup (program) {

    let proxyServer;
    
    // registe listener
    ConfigParser.parseEmitter.on('config:parsed', function (config) {
        const { info } = config;

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

};

/**
 * Generate Config File Based By User Input
 */
exports.Init = function Init (program) {
    const preHint = `
This utility will walk you through creating a config file.
It only covers the most common items, and tries to guess sensible defaults.

See \`dalao --help\` for definitive documentation on these fields
and exactly what they do.

Press ^C at any time to quit.
`;

    console.log(preHint);
    ConfigGenerator(program);
};

exports.printWelcome = function printWelcome () {
    let str = '';
    str += '________           .__                    __________                                 \n';
    str += '\\______ \\  _____   |  |  _____     ____   \\______   \\_______   ____  ___  ___ ___.__.\n';
    str += ' |    |  \\ \\__  \\  |  |  \\__  \\   /  _ \\   |     ___/\\_  __ \\ /  _ \\ \\  \\/  /<   |  |\n';
    str += ' |    `   \\ / __ \\_|  |__ / __ \\_(  <_> )  |    |     |  | \\/(  <_> ) >    <  \\___  |\n';
    str += '/_______  /(____  /|____/(____  / \\____/   |____|     |__|    \\____/ /__/\\_ \\ / ____|\n';
    str += '        \\/      \\/            \\/                                           \\/ \\/     \n';
    console.log(str.blue);
};
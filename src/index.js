const ConfigParser = require('./config-parser');
const ProxyServer = require('./http-server');
const ConfigGenerator = require('./generate-config');

const rm = require('rimraf');
const path = require('path');

let _program;

/**
 * Config Parse & Start Proxy Server
 * @return {EventEmitter} ConfigParser.parseEmitter
 */
exports.Startup = function Startup (program) {

    _program = program;

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
    setImmediate(function() {
        ConfigParser.parse(program);
    });
    return ConfigParser.parseEmitter;
};

/**
 * Reparse configuration, and reload program
 */
exports.Reload = function Reload () {
    console.clear();
    console.log('\n> dalao is reloading...'.green);
    ConfigParser.parse(_program);
};

exports.CleanCache = function CleanCache(config) {
    const cacheDir = path.join(process.cwd(), config.cacheDirname, './*.json');
    rm(cacheDir, err => {
        if (err) {
            console.log(' > [error] something wrong happened during clean cache'.red, err);
        }
        else {
            console.log(' > [info] dalao cache has been cleaned!'.green);
        }
    })
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

exports.printWelcome = function printWelcome (version) {
    let str = '';
    // str += '________           .__                    __________                                 \n';
    // str += '\\______ \\  _____   |  |  _____     ____   \\______   \\_______   ____  ___  ___ ___.__.\n';
    // str += ' |    |  \\ \\__  \\  |  |  \\__  \\   /  _ \\   |     ___/\\_  __ \\ /  _ \\ \\  \\/  /<   |  |\n';
    // str += ' |    `   \\ / __ \\_|  |__ / __ \\_(  <_> )  |    |     |  | \\/(  <_> ) >    <  \\___  |\n';
    // str += '/_______  /(____  /|____/(____  / \\____/   |____|     |__|    \\____/ /__/\\_ \\ / ____|\n';
    // str += '        \\/      \\/            \\/                                           \\/ \\/     \n';
    str += ' ___    __    _      __    ___       ___   ___   ___   _     _    \n';
    str += '| | \\  / /\\  | |    / /\\  / / \\     | |_) | |_) / / \\ \\ \\_/ \\ \\_/ \n';
    str += '|_|_/ /_/--\\ |_|__ /_/--\\ \\_\\_/     |_|   |_| \\ \\_\\_/ /_/ \\  |_|  \n';
    console.log(str.yellow);
    console.log('「Dalao Proxy」 '.yellow, ('v' + version).green);
    console.log('\n');
};
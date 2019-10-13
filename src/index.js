const program = require('commander');
const { Command } = require('commander');
const ConfigParser = require('./parser/config-parser');
const MockFileGenerator = require('./scripts/generate-mock');
const { Plugin, pluginEmitter } = require('./plugin');

program.context = {};

exports.ConfigParser = ConfigParser;
exports.parserEmitter = ConfigParser.emitter;

// Commands
exports.commands = {
    start: require('./commands/start.command'),
    init: require('./commands/init.command'),
    addPlugin: require('./commands/add-plugin.command'),
};

const rm = require('rimraf');
const path = require('path');

const originCommandFn = Command.prototype.command;
const originActionFn = Command.prototype.action;

Command.prototype.command = function commandWrapper() {
    const commandName = arguments[0];
    this.on('command:' + commandName, function () {
        this.context.command = commandName;
        pluginEmitter.emit('command:' + commandName, arguments);
    });
    return originCommandFn.apply(this, arguments);
};

Command.prototype.action = function actionWrapper() {
    return originActionFn.apply(this, arguments);
};

exports.program = program;
program.use = function use(register, callback) {
    register.call(program, program, callback);
};


exports.CleanCache = function CleanCache(config) {
    const cacheDir = path.join(process.cwd(), config.cacheDirname || '.dalao-cache', './*.js**');
    rm(cacheDir, err => {
        if (err) {
            console.log('  [error] something wrong happened during clean cache'.red, err);
        }
        else {
            console.log('  [info] dalao cache has been cleaned!'.green);
        }
    })
};


/**
 * Generate Base Mock File
 */
exports.Mock = function GenerateMock(program, method, runtimeConfig) {
    MockFileGenerator(program, method, runtimeConfig);
};

exports.printWelcome = function printWelcome(version) {
    let str = '';
    // str += '________           .__                    __________                                 \n';
    // str += '\\______ \\  _____   |  |  _____     ____   \\______   \\_______   ____  ___  ___ ___.__.\n';
    // str += ' |    |  \\ \\__  \\  |  |  \\__  \\   /  _ \\   |     ___/\\_  __ \\ /  _ \\ \\  \\/  /<   |  |\n';
    // str += ' |    `   \\ / __ \\_|  |__ / __ \\_(  <_> )  |    |     |  | \\/(  <_> ) >    <  \\___  |\n';
    // str += '/_______  /(____  /|____/(____  / \\____/   |____|     |__|    \\____/ /__/\\_ \\ / ____|\n';
    // str += '        \\/      \\/            \\/                                           \\/ \\/     \n';
    str += ' ___    __    _      __    ___       ___   ___   ___   _     _    \n';
    str += '| | \\  / /\\  | |    / /\\  / / \\     | |_) | |_) / / \\ \\ \\_/ \\ \\_/ \n';
    str += '|_|_/ /_/--\\ |_|__ /_/--\\ \\_\\_/     |_|   |_| \\ \\_\\_/ /_/ \\  |_|  \n\n';
    str += '                                             ';

    console.log(str.yellow, 'Dalao Proxy'.yellow, ('v' + version).green);
    console.log('                                            powered by CalvinVon');
    console.log('                        https://github.com/CalvinVon/dalao-proxy'.grey);
    console.log('\n');
};

exports.usePlugins = function usePlugins(program, { plugins: pluginsNames }) {
    program.context.plugins = [];
    pluginsNames.forEach(name => {
        const plugin = new Plugin(name);
        program.context.plugins.push(plugin);
        plugin.register(program);
    });
}
const program = require('commander');
const { Command } = require('commander');
const ConfigParser = require('./parser/config-parser');
const { Plugin, register } = require('./plugin');

exports.ConfigParser = ConfigParser;
exports.parserEmitter = ConfigParser.emitter;

// Commands
exports.commands = {
    start: require('./commands/start.command'),
    init: require('./commands/init.command'),
    addPlugin: require('./commands/add-plugin.command'),
};


const originCommandFn = Command.prototype.command;
const originActionFn = Command.prototype.action;

// Expose states so plugins can access
Command.prototype.context = {
    config: null,
    server: null,
    command: null,
    plugins: [],
    output: {},
};

Command.prototype.command = function commandWrapper() {
    const commandName = arguments[0];
    this.on('command:' + commandName, function () {
        this.context.command = commandName;
        register.emit('command:' + commandName, arguments);
    });
    return originCommandFn.apply(this, arguments);
};

Command.prototype.action = function actionWrapper(callback) {
    const that = this;
    return originActionFn.call(this, function callbackWrapper() {
        callback.apply(this, arguments);
    });
};

exports.program = program;
program.use = function use(command, callback) {
    command.call(program, program, callback);
};

exports.usePlugins = function usePlugins(program, { plugins: pluginsNames }) {
    program.context.plugins = [];
    pluginsNames.forEach(name => {
        program.context.plugins.push(new Plugin(name, program));
    });
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

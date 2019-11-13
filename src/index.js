const chalk = require('chalk');
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
// Expose states so plugins can access
Command.prototype.context = {
    command: null,          // current (sub)command
    commandName: null,      // current (sub)command name
    config: null,           // plugin configurable
    configPath: null,
    server: null,           // plugin configurable
    plugins: [],
    output: {},             // plugin configurable
};

/**
 * @public
 * Find subcommand by name
 */
Command.prototype.findCommand = function findCommand(subcommandName) {
    return this.commands.find(it => it._name === subcommandName);
};


/**
 * @public
 * Overwrite original method and adding extra features
 */
Command.prototype.command = function commandWrapper() {
    const commandName = arguments[0].split(/ +/).shift();
    this.on('command:' + commandName, function () {
        this.context.command = this.findCommand(commandName);
        this.context.commandName = commandName;
        register.emit('command:' + commandName, arguments);
    });
    return originCommandFn.apply(this, arguments);
};

/**
 * @private
 */
Command.prototype.use = function use(command, callback) {
    command.call(this, this, callback);
};


/**
 * @public
 * Enable program read user input and emit 'input' event
 */
Command.prototype.enableInput = function () {
    this._enableInput = true;
};

exports.program = new Command();

exports.usePlugins = function usePlugins(program, pluginsNames) {
    program.context.plugins = [];
    register._reset();

    pluginsNames.forEach(name => {
        program.context.plugins.push(new Plugin(name, program));
    });
};


exports.printWelcome = function printWelcome(version) {
    let str = '';
    str += ' ___    __    _      __    ___       ___   ___   ___   _     _    \n';
    str += '| | \\  / /\\  | |    / /\\  / / \\     | |_) | |_) / / \\ \\ \\_/ \\ \\_/ \n';
    str += '|_|_/ /_/--\\ |_|__ /_/--\\ \\_\\_/     |_|   |_| \\ \\_\\_/ /_/ \\  |_|  \n\n';
    str += '                                             ';

    console.log(chalk.yellow(str), chalk.yellow('Dalao Proxy'), chalk.green('v' + version));
    console.log('                                            powered by CalvinVon');
    console.log(chalk.grey('                        https://github.com/CalvinVon/dalao-proxy'));
    console.log('\n');
};

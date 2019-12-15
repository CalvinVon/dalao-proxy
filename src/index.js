const chalk = require('chalk');
const { Command, Option } = require('commander');
const defaultConfig = require('../config');
const ConfigParser = require('./parser/config-parser');
const { Plugin, register } = require('./plugin');

exports.ConfigParser = ConfigParser;
exports.parserEmitter = ConfigParser.emitter;

// Commands
exports.commands = {
    start: require('./commands/start.command'),
    init: require('./commands/init.command'),
    pluginManager: require('./commands/plugin-manager.command')
};

const originCommandFn = Command.prototype.command;
const originOptionFn = Command.prototype.option;
// Expose states so plugins can access
Command.prototype.context = {
    /**
     * the entry command
     */
    program: null,
    /**
     * the current (sub)command
     */
    command: null,
    /**
     * the current (sub)command name
     */
    commandName: null,
    /**
     * parsed options values
     */
    options: {},
    /**
     * user's raw config
     * @description Notice that it may not exist
     */
    rawConfig: null,
    /**
     * *configurable*
     * 
     * parsed core config
     * 
     * @description the config is **not parsed immediately** in **`command#action()`** method,
     *  at the meantime, the config value is only the result of simply merged user's config with the default
     *  config, you need to use **`register`** object to **configure/access** the value after parsed.
     */
    config: {},
    /**
     * user's config file path
     */
    configPath: null,
    /**
     * default config
     */
    defaultConfig,
    /**
     * *configurable*
     * 
     * Core proxy server
     */
    server: null,
    /**
     * runtime plugins list
     */
    plugins: [],
    /**
     * *configurable*
     * 
     * program output
     */
    output: {},
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
    this.on('command:' + commandName, () => {
        this.context.command = this.findCommand(commandName);
        this.context.commandName = commandName;
        register.emit('command:' + commandName, arguments);
    });
    return originCommandFn.apply(this, arguments);
};

Command.prototype.option = function optionWrapper(flags, description, fn, defaultValue) {
    originOptionFn.call(this, flags, description, fn, defaultValue);
    const option = new Option(flags, description);
    const optionName = option.name();
    this.on('option:' + optionName, val => {
        this.context.options[optionName] = val || this[optionName];
    });

    return this;
};

Command.prototype.forwardSubcommands = function () {
    var self = this;
    var listener = function (args, unknown) {
        // Parse any so-far unknown options
        args = args || [];
        unknown = unknown || [];

        var parsed = self.parseOptions(unknown);
        if (parsed.args.length) args = parsed.args.concat(args);
        unknown = parsed.unknown;

        // Output help if necessary
        if (!args.length || (unknown.includes('--help') || unknown.includes('-h')) && (!args || !self.listeners('command:' + args[0]))) {
            self.outputHelp();
            process.exit(0);
        }

        self.parseArgs(args, unknown);
    };

    if (this._args.length > 0) {
        console.error('forwardSubcommands cannot be applied to command with explicit args');
    }

    var parent = this.parent || this;
    var name = parent === this ? '*' : this._name;
    parent.on('command:' + name, listener);
    if (this._alias) parent.on('command:' + this._alias, listener);

    this.on('command:*', function () {
        this.help();
    });
    return this;
};

/**
 * @private
 */
Command.prototype.use = function use(command, callback) {
    command.call(this, this, callback);
    return this;
};


/**
 * @public
 * Enable program read user input and emit 'input' event
 */
Command.prototype.enableInput = function () {
    this._enableInput = true;
};

const entryProgram = new Command();
entryProgram.context.program = entryProgram;
exports.program = entryProgram;

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

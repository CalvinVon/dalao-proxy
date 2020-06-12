const { Command, Option } = require('commander');
const CommandContext = require('./context');
const ConfigParser = require('./parser/config-parser');
const { register } = require('./plugin');
const Runtime = require('./runtime');


const originCommandFn = Command.prototype.command;
const originOptionFn = Command.prototype.option;
const originActionFn = Command.prototype.action;


Command.DALAO_ENV = {
    development: 'DEV'
};

Command.DALAO_WORKER = {
    worker: 'DALAO_WORKER',
    master: 'DALAO_MASTER'
};

// Expose states so plugins can access
Command.prototype.context = Command.context = new CommandContext();

/**
 * @public
 */
Command.prototype.reload = function reloadProgram() {
    Runtime.reloadProgram(this.context.program);
};



/**
 * @public
 */
Command.prototype.use = function use(command) {
    command.call(this, this, register);
    return this;
};


/**
 * @public
 * Find subcommand by name
 */
Command.prototype.findCommand = function findCommand(subcommandName) {
    return subcommandName && this.commands.find(it => it.name() === subcommandName || it.alias() === subcommandName);
};


/**
 * @public
 * Overwrite command action function
 */
Command.prototype.overwriteAction = function (overwriteFn) {
    const self = this;
    removeActionListener(this._name);
    if (this._alias) {
        removeActionListener(this._alias);
    }
    this.action(overwriteFn);

    function removeActionListener(name) {
        const listenerName = 'command:' + name;
        const parent = self.parent || self;
        const listeners = parent.listeners(listenerName);
        if (listeners.length > 1) {
            parent.removeListener(listenerName, listeners.pop());
        }
    }
};


/**
 * @public
 * Enable the program read user input and emit 'input' event
 */
Command.prototype.enableInput = function () {
    this.context.program._enableInput = true;
};


/**
 * @public
 * Enable the server collect each real proxy request's data and response's data
 */
Command.prototype.enableCollectData = function () {
    this.context.program._collectingData = true;
};

/**
 * @public
 * Enable the server collect each client request's data and response's data
 */
Command.prototype.enableCollectProxyData = function () {
    this.context.program._collectingProxyData = true;
};

/**
 * @public
 * Return whether the server is collecting real proxy data
 * * @returns {Boolean}
 */
Command.prototype.isCollectingData = function () {
    return this.context.program._collectingData;
};


/**
 * @public
 * Return whether the server is collecting client data
 * * @returns {Boolean}
 */
Command.prototype.isCollectingProxyData = function () {
    return this.context.program._collectingProxyData;
};


/**
 * @public
 * The program is a worker process
 * @returns {Boolean}
 */
Command.prototype.isWorker = function () {
    return process.env.DALAO_WORKER === Command.DALAO_WORKER.worker;
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
    const optionAttributeName = option.attributeName();
    this.on('option:' + optionName, val => {
        this.context.options[optionAttributeName] = val || this[optionAttributeName];
    });

    return this;
};

Command.prototype.action = function actionWrapper(callback) {
    this._actionFn = callback;
    return originActionFn.call(this, (...args) => {
        this.options.forEach(option => {
            const optionAttributeName = option.attributeName();
            this.context.options[optionAttributeName] = this[optionAttributeName];
        });
        return callback.call(this, ...args);
    })
};


/**
 * forward subcommand
 * @description the `fn` parameter is called just like `#action` method when no subcommand called
 * @param {Function} [fn]
 */
Command.prototype.forwardSubcommands = function (fn) {
    var self = this;
    var listener = function (args, unknown) {
        // Parse any so-far unknown options
        args = args || [];
        unknown = unknown || [];

        let command;

        if (args.length || unknown.length) {
            // whether the first command is the registered command
            command = self.findCommand(args[0]);

            if (command) {
                // parse subcommand
                if ((unknown.includes('--help') || unknown.includes('-h'))) {
                    command.outputHelp();
                    process.exit(0);
                }
                else {
                    var parsed = command.parseOptions(unknown);
                    // if (parsed.args.length) args = parsed.args.concat(args);
                    if (parsed.args.length) args = args.concat(parsed.args);
                    unknown = parsed.unknown;
                }
            }
            else {
                command = self;

                var parsed = self.parseOptions(unknown);
                unknown = parsed.unknown;

                if (unknown.length > 0) {
                    if ((unknown.includes('--help') || unknown.includes('-h'))) {
                        command.outputHelp();
                        process.exit(0);
                    }
                    else {
                        command.unknownOption(unknown[0]);
                    }
                }

                if (typeof (fn) !== 'function') {
                    console.warn('error: unknown subcommand \'' + args[0] + '\'\n');
                    command.help();
                    return;
                }

                if (parsed.args.length) args = parsed.args.concat(args);

                self._args.forEach(function (arg, i) {
                    if (arg.required && args[i] == null) {
                        self.missingArgument(arg.name);
                    } else if (arg.variadic) {
                        if (i !== self._args.length - 1) {
                            self.variadicArgNotLast(arg.name);
                        }

                        args[i] = args.splice(i);
                    }
                });

                // The .forwardSubcommands callback takes an extra parameter which is the command itself.
                var expectedArgsCount = self._args.length;
                var actionArgs = args.slice(0, expectedArgsCount);
                actionArgs[expectedArgsCount] = self;
                // Add the extra arguments so available too.
                if (args.length > expectedArgsCount) {
                    actionArgs.push(args.slice(expectedArgsCount));
                }

                fn.apply(self, actionArgs);
                return;
            }
        }
        else {
            command = self;
            if ((unknown.includes('--help') || unknown.includes('-h'))) {
                self.outputHelp();
                process.exit(0);
            }
            else if (fn) {
                fn.call(self);
                return;
            }
            else {
                self.outputHelp();
                process.exit(0);
            }
        }

        self.parseArgs(args, unknown);
    };

    var parent = this.parent || this;
    var name = parent === this ? '*' : this._name;
    parent.on('command:' + name, listener);
    if (this._alias) parent.on('command:' + this._alias, listener);

    this.on('command:*', function () {
        this.help();
    });
    return this;
};



const entryProgram = new Command();
entryProgram.context.program = entryProgram;
exports.program = entryProgram;

exports.Runtime = Runtime;
exports.CommandContext = CommandContext;
exports.ConfigParser = ConfigParser;
exports.parserEmitter = ConfigParser.emitter;

// Commands
exports.commands = {
    start: require('./commands/start.command'),
    init: require('./commands/init.command'),
    pluginManager: require('./commands/plugin-manager.command')
};
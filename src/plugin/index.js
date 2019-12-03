const chalk = require('chalk');
const path = require('path');
const EventEmitter = require('events');
const { version } = require('../../config');
const { isDebugMode, getType } = require('../utils');
const PATH_COMMANDER = './commander';
const PATH_CONFIGURE = './configure';
const PATH_PACKAGE = './package.json';

function noop() { }
function nonCallback(next) { next && next(false); }
function isNoOptionFileError(error) {
    return error instanceof Error && error.code === 'MODULE_NOT_FOUND' && !!error.message.match(/(?:\/|\\)(?:commander|configure)'/);
}

class Register extends EventEmitter {
    constructor() {
        super();
        this.registerMapper = {};
    }


    /**
     * @private
     * trigger field listeners
     * @param {String} field the field of `program.context` to set
     * @param {*} value
     * @param {Function} callback return the value after `configure`
     */
    _trigger(field, value, callback) {
        const registerSetters = this.registerMapper[field] || [];

        let index = 0, total = registerSetters.length;
        if (!total) {
            callback(value);
        }

        let lastValue = value;
        let currentSetter = registerSetters[index];

        executeSetter(currentSetter, () => {
            callback(lastValue);
        });


        function executeSetter(setter, cb) {
            if (getType(setter, 'Function')) {
                try {
                    setter.call(null, lastValue, (err, returnValue) => {
                        if (!err) {

                            // keep corresponding type
                            if (getType(returnValue) === getType(value)) {
                                // remember last value after setter
                                lastValue = returnValue;
                            }
                            else {
                                console.warn(chalk.yellow(`Plugin warning: The plugin [${setter.plugin.id}] can't change the type of value while configuring the field [${field}].`));
                            }
                            next();
                        }
                        else {
                            next();
                        }
                    });
                } catch (error) {
                    next();
                }
            }

            function next() {
                // execute next setter
                if (index < total - 1) {
                    currentSetter = registerSetters[++index];
                    executeSetter(currentSetter, cb);
                }
                else {
                    cb();
                }
            }
        }
    }

    _reset() {
        this.registerMapper = {};
        this.removeAllListeners();
    }


    /**
     * configure 
     * @param {String} field the field of `program.context` to set
     * @param {Function} registerSetter register the setter which can access context when the field value is assigned
     *      Will receive two parameters
     *      - `value` the value of the field
     *      - `callback(err, value)` must be called when done
     */
    configure(field, registerSetter) {
        if (this.registerMapper[field]) {
            this.registerMapper[field].push(registerSetter);
        }
        else {
            this.registerMapper[field] = [registerSetter];
        }
    }
}

const register = new Register();
const configure = Register.prototype.configure;


/**
 * @class Plugin
 * @member {String} id plugin id
 * @member {Object} setting plugin universal setting
 * @member {Object} middleware middlewares for core proxy
 * @member {Function} configure exported function to configure plugin behavior
 * @member {Function} commander exported function to extends commands
 * @member {Object} context program context
 * @member {Object} meta plugin package meta info
 * @member {Boolean} meta.enabled plugin is enabled
 * @member {Boolean} meta.error plugin runtime error
 */
class Plugin {
    /**
     * @param {String|Array} pluginName
     * @param {Command} program
     */
    constructor(pluginName, program) {
        this.id = '';
        this.meta = {};
        this.setting = {};
        this.configure = null;
        this.middleware = {};
        this.commander = null;
        this.context = program.context;

        try {
            const { id, setting } = Plugin.resolve(pluginName);
            this.id = id;
            const { enable = true } = this.setting = setting;

            if (enable) {
                this.load();
            }

        } catch (error) {
            let pluginErrResult;
            if (pluginErrResult = error.message.match(/Cannot\sfind\smodule\s'(.+)'/)) {
                console.log(chalk.red(`${pluginErrResult[0]}. Please check if module '${pluginErrResult[1]}' is installed`));
            }
            else {
                console.error(error);
            }
            this.meta.enabled = false;
            this.meta.error = error;
        }


    }


    load() {
        let match;
        // If buildin plugin
        if (match = this.id.match(/^BuildIn\:plugin\/(.+)$/i)) {
            const buildInPluginPath = path.resolve(__dirname, match[1]);
            const buildInCommanderPath = path.resolve(buildInPluginPath, PATH_COMMANDER);
            const buildInConfigurePath = path.resolve(buildInPluginPath, PATH_CONFIGURE);
            this.middleware = require(buildInPluginPath);
            this.meta = { isBuildIn: true, version };
            
            try {
                this.commander = require(buildInCommanderPath);
                this.configure = require(buildInConfigurePath);
            } catch (error) {
                if (!isNoOptionFileError(error)) {
                    console.error(error);
                }
            }
        }
        else {
            if (isDebugMode()) {
                const pluginPath = path.resolve(__dirname, '../../packages/', this.id);
                const pluginCommanderPath = path.resolve(pluginPath, PATH_COMMANDER);
                const pluginConfigurePath = path.resolve(pluginPath, PATH_CONFIGURE);
                this.middleware = require(pluginPath);
                this.meta = require(path.resolve(pluginPath, PATH_PACKAGE));
                this.meta.isDebug = true;
                try {
                    this.commander = require(pluginCommanderPath);
                    this.configure = require(pluginConfigurePath);
                } catch (error) {
                    if (!isNoOptionFileError(error)) {
                        console.error(error);
                    }
                }
            }
            else {
                this.middleware = require(this.id);
                this.meta = require(path.join(this.id, PATH_PACKAGE));
                try {
                    this.commander = require(path.join(this.id, PATH_COMMANDER));
                    this.configure = require(path.join(this.id, PATH_CONFIGURE));
                } catch (error) {
                    if (!isNoOptionFileError(error)) {
                        console.error(error);
                    }
                }
            }
        }

        this._extendCmds();
    }

    static resolve(value) {
        const resolveData = {
            id: '',
            setting: {}
        };
        if (typeof value === 'string') {
            resolveData.id = value;
        }
        else if (Array.isArray(value)) {
            const [name, setting] = value;
            if (typeof name === 'string') {
                resolveData.id = value[0];
            }
            else {
                throw new Error('Plugin name format error');
            }
            if (typeof setting === 'object') {
                resolveData.setting = setting;
            }
            else {
                throw new Error('Plugin setting format error');
            }
        }
        else {
            throw new Error('Plugin name format error');
        }

        return resolveData;
    }



    /**
     * @private
     * Register commanders or listeners
     */
    _extendCmds() {
        if (this.commander && typeof (this.commander) === 'function') {

            const plugin = this;
            // why? binding the corresponding plugin to the setter method
            Register.prototype.configure = function configureWrapper(field, registerSetter) {
                registerSetter.plugin = plugin;
                configure.call(this, field, registerSetter);
            };
            this.commander.call(this, this.context.program, register);
        }
    }


    /**
     * @private
     * @param {String} method method name
     * @param {Function} replacement default backup function
     * @param  {...any} args 
     */
    _methodWrapper(method, replacement, ...args) {
        const definedHook = this.middleware[method];
        if (definedHook && typeof (definedHook === 'function')) {
            definedHook.call(this, ...args);
        }
        else {
            replacement(args[1]);
        }
    }

    beforeCreate(context) {
        this._methodWrapper('beforeCreate', noop, context);
    }

    onRequest(context, next) {
        this._methodWrapper('onRequest', nonCallback, context, next);
    }

    onRouteMatch(context, next) {
        this._methodWrapper('onRouteMatch', nonCallback, context, next);
    }

    beforeProxy(context, next) {
        this._methodWrapper('beforeProxy', nonCallback, context, next);
    }

    afterProxy(context) {
        this._methodWrapper('afterProxy', noop, context);
    }
}

class PluginInterrupt {
    constructor(plugin, lifehook, message) {
        this.plugin = plugin;
        this.lifehook = lifehook;
        this.message = message;
    }

    toString() {
        return `[Plugin ${this.plugin.id}:${this.lifehook}] ${this.message}`;
    }
}

module.exports = {
    Plugin,
    PluginInterrupt,
    Register,
    register,
}
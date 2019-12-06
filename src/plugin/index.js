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
/**
 * Judge the plugin is build-in or not and return plugin name
 * @param {String} id
 * @returns {String} plugin name
 */
function isBuildIn(id) {
    return id.match(/^BuildIn\:plugin\/(.+)$/i);
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
 * @member {Object} config parsed plugin config object
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
        this.id = pluginName;
        this.meta = {};
        this.setting;
        this.config;
        this.configure = null;
        this.middleware = {};
        this.commander = null;
        this.context = program.context;

        this._indexPath = '';
        this._configurePath;
        this._commanderPath;

        try {
            this.setting = this.loadSetting();
            this.config = this.loadPluginConfig();
            const enable = Plugin.resolveEnable(this);

            if (enable) {
                this.load();
                this.meta.enabled = true;
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


    /**
     * @public
     * Try to load plugin middleware, commander
     */
    load() {
        this.middleware = require(this._indexPath);
        if (isBuildIn(this.id)) {
            this.meta = { isBuildIn: true, version };
        }
        else {
            this.meta = require(path.join(this._indexPath, PATH_PACKAGE));
        }

        try {
            this.commander = require(this._commanderPath);
        } catch (error) {
            if (!isNoOptionFileError(error)) {
                console.error(error);
            }
        }

        this._extendCmds();
    }


    /**
     * @public
     * load plugin setting, try to load configure file
     */
    loadSetting() {
        let matched = isBuildIn(this.id);
        if (matched) {
            const buildInPluginPath = this._indexPath = path.resolve(__dirname, matched[1]);
            this._configurePath = path.resolve(buildInPluginPath, PATH_CONFIGURE);
            this._commanderPath = path.resolve(buildInPluginPath, PATH_COMMANDER);
            this.meta = { isBuildIn: true, version };
        }
        else {
            if (isDebugMode()) {
                const devPath = this._indexPath = path.resolve(__dirname, '../../packages/', this.id);
                this._configurePath = path.resolve(devPath, PATH_CONFIGURE);
                this._commanderPath = path.resolve(devPath, PATH_COMMANDER);
            }
            else {
                this._indexPath = this.id;
                this._configurePath = path.join(this.id, PATH_CONFIGURE);
                this._commanderPath = path.join(this.id, PATH_COMMANDER);
            }
        }

        try {
            // try load `configure.js` file
            this.configure = require(this._configurePath);
            return Plugin.resolveSetting(this);
        } catch (error) {
            if (!isNoOptionFileError(error)) {
                console.error(error);
            }
            return Plugin.defaultSetting(this);
        }
    }


    /**
     * Resolve plugin config from `setting.configField`
     */
    loadPluginConfig() {
        const rawPluginConfig = this.context.rawConfig[this.setting.userOptionsField] || {};
        const parser = Plugin.resolveConfigParser(this);
        return parser.call(this, rawPluginConfig, this.context.rawConfig) || {};
    }

    static defaultSetting(plugin) {
        return {
            defaultEnable: true,
            userOptionsField: plugin.id,
            configureEnableField: 'enable',
        };
    }

    static defaultConfigParser() {
        return config => config;
    }

    static resolveSetting(plugin) {
        const defaultSetting = Plugin.defaultSetting(plugin);
        const configure = plugin.configure;
        if (configure && typeof configure === 'object') {
            const configureSetting = configure.configureSetting;
            if (typeof configureSetting === 'function') {
                return Object.assign({}, defaultSetting, configureSetting.call(plugin));
            }
            else {
                return defaultSetting;
            }
        }
        else {
            return defaultSetting;
        }
    }

    static resolveConfigParser(plugin) {
        const defaultConfigParser = Plugin.defaultConfigParser();
        const configure = plugin.configure;
        if (configure && typeof configure === 'object') {
            const parser = configure.parser;
            if (typeof parser === 'function') {
                return parser;
            }
            else {
                return defaultConfigParser;
            }
        }
        else {
            return defaultConfigParser;
        }
    }

    static resolveEnable(plugin) {
        const { setting, config } = plugin;
        let pluginEnable;
        const userEnable = pluginEnable = config[setting.configureEnableField];
        if (userEnable === undefined) {
            pluginEnable = setting.defaultEnable;
        }
        return pluginEnable;
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

Plugin.AllMiddlewares = ['beforeCreate', 'onRequest', 'onRouteMatch', 'beforeProxy', 'afterProxy'];

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
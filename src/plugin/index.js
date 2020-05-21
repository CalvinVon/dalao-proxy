const chalk = require('chalk');
const path = require('path');
const EventEmitter = require('events');
const { version } = require('../../config');
const { isDebugMode, getType, uuid } = require('../utils');
const PATH_INDEX = './index.js';
const PATH_COMMANDER = './commander.js';
const PATH_CONFIGURE = './configure.js';
const PATH_PACKAGE = './package.json';

function noop() { }
function nextNoop(context, next) { next && next(null); }
function nextChunkNoop(context, next) { next && next(null, context.chunk); }
function isNoOptionFileError(error) {
    return error instanceof Error && error.code === 'MODULE_NOT_FOUND' && !!error.message.match(/\b(commander|configure)\.js'/);
}
/**
 * Judge the plugin is build-in or not and return plugin name
 * @param {String} id
 * @returns {String} plugin name
 */
function isBuildIn(id) {
    return id.match(/^BuildIn\:plugin\/(.+)$/i);
}


function createUid() {
    return (Date.now() + Math.random()).toString(16).substr(2);
}

class Register extends EventEmitter {
    constructor() {
        super();
        this.registerMapper = {};
        this.lineCommand = [];
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
            this.emit('context:' + field, lastValue);
        });


        function executeSetter(setter, cb) {
            try {
                setter.call(null, lastValue, (err, returnValue) => {
                    if (!err) {
                        // keep corresponding type
                        if (getType(returnValue) === getType(value)) {
                            // remember last value after setter
                            lastValue = returnValue;
                        }
                        else {
                            console.warn(chalk.yellow(`Plugin warning: The plugin [${setter.plugin.name}] can't change the type of value while configuring the field [${field}].`));
                        }
                    }
                    next();
                });
            } catch (error) {
                next();
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
        if (!getType(registerSetter, 'Function')) {
            throw new Error('registerSetter must be a function');
        }
        if (this.registerMapper[field]) {
            this.registerMapper[field].push(registerSetter);
        }
        else {
            this.registerMapper[field] = [registerSetter];
        }
    }


    addLineCommand(cmd, ...cmds) {
        if (Array.isArray(cmd)) {
            this.lineCommand.push(...cmd);
        }
        else {
            this.lineCommand.push(cmd, ...cmds);
        }
        this.lineCommand = [...new Set(this.lineCommand)];
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
 * @member {Object} parser plugin config parser
 * @member {Function} commander exported function to extends commands
 * @member {Object} context program context
 * @member {Object} meta plugin package meta info
 * @member {Boolean} meta.enabled plugin is enabled
 * @member {Boolean} meta.error plugin runtime error
 */
class Plugin {
    /**
     * @param {String} pluginName
     * @param {Object} context program.context
     */
    constructor(pluginName, context, setting) {
        this.id = createUid();
        this.name = pluginName;
        this._pluginSetting = setting;
        this.meta = {};
        this.setting;
        this.config;
        this.parser;
        this.configure = null;
        this.middleware = {};
        this.commander = null;
        this.context = context;
        this.register = register;

        this._indexPath = '';
        this._packagejsonPath;
        this._configurePath;
        this._commanderPath;

        try {
            const {
                indexPath,
                commanderPath,
                configurePath,
                packagejsonPath
            } = Plugin.resolvePluginPaths(this.name);

            this._indexPath = indexPath;
            this._packagejsonPath = packagejsonPath;
            this._commanderPath = commanderPath;
            this._configurePath = configurePath;

            this.load();
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
        this.setting = this.loadSetting();
        this.config = this.loadPluginConfig();
        const enable = Plugin.resolveEnable(this);

        if (enable && !this.meta.enabled) {
            this.middleware = require(this._indexPath);
            if (isBuildIn(this.name)) {
                this.meta = { isBuildIn: true, version };
            }
            else {
                this.meta = require(this._packagejsonPath);
            }

            try {
                this.commander = require(this._commanderPath);
                this._extendCmds();
            } catch (error) {
                if (!isNoOptionFileError(error)) {
                    console.error(error);
                }
            }
            this.meta.enabled = true;
        }

    }


    /**
     * @public
     * load plugin setting, try to load configure file
     */
    loadSetting() {
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
        const optionsField = this.setting.optionsField;
        let rawPluginConfig;

        if (Array.isArray(optionsField)) {
            rawPluginConfig = optionsField.map(field => {
                return this.context.config[field];
            });
        }
        else {
            rawPluginConfig = [this.context.config[optionsField]];
        }

        const parser = this.parser = Plugin.resolveConfigParser(this);
        const parsedConfig = parser.apply(this, rawPluginConfig) || {};

        // resolve plugin enable config
        // 
        parsedConfig[this.setting.enableField] = rawPluginConfig[0] && rawPluginConfig[0][this.setting.enableField];
        return parsedConfig;
    }

    static defaultSetting(plugin) {
        return {
            defaultEnable: true,
            optionsField: plugin.name,
            enableField: 'enable',
        };
    }

    static defaultConfigParser() {
        return function defaultParser(config) {
            return config;
        };
    }

    /**
     * Resolve Plugin Paths
     * @param {String} pluginName 
     */
    static resolvePluginPaths(pluginName) {
        const resolvedPaths = {
            indexPath: null,
            commanderPath: null,
            configurePath: null,
            packagejsonPath: null
        };
        let matched = isBuildIn(pluginName);
        if (matched) {
            const buildInPluginPath = path.resolve(__dirname, matched[1]);
            resolvedPaths.indexPath = path.resolve(buildInPluginPath, PATH_INDEX);
            resolvedPaths.configurePath = path.resolve(buildInPluginPath, PATH_CONFIGURE);
            resolvedPaths.commanderPath = path.resolve(buildInPluginPath, PATH_COMMANDER);
            resolvedPaths.packagejsonPath = path.resolve(buildInPluginPath, PATH_PACKAGE);
        }
        else {
            if (isDebugMode()) {
                const devPath = path.resolve(__dirname, '../../packages/', pluginName);
                resolvedPaths.indexPath = path.resolve(devPath, PATH_INDEX);
                resolvedPaths.configurePath = path.resolve(devPath, PATH_CONFIGURE);
                resolvedPaths.commanderPath = path.resolve(devPath, PATH_COMMANDER);
                resolvedPaths.packagejsonPath = path.resolve(devPath, PATH_PACKAGE);
            }
            else {
                resolvedPaths.indexPath = pluginName;
                resolvedPaths.configurePath = path.join(pluginName, PATH_CONFIGURE);
                resolvedPaths.commanderPath = path.join(pluginName, PATH_COMMANDER);
                resolvedPaths.packagejsonPath = path.join(pluginName, PATH_PACKAGE);
            }
        }
        return resolvedPaths;
    }

    static resolveSetting(plugin) {
        const defaultSetting = Plugin.defaultSetting(plugin);
        const configure = plugin.configure;
        if (configure && typeof configure === 'object') {
            const setting = configure.setting;
            if (typeof setting === 'function') {
                return Object.assign({}, defaultSetting, setting.call(plugin, plugin._pluginSetting));
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
        const userEnable = pluginEnable = config[setting.enableField];
        if (userEnable === undefined) {
            config[setting.enableField] = pluginEnable = setting.defaultEnable;
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
            this.commander.call(this, this.context.program, register, this.config);
        }
    }


    /**
     * @private
     * Call exposed hook functions defined in user plugins, if not exist use replacement function as fallback
     * @param {String} method method name
     * @param {Function} replacement default backup function
     * @param  {...any} args 
     */
    _methodWrapper(method, replacement, ...args) {
        const definedHook = this.middleware[method];
        if (definedHook && typeof (definedHook) === 'function') {
            definedHook.call(this, ...args);
        }
        else {
            replacement(...args);
        }
    }

    beforeCreate(context) {
        this._methodWrapper('beforeCreate', noop, context);
    }

    onRequest(context, next) {
        this._methodWrapper('onRequest', nextNoop, context, next);
    }

    onRouteMatch(context, next) {
        this._methodWrapper('onRouteMatch', nextNoop, context, next);
    }

    beforeProxy(context, next) {
        this._methodWrapper('beforeProxy', nextNoop, context, next);
    }

    onProxySetup(context) {
        this._methodWrapper('onProxySetup', nextNoop, context);
    }

    onProxyRespond(context, next) {
        this._methodWrapper('onProxyRespond', nextNoop, context, next);
    }

    afterProxy(context) {
        this._methodWrapper('afterProxy', noop, context);
    }

    onPipeRequest(context, next) {
        this._methodWrapper('onPipeRequest', nextChunkNoop, context, next);
    }

    onPipeResponse(context, next) {
        this._methodWrapper('onPipeResponse', nextChunkNoop, context, next);
    }
}

Plugin.AllMiddlewares = [
    'beforeCreate',
    'onRequest',
    'onRouteMatch',
    'beforeProxy',
    'onProxySetup',
    'onProxyRespond',
    'afterProxy',
    'onPipeRequest',
    'onPipeResponse'
];

Plugin.FILES = {
    INDEX: PATH_INDEX,
    PACKAGE: PATH_PACKAGE,
    COMMANDER: PATH_COMMANDER,
    CONFIGURE: PATH_CONFIGURE
};

class PluginInterrupt {
    constructor(plugin, lifehook, message) {
        this.plugin = plugin;
        this.lifehook = lifehook;
        this.message = message;
    }

    toString() {
        return `[Plugin ${this.plugin.name}:${this.lifehook}] ${this.message}`;
    }
}


// create plugins instances
function instantiatedPlugins(program, pluginsNames) {
    // program.context.plugins = [];
    // register._reset();

    pluginsNames.forEach(name => {
        let plugin;
        if (typeof(name) === 'string') {
            plugin = new Plugin(name, program.context);
        }
        else if (Array.isArray(name)) {
            const [pluginName, pluginSetting] = name;
            plugin = new Plugin(pluginName, program.context, pluginSetting);
        }
        program.context.plugins.push(plugin);
    });
};

function reloadPlugins(plugins) {
    plugins.forEach(plugin => {
        try {
            plugin.load();
        } catch (error) {
            let pluginErrResult;
            if (pluginErrResult = error.message.match(/Cannot\sfind\smodule\s'(.+)'/)) {
                console.log(chalk.red(`${pluginErrResult[0]}. Please check if module '${pluginErrResult[1]}' is installed`));
            }
            else {
                console.error(error);
            }
        }
    });
}

module.exports = {
    Plugin,
    PluginInterrupt,
    Register,
    register,
    instantiatedPlugins,
    reloadPlugins
};
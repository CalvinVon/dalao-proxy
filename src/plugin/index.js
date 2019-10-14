
const path = require('path');
const EventEmitter = require('events');
const { isDebugMode } = require('../utils');
const PATH_COMMANDER = './commander';

function noop() { }
function nonCallback(next) { next && next(false); }
const pluginEmitter = new EventEmitter();


/**
 * @class Plugin
 * @member middleware core proxy middleware
 * @member commander register commands
 */
class Plugin {
    /**
     * @param {String} id id of plugin
     * @param {String} pluginName
     */
    constructor(pluginName, id) {
        this.middleware = {};
        this.commander = {};
        this.id = id || pluginName;

        try {
            let match;
            if (match = pluginName.match(/^BuildIn\:plugin\/(.+)$/i)) {
                const buildInPluginPath = path.resolve(__dirname, match[1]);
                const buildInCommanderPath = path.resolve(buildInPluginPath, PATH_COMMANDER);
                this.middleware = require(buildInPluginPath);

                try {
                    this.commander = require(buildInCommanderPath);
                } catch (error) {
                    // do nothing
                }
            }
            else {
                if (isDebugMode()) {
                    const pluginPath = path.resolve(__dirname, '../../packages/', pluginName);
                    const pluginCommanderPath = path.resolve(pluginPath, PATH_COMMANDER);
                    this.middleware = require(pluginPath);
                    try {
                        this.commander = require(pluginCommanderPath);
                    } catch (error) {
                        // do nothing
                    }
                }
                else {
                    this.middleware = require(pluginName);
                    try {
                        this.commander = require(path.join(pluginName, PATH_COMMANDER));
                    } catch (error) {
                        // do nothing
                    }
                }
            }
        } catch (error) {
            let pluginErrResult;
            if (pluginErrResult = error.message.match(/Cannot\sfind\smodule\s'(.+)'/)) {
                console.log(`${pluginErrResult[0]}. Please check if module '${pluginErrResult[1]}' is installed`.red);
            }
            else {
                console.error(error);
            }
        }
    }

    _methodWrapper(method, replacement, ...args) {
        const definedHook = this.middleware[method];
        if (definedHook && typeof (definedHook === 'function')) {
            definedHook.call(this, ...args);
        }
        else {
            replacement(args[1]);
        }
    }

    /**
     * Register commanders or listeners
     * @param {Commander.Program} program 
     */
    register(program) {
        if (this.commander && typeof (this.commander) === 'function') {
            this.commander.call(this, program, pluginEmitter);
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
    pluginEmitter,
}
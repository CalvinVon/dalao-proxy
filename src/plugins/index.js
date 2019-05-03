
const path = require('path');

function noop() { }
function nonCallback(next) { next && next(false); }

class Plugin {
    /**
     * @param {String} id id of plugin
     * @param {String} pluginName
     */
    constructor(pluginName, id) {
        this.middleware = {};
        this.id = id || pluginName;
        try {
            let match;
            if (match = pluginName.match(/^BuildIn\:plugin\/(.+)$/i)) {
                const buildInPluginPath = path.resolve('src', 'plugins', match[1]);
                this.middleware = require(buildInPluginPath);
            }
            else {
                this.middleware = require(pluginName);
            }
        } catch (error) {
            let buildIns;
            if (buildIns = error.message.match(/^Cannot\sfind\smodule\s'(.+)'$/)) {
                console.log(`${error.message}. Please check if module '${buildIns[1]}' is installed`.red);
            }
            else {
                console.error(error);
            }
        }
    }

    _methodWrapper(method, replacement, ...args) {
        const definedHook = this.middleware[method];
        if (definedHook && typeof(definedHook === 'function')) {
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

class PluginInterrupt extends Error {
    constructor(plugin, lifehook, message) {
        super(message);
        this.plugin = plugin;
        this.lifehook = lifehook;
    }

    toString() {
        console.log(`[Plugin ${this.plugin.id}:${this.lifehook}] ${super.message}`);
    }
}

module.exports = {
    Plugin,
    PluginInterrupt
}
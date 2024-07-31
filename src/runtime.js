const ConfigParser = require('./parser/config-parser');
const { Plugin, reloadModifiedPlugins } = require('./plugin');
const { RC_FILE_PATH } = require('../config/plugins');
const fs = require('fs');

// * Why collect connections?
// When HTTP server reloads, node.js would keep all existing connections,
// which will cause the reloading very slow
const connections = new Set();
let reloading;

/**
 * @type {Map<string, Plugin>}
 */
const pluginMap = new Map();
/**
 * @type {Map<string, Plugin>}
 */
const childPluginMap = new Map();

function reloadProgram(program, reloadLoadedPlugins) {
    if (!reloading) {
        reloading = true;

        for (const connection of connections) {
            // clean all existing connections
            connection.destroy();
        }

        program.context.server.close(function () {
            init(program);
            if (reloadLoadedPlugins) {
                reloadAllPlugins(program);
            }
            ConfigParser.parse(program);
        });
    }
}

function setReloading(value) {
    reloading = value;
}


function init(program) {
    const { rawConfig, config, path } = ConfigParser.parseFile(ConfigParser.parsePathFromArgv());
    Object.defineProperty(config, '[[parsed]]', {
        enumerable: false,
        value: false
    });
    program.context.rawConfig = rawConfig;
    program.context.config = config;
    program.context.configPath = path;

    loadPlugins(program, config);
}


function loadPlugins(program, config) {
    const loadedPlugins = program.context.plugins;
    if (loadedPlugins.length) {
        reloadModifiedPlugins();
    }

    let pluginList = [];
    if (fs.existsSync(RC_FILE_PATH)) {
        try {
            pluginList = JSON.parse(fs.readFileSync(RC_FILE_PATH)) || [];
        } catch (error) {
            console.warn(error);
        }
    }
    const newPluginNames = [...new Set([...config.plugins, ...pluginList])]
        .filter(name => {
            const { setting } = Plugin.resolveSettingFromConfig(name);
            const isChildPlugin = !!setting._childId;
            return isChildPlugin ? !childPluginMap.get(setting._childId) : !pluginMap.get(name);
        });


    instantiatedPlugins(program, newPluginNames);
    // reload child plugins
    Plugin.childPlugins.forEach(plugin => plugin.load());
    // ConfigParser.mergePluginsConfig(config, program.context.plugins);
}

function reloadAllPlugins(program) {
    program.context.plugins.forEach(plugin => plugin.load());
}


// create plugins instances
function instantiatedPlugins(program, pluginsNames) {
    // program.context.plugins = [];
    // register._reset();

    pluginsNames.forEach(configName => {
        const { name, setting } = Plugin.resolveSettingFromConfig(configName);
        const isChildPlugin = !!setting._childId;
        // check child plugin
        if (isChildPlugin) {
            if (childPluginMap.get(setting._childId)) return;
        }
        else {
            if (pluginMap.get(configName)) return;
        }

        const plugin = new Plugin(name, program.context, setting);
        if (isChildPlugin) {
            childPluginMap.set(setting._childId, plugin);
        }
        else {
            pluginMap.set(configName, plugin);
        }
        if (!plugin.meta.error) {
            program.context.plugins.push(plugin);
        }
    });
};

module.exports = {
    reloadProgram,
    setReloading,

    init,
    loadPlugins,
    reloadAllPlugins,
    instantiatedPlugins,
    connections
};

const ConfigParser = require('./parser/config-parser');
const { Plugin, reloadModifiedPlugins } = require('./plugin');

// * Why collect connections?
// When HTTP server reloads, node.js would keep all existing connections,
// which will cause the reloading very slow
const connections = new Set();
let reloading;

function reloadProgram(program, reloadLoadedPlugins) {
    if (!reloading) {
        reloading = true;
        registerPlugins(program);
        
        if (reloadLoadedPlugins) {
            reloadAllPlugins(program);
        }


        for (const connection of connections) {
            // clean all existing connections
            connection.destroy();
        }

        program.context.server.close(function () {
            ConfigParser.parse(program);
        });
    }
}

function setReloading(value) {
    reloading = value;
}


function registerPlugins(program) {
    const { rawConfig, config, path } = ConfigParser.parsePlugins();
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

    const newPluginNames = [...config.plugins];
    loadedPlugins.forEach(plugin => {
        const foundIndex = newPluginNames.findIndex(name => {
            return Plugin.resolvePluginSettingFromConfig(name).name === plugin.name;
        });

        newPluginNames.splice(foundIndex, 1);
    });

    instantiatedPlugins(program, newPluginNames);
    ConfigParser.mergePluginsConfig(config, program.context.plugins);
}

function reloadAllPlugins(program) {
    program.context.plugins.forEach(plugin => plugin.load());
}


// create plugins instances
function instantiatedPlugins(program, pluginsNames) {
    // program.context.plugins = [];
    // register._reset();

    pluginsNames.forEach(configName => {
        const { name, setting } = Plugin.resolvePluginSettingFromConfig(configName);
        const plugin = new Plugin(name, program.context, setting);
        program.context.pluginIds.add(plugin.id);
        program.context.plugins.push(plugin);
    });
};

module.exports = {
    reloadProgram,
    setReloading,

    registerPlugins,
    loadPlugins,
    reloadAllPlugins,
    instantiatedPlugins,
    connections
};

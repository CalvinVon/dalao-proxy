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

    const newPluginNames = [...config.plugins];
    loadedPlugins.forEach(plugin => {
        const foundIndex = newPluginNames.findIndex(name => {
            return Plugin.resolveSettingFromConfig(name).name === plugin.name;
        });

        newPluginNames.splice(foundIndex, 1);
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
        const plugin = new Plugin(name, program.context, setting);
        if (!plugin.meta.error) {
            program.context.pluginIds.add(plugin.id);
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

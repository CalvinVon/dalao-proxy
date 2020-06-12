const ConfigParser = require('./parser/config-parser');
const { Plugin, reloadPlugins } = require('./plugin');

let reloading;

function reloadProgram(program) {
    if (!reloading) {
        reloading = true;
        Plugin.readConfigSource = 'rawConfig';
        setForceReloadAllPlugins(program);
        registerPlugins(program);

        program.context.server.close(function () {
            ConfigParser.parse(program);
        });
    }
}

function setReloading(value) {
    reloading = value;
}

// add all loaded plugins to reload list
function setForceReloadAllPlugins(program) {
    program.context.plugins.forEach(plugin => {
        if (!Plugin.modifiedPluginIds.has(plugin.id)) {
            Plugin.modifiedPluginIds.add(plugin.id);
            Plugin.modifiedPlugins.push(plugin);
        }
    });
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
    let firstLoad;
    const loadedPlugins = program.context.plugins;
    if (loadedPlugins.length) {
        firstLoad = false;
        reloadPlugins();
    }
    else {
        firstLoad = true;
    }

    const newPluginNames = [...config.plugins];
    loadedPlugins.forEach(plugin => {
        const foundIndex = newPluginNames.findIndex(name => {
            if (typeof (name) === 'string') {
                return name === plugin.name;
            }
            else if (Array.isArray(name)) {
                const [pluginName] = name;
                return pluginName === plugin.name;
            }
        });

        newPluginNames.splice(foundIndex, 1);
    });

    if (firstLoad) {
        Plugin.readConfigSource = 'rawConfig';
    }
    else {
        // new child plugins should read parsed config
        // cause the config of child plugin is setted from parent
        Plugin.readConfigSource = 'parsedConfig';
    }
    instantiatedPlugins(program, newPluginNames);
    ConfigParser.mergePluginsConfig(config, program.context.plugins);
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
        program.context.pluginIds.add(plugin.id);
        program.context.plugins.push(plugin);
    });
};

module.exports = {
    reloadProgram,
    setReloading,

    setForceReloadAllPlugins,
    registerPlugins,
    loadPlugins,
    instantiatedPlugins,
};

const { packageInstaller } = require('@dalao-proxy/utils');

// sync plugins to inner config file
function syncInnerConfig(names, { isAdd, before, after }) {
    // remove versions
    const pluginNames = names.map(it => it.replace(/@(\d\.?(-.+)?)*$/, ''));
    const baseConfigFilePath = path.join(__dirname, '../../../../config/index.js');
    const config = require(baseConfigFilePath);
    const pluginList = config.plugins;
    const isExsit = plugin => pluginList.indexOf(plugin) !== -1;

    if (isAdd) {
        if (before && isExsit(before)) {
            // need insert before the given plugin
            pluginNames.forEach(plugin => {
                if (isExsit(plugin)) {
                    pluginList.splice(pluginList.indexOf(plugin), 1);
                }
                pluginList.splice(pluginList.indexOf(before), 0, plugin);
            });
        }
        else if (after && isExsit(after)) {
            pluginNames.forEach(plugin => {
                if (isExsit(plugin)) {
                    pluginList.splice(pluginList.indexOf(plugin), 1);
                }
                pluginList.splice(pluginList.indexOf(after) + 1, 0, plugin);
            });
        }
        else {
            config.plugins = [...new Set([...config.plugins, ...pluginNames])];
        }
    }
    else {
        config.plugins = config.plugins.filter(it => !pluginNames.some(name => name === it));
    }

    const tpl = `const config = ${JSON.stringify(config, null, 4)};\nmodule.exports = config;`;

    fs.writeFileSync(baseConfigFilePath, tpl, { encoding: 'utf8' });
}

module.exports = {
    install: function (pluginNames, options) {
        packageInstaller.install(pluginNames, {
            ...options, callback: (errCode) => {
                if (errCode === 0) {
                    syncInnerConfig(pluginNames, options);
                }
            }
        });
    },

    uninstall: function (pluginNames, options) {
        packageInstaller.uninstall(pluginNames, {
            ...options, callback: (errCode) => {
                if (errCode === 0) {
                    syncInnerConfig(pluginNames, { isAdd: false, ...options });
                }
            }
        });
    },
}


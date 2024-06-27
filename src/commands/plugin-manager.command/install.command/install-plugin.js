const { packageInstaller, setAsOriginalUser } = require('@dalao-proxy/utils');
const { RC_FILE_PATH } = require('../../../../config/plugins');
const fs = require('fs');

function syncInnerConfig(names, { isAdd, before, after }) {
    // remove versions
    const pluginNames = names.map(it => it.replace(/@(\d\.?(-.+)?)*$/, ''));
    // const baseConfigFilePath = path.join(__dirname, '../../../../config/index.js');
    // const config = require(baseConfigFilePath);
    let pluginList = [];
    if (fs.existsSync(RC_FILE_PATH)) {
        try {
            pluginList = JSON.parse(fs.readFileSync(RC_FILE_PATH));
        } catch (error) {
            console.warn(error);
        }
    }

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
            pluginList = [...new Set([...pluginList, ...pluginNames])];
        }
    }
    else {
        pluginList = pluginList.filter(it => !pluginNames.some(name => name === it));
    }

    const fileContent = JSON.stringify(pluginList);

    try {
        setAsOriginalUser();
        fs.writeFileSync(RC_FILE_PATH, fileContent, { encoding: 'utf8' });
    } catch (error) {
        console.warn("Write global plugin config file error");
        console.warn(error);
    }

}

module.exports = {
    install: function (pluginNames, options) {
        packageInstaller.install(pluginNames, {
            ...options,
            callback: (err, opts) => {
                if (!err && !opts.isLocally) {
                    syncInnerConfig(pluginNames, opts);
                }
                options.callback(err, opts);
            }
        });
    },

    uninstall: function (pluginNames, options) {
        packageInstaller.uninstall(pluginNames, {
            ...options,
            callback: (err, opts) => {
                if (!err && !opts.isLocally) {
                    syncInnerConfig(pluginNames, { isAdd: false, ...opts });
                }
                options.callback(err, opts);
            }
        });
    },
}


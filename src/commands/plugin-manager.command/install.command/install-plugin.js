const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function installPlugins(pluginNames, options) {
    const displayPluginNames = displayNames(pluginNames);
    const {
        isAdd = true,
        isLocally = false,
        callback = new Function()
    } = options || {};

    console.log(`> ${isAdd ? 'Installing' : 'Uninstall'} ${displayPluginNames} package(s)...`);

    const installCmd = spawn(
        'npm',
        [
            isAdd ? 'install' : 'uninstall',
            isLocally ? '-D' : '-g',
            ...pluginNames
        ],
        {
            stdio: 'inherit',
            shell: true,
            env: process.env,
            cwd: process.cwd()
        }
    );

    installCmd.on('exit', code => {
        if (code) {
            console.log(`\n> ${displayPluginNames} package(s) ${isAdd ? '' : 'un'}install failed with code ${code}`);
        }
        else {
            console.log(`\n> ${displayPluginNames} package(s) ${isAdd ? '' : 'un'}install completed`);
            if (!isLocally) {
                syncInnerConfig(pluginNames, options);
            }
            console.log(`🎉  Plugin ${displayPluginNames} ${isAdd ? '' : 'un'}installed successfully!\n`);
        }

        installCmd.kill();
        callback();
    });
    installCmd.on('error', (code, signal) => {
        console.log(code, signal)
        console.log(`> ${displayPluginNames} ${isAdd ? '' : 'un'}install failed with code ${code}`);
        installCmd.kill();
        callback(code);
    });
}

function displayNames(names) {
    if (names.length > 3) {
        return '[' + names.slice(0, 3).join('], [') + ']' + ` and ${names.length - 3} more plugin`;
    }
    else {
        return '[' + names.join('], [') + '] plugin';
    }
}

// sync plugins to inner config file
function syncInnerConfig(pluginNames, { isAdd, before, after }) {
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
        installPlugins(pluginNames, { isAdd: true, ...options });
    },

    uninstall: function (pluginNames, options) {
        installPlugins(pluginNames, { isAdd: false, ...options });
    }
}
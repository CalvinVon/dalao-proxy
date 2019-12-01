const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function installPlugins(pluginNames, options) {
    const displayPluginNames = pluginNames[0] + (pluginNames.length > 1 ? ` and ${pluginNames.length - 1} more plugins` : '');
    const {
        isAdd = true,
        isLocally = false
    } = options || {};

    console.log(`> ${isAdd ? 'Installing' : 'Uninstall'} ${displayPluginNames} package...`);

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
            console.log(`\n> ${displayPluginNames} package ${isAdd ? '' : 'un'}install failed with code ${code}`);
        }
        else {
            console.log(`\n> ${displayPluginNames} package ${isAdd ? '' : 'un'}install completed`);
            if (!isLocally) {
                syncInnerConfig(pluginNames, isAdd);
            }
        }

        console.log(`\n🎉  Plugin ${displayPluginNames} ${isAdd ? '' : 'un'}installed successfully!`);
        installCmd.kill();
        process.exit(0);
    });
    installCmd.on('error', (code, signal) => {
        console.log(code, signal)
        console.log(`> ${displayPluginNames} ${isAdd ? '' : 'un'}install failed with code ${code}`);
        installCmd.kill();
    });
}

// sync plugins to inner config file
function syncInnerConfig(pluginNames, isAdd) {
    const baseConfigFilePath = path.join(__dirname, '../../config/index.js');
    const config = require(baseConfigFilePath)
    if (isAdd) {
        config.plugins = [...new Set([config.plugins, ...pluginNames])];
    }
    else {
        config.plugins = config.plugins.filter(it => it !== pluginName);
    }

    const tpl = `const config = ${JSON.stringify(config, null, 4)};\nmodule.exports = config;`;

    fs.writeFileSync(baseConfigFilePath, tpl, { encoding: 'utf8' });
}

module.exports = {
    install: function (pluginNames, isLocally) {
        installPlugins(pluginNames, { isAdd: true, isLocally });
    },

    uninstall: function (pluginNames, isLocally) {
        installPlugins(pluginNames, { isAdd: false, isLocally });
    }
}
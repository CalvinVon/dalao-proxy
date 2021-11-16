const fs = require('fs');
const path = require('path');
const { RC_FILE_PATH, presetPlugins } = require('../config/script');
const { hasGlobalArgs, getProcessUserInfo, getGlobalPackagePath } = require('@dalao-proxy/utils');
const { install } = require('../src/commands/plugin-manager.command/install.command/install-plugin');

const pluginsToInstall = [...presetPlugins];

if (fs.existsSync(RC_FILE_PATH)) {
    const config = fs.readFileSync(RC_FILE_PATH);
    const content = JSON.parse(config);

    const formerInstalledPlugins = content.plugins;
    formerInstalledPlugins.forEach(plugin => {
        if (pluginsToInstall.indexOf(plugin) === -1) {
            if (!isBuildIn(plugin)) {
                pluginsToInstall.push(plugin);
            }
        }
    });
}

const isLocally = !hasGlobalArgs();

if (!isLocally) {
    if (getProcessUserInfo().uid === 0) {
        const configFilePath = `${getGlobalPackagePath()}dalao-proxy/config/index.js`;
        try {
            fs.chmodSync(path.join(__dirname, '../config/index.js'), '664');
            console.log(`Change mode of ${configFilePath} success.`);
        } catch (error) {
            console.error(`Error when change mode of config files, you may need run \`sudo chmod 664 ${configFilePath}\``);
        }
    }
}

install(pluginsToInstall, {
    isAdd: true,
    isLocally,
    callback(code) {
        process.exit(code || 0);
    }
});

function isBuildIn(id) {
    return id.match(/^BuildIn\:plugin\/(.+)$/i);
}

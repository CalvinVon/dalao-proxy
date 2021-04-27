#!/usr/bin/env node

const fs = require('fs');
const { RC_FILE_PATH, presetPlugins } = require('../config/script');
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

const config = {};
Object.keys(process.env).forEach(key => {
    let res;
    if (res = key.match(/^npm_config_(.+)$/)) {
        config[res[1]] = process.env[key];
    }
});

const isLocally = !(config['g'] || config['global']);

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

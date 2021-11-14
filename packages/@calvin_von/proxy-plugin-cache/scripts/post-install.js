#!/usr/bin/env node

const { packageInstaller } = require('@dalao-proxy/utils');

const config = {};
Object.keys(process.env).forEach(key => {
    let res;
    if (res = key.match(/^npm_config_(.+)$/)) {
        config[res[1]] = process.env[key];
    }
});

const installGlobally = config['g'] || config['global'];

packageInstaller.install('@calvin_von/proxy-plugin-inject', {
    isLocally: !installGlobally,
});
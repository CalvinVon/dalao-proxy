#!/usr/bin/env node

const { spawn } = require('child_process');

const config = {};
Object.keys(process.env).forEach(key => {
    let res;
    if (res = key.match(/^npm_config_(.+)$/)) {
        config[res[1]] = process.env[key];
    }
});

const installGlobally = config['g'] || config['global'];

spawn(
    'npm',
    [
        'i',
        installGlobally ? '-g' : '-D',
        '@calvin_von/proxy-plugin-inject'
    ],
    {
        env: process.env,
        stdio: 'inherit',
        cwd: process.cwd(),
    }
);
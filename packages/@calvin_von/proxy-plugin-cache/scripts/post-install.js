#!/usr/bin/env node

const { packageInstaller, hasGlobalArgs } = require('@dalao-proxy/utils');

const installGlobally = hasGlobalArgs();
packageInstaller.install(['@calvin_von/proxy-plugin-inject'], {
    isLocally: !installGlobally,
});
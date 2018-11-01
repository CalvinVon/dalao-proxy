const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const _ = require('lodash')

const pwd = process.cwd();
const baseConfig = require('../config');
const custom_assign = require('./utils').custom_assign;

const parseEmitter = new EventEmitter();
exports.parseEmitter = parseEmitter;


/**
 * file parser
 * @argument {String} filePath target file to parse
 * @return {Config} mergedFileConfig
 */
function fileParser(filePath, preventDefaultRoute) {
    try {
        const file = fs.readFileSync(filePath, 'utf-8');
        const fileConfig = JSON.parse(file);
        const EXTRA_FIELDS = ['headers', 'proxyTable'];

        // extra fields need to be merged
        const baseConfig_extra = _.pick(baseConfig, EXTRA_FIELDS.filter(field => {
            if (preventDefaultRoute) {
                return field !== 'proxyTable';
            }
            return field;
        }));
        const baseConfig_plain = _.omit(baseConfig, EXTRA_FIELDS);

        const fileConfig_extra = _.pick(fileConfig, EXTRA_FIELDS);
        const fileConfig_plain = _.omit(fileConfig, EXTRA_FIELDS);

        const mergedConfig_plain = _.assignWith({}, baseConfig_plain, fileConfig_plain, custom_assign);
        const mergedConfig_extra = _.merge({}, baseConfig_extra, fileConfig_extra);

        // other plain field need to be replaced
        const mergedFileConfig = _.merge({}, mergedConfig_extra, mergedConfig_plain)

        return mergedFileConfig;
    } catch (error) {
        return baseConfig;
    }
};

/**
 * Main Config Parser
 * user arguments setting > user file setting > base internal setting
 * @author Calvin
 * @param {commander.CommanderStatic} program
 * @return {EventEmitter} parseEmitter
 */
exports.parse = function parse(program) {

    let runtimeConfig = {};
    
    const { config: configFile, emptyRoutes } = program;
    
    // configs
    const argsConfig = _.pick(program, [
        'config',
        "watch",
        "port",
        "host",
        "target",
        "rewrite",
        "cache",
        "info",
        "emptyRoutes"
    ]);

    let filePath;

    try {
        if (!configFile) {
            console.warn('!> No specific config file provided. Running in default config.'.grey);
            filePath = path.resolve(baseConfig.configFilename);
        }
        else {
            filePath = path.resolve(pwd, configFile);
        }

        const fileConfig = fileParser(filePath, emptyRoutes);
        // replace fileConfig by argsConfig
        runtimeConfig = _.assignWith({}, fileConfig, argsConfig, custom_assign);

        if (runtimeConfig.watch) {
            fs.watchFile(filePath, function () {
                console.clear();
                console.log('> 👀   🔞   dalao is watching at your config file');
                console.log('> 😤   dalao find your config file has changed, reloading...'.yellow);
    
                // re-parse config file
                const changedFileConfig = fileParser(filePath, emptyRoutes);
                // replace fileConfig by argsConfig
                runtimeConfig = _.assignWith({}, changedFileConfig, argsConfig, custom_assign);
                // emit event to reload proxy server
                parseEmitter.emit('config:parsed', runtimeConfig);
            });
        }
        // emit event to reload proxy server
        parseEmitter.emit('config:parsed', runtimeConfig);

    } catch (error) {
        console.error(error);
    }
};
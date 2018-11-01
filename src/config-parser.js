const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const _ = require('lodash')

const pwd = process.cwd();
const baseConfig = require('../config');

const parseEmitter = new EventEmitter();
exports.parseEmitter = parseEmitter;


function custom_assign (objValue, srcValue) {
    return !srcValue ? objValue : srcValue;
}


/**
 * file parser
 * @argument {String} filePath target file to parse
 * @return {Config} mergedFileConfig
 */
function fileParser(filePath) {
    try {
        const file = fs.readFileSync(filePath, 'utf-8');
        const fileConfig = JSON.parse(file);
        const EXTRA_FIELDS = ['headers', 'proxyTable'];
        // extra fields need to be merged
        const baseConfig_extra = _.pick(baseConfig, EXTRA_FIELDS);
        const baseConfig_plain = _.omit(baseConfig, EXTRA_FIELDS);

        const fileConfig_extra = _.pick(fileConfig, EXTRA_FIELDS);
        const fileConfig_plain = _.omit(fileConfig, EXTRA_FIELDS);

        const mergedConfig_plain = _.assignWith({}, baseConfig_plain, fileConfig_plain, custom_assign);
        const mergedConfig_extra = _.merge({}, baseConfig_extra, fileConfig_extra);

        // other plain field need to be replaced
        const mergedFileConfig = _.merge({}, mergedConfig_extra, mergedConfig_plain)

        return mergedFileConfig;
    } catch (error) {
        console.warn('!> No specific config file provided. Running in default config.'.grey);
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
    
    const {
        config: configFile,
        watch,
        port,
        host,
        target,
        rewrite,
        cache,
        info
    } = program;
    
    // configs
    const argsConfig = {
        watch,
        port,
        host,
        target,
        rewrite,
        cache,
        info
    };
    const filePath = path.resolve(pwd, configFile);
    const fileConfig = fileParser(filePath);
    // replace fileConfig by argsConfig
    runtimeConfig = _.assignWith({}, fileConfig, argsConfig, custom_assign);

    if (watch) {
        console.log('> 👀   🔞   dalao is watching at your config file'.green);
        fs.watchFile(filePath, function () {
            console.clear();
            console.log('> 😤   dalao find your config file has changed, reloading...'.yellow);

            // re-parse config file
            const changedFileConfig = fileParser(filePath);
            // replace fileConfig by argsConfig
            runtimeConfig = _.assignWith({}, changedFileConfig, argsConfig, custom_assign);
            // emit event to reload proxy server
            parseEmitter.emit('config:parsed', runtimeConfig);
        });
    }

    
    // emit event to reload proxy server
    parseEmitter.emit('config:parsed', runtimeConfig);
};
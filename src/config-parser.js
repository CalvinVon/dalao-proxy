const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const _ = require('lodash')

const pwd = process.cwd();
const baseConfig = require('../config');

const parseEmitter = new EventEmitter();
exports.parseEmitter = parseEmitter;


/**
 * file parser
 * @argument {String} filePath target file to parse
 * @return {Config} mergedFileConfig
 */
function fileParser(filePath) {
    try {
        const file = fs.readFileSync(path.resolve(pwd, filePath), 'utf-8');
        const fileConfig = JSON.parse(file);
        // extra fields need to be merged
        const baseExtraConfig = _.pick(baseConfig, ['headers', 'proxyTable']);

        const plainMergedConfig = _.assign({}, baseConfig, fileConfig);

        // other plain field need to be replaced
        const mergedFileConfig = _.merge({}, baseExtraConfig, plainMergedConfig)

        return mergedFileConfig;
    } catch (error) {
        throw (error);
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
        cache
    } = program;
    
    // configs
    const argsConfig = {
        watch,
        port,
        host,
        cache
    };
    const fileConfig = fileParser(configFile);
    const baseConfig = require('../config');
    
    runtimeConfig = _.assign({}, baseConfig, fileConfig, argsConfig);

    parseEmitter.emit('config:parsed', runtimeConfig);
};
/**
 * Main Config Parser
 * user arguments setting > user file setting > base internal setting
 * @author Calvin
 */
const fs = require('fs');
const path = require('path');
const _ = require('lodash/core')

const pwd = process.cwd();
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



/**
 * file parser
 * @argument {String} filePath target file to parse
 * @return {Config} mergedConfig
 */
function fileParser (filePath) {
    try {
        const file = fs.readFileSync(path.resolve(pwd, filePath), 'utf-8');
        const config = JSON.parse(file);
        const mergedConfig = Object.assign({}, baseConfig, config)
        console.log(mergedConfig);

        return mergedConfig;
    } catch (error) {
        throw(error);
    }
};
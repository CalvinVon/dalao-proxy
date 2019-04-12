const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const _ = require('lodash')

const pwd = process.cwd();
const baseConfig = require('../config');
const { custom_assign, pathCompareFactory, transformPath } = require('./utils');

const parseEmitter = new EventEmitter();
exports.parseEmitter = parseEmitter;


/**
 * Parse file defined config
 * @argument {String} filePath target file to parse
 * @return {Config} mergedFileConfig
 */
function fileParser(filePath, preventDefaultRoute) {
    try {
        const file = fs.readFileSync(filePath, 'utf-8');
        const fileConfig = JSON.parse(file);
        // * merge strategy fields
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
 * Parse each router in Route Table
 * @param {Object} config
 */
function parseRouter(config) {

    const {
        target,
        static: staticTarget,
        proxyTable,
        rewrite,
        cache,
        cacheDirname
    } = config;

    if (cache) {
        try {
            fs.mkdirSync(path.resolve(pwd, cacheDirname));
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.warn(error.message);
            }
        }
    }

    // if (staticTarget) {
    //     console.log(` > Static Resource Proxy to ${staticTarget}`.green);
    // }

    const Table = require('cli-table');

    // parse provided proxy table
    const outputTable = new Table({
        head: ['Proxy'.yellow, 'Target'.white, 'Rewrite Path'.white, 'Result'.yellow]
    });
    
    const proxyPaths = Object.keys(proxyTable).sort(pathCompareFactory(1));
    proxyPaths.forEach(proxyPath => {
        const router = proxyTable[proxyPath];        

        /**
         * assign localValue
         * if no value provided, replace with global/default value
         * [ localKey, globalValue ]
         */
        [
            ['path', proxyPath],
            ['target', target],
            ['rewrite', rewrite],
            ['cache', cache],
        ].forEach(pair => {
            pair[2] = resolveRouteConfig(router, pair[0], pair[1]);
        });

        const {
            path: overwritePath,
            target: overwriteTarget,
            rewrite: overwriteRewrite,
        } = router;

        outputTable.push([
            proxyPath,
            overwriteTarget + overwritePath,
            overwriteRewrite,
            transformPath(proxyPath, overwriteTarget, overwritePath, proxyPath, overwriteRewrite)
        ]);
    });
    console.log(outputTable.toString().green);
}

/**
 * Resolve single router configuration
 * @param {RouterObject} router
 * @param {String} localPath
 * @param {any} globalValue
 * @return {any} resolvedValue
 */
function resolveRouteConfig (router, localKey, globalValue) {
    if (_.isUndefined(router[localKey])) {
        router[localKey] = globalValue;
        return globalValue;
    }
    else {
        return router[localKey];
    }
}

/**
 * Main Config Parser
 * user arguments setting > user file setting > base internal setting
 * @author Calvin
 * @param {commander.CommanderStatic} program
 */
exports.parse = function parse(program) {

    let runtimeConfig = {};
    
    const { config: configFile } = program;
    
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
            console.warn(' > No specific config file provided. Running in default config.'.grey);
            filePath = path.resolve(baseConfig.configFilename);
        }
        else {
            filePath = path.resolve(pwd, configFile);
        }

        const fileConfig = fileParser(filePath);
        // replace fileConfig by argsConfig
        runtimeConfig = _.assignWith({}, fileConfig, argsConfig, custom_assign);
        parseRouter(runtimeConfig);

        if (fs.existsSync(filePath) && runtimeConfig.watch) {
            console.log(`> 👀 dalao is ${'watching'.green} at your config file`);
            fs.watchFile(filePath, function () {
                console.clear();
                console.log('> 👀   dalao is watching at your config file');
                console.log('> 😤   dalao find your config file has changed, reloading...'.yellow);
    
                // re-parse config file
                const changedFileConfig = fileParser(filePath, runtimeConfig.emptyRoutes);
                // replace fileConfig by argsConfig
                runtimeConfig = _.assignWith({}, changedFileConfig, argsConfig, custom_assign);
                parseRouter(runtimeConfig);
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
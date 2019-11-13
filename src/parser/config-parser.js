const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const _ = require('lodash')

const pwd = process.cwd();
const defaultConfig = require('../../config');
const CheckFunctions = require('./check');
const { register } = require('../plugin');
const {
    custom_assign,
    pathCompareFactory,
    transformPath,
    joinUrl,
    addHttpProtocol,
    splitTargetAndPath,
} = require('../utils');

const parseEmitter = new EventEmitter();
exports.emitter = parseEmitter;

let isWatching;

function cleanRequireCache(fileName) {
    const id = fileName;
    const cache = require.cache;

    if (cache[id]) {
        const mod = cache[id];
        module.children = module.children.filter(m => m !== mod);
        cache[id] = null;
        delete cache[id];
    }
}


/**
 * Resolve the absolute path of config file
 * @param {String} configFilePath
 * @returns {String}
 */
function resolveConfigPath(configFilePath) {
    let filePath;
    // if specific
    if (configFilePath) {
        filePath = path.resolve(pwd, configFilePath);
    }
    else {
        filePath = path.resolve(defaultConfig.configFileName);
    }

    try {
        filePath = require.resolve(filePath);
        return filePath;
    } catch (error) {
        return null;
    }
}


/**
 * Parse config file in JSON and JS type into an object
 * @param {String} filePath
 * @returns {Object}
 */
function parseFile(filePath) {
    const resolvedPath = resolveConfigPath(filePath);
    try {
        if (resolvedPath) {
            cleanRequireCache(resolvedPath);
            const fileConfig = require(resolvedPath);
            return {
                path: resolvedPath,
                config: mergeConfig(defaultConfig, fileConfig)
            };
        }
        else {
            return {
                path: null,
                config: defaultConfig
            };
        }
    } catch (error) {
        console.error(chalk.red(` > An error occurred (${error.message}) while parsing config file.`))
        return {
            path: resolvedPath,
            config: defaultConfig
        };
    }
}


/**
 * Parse value of `config` from command line
 * @returns {String}
 */
function parsePathFromArgv() {
    const argvs = process.argv;

    let i = 0;
    for (let argv of argvs) {
        let matched;
        if (matched = argv.match(/^(?:--config|-C)(?:=(.+))?/)) {
            let theValue;
            if (matched[1]) {
                theValue = matched[1];
            }
            else {
                theValue = argvs[i + 1];
            }
            if (!/^--?/.test(theValue)) {
                return theValue;
            }
        }
        i++;
    }
}


/**
 * Merge base config and file config
 * @param {Object} fileConfig
 * @returns {Object}
 */
function mergeConfig(baseConfig, fileConfig) {
    if (!fileConfig) return baseConfig;

    // * merge strategy fields
    const EXTRA_FIELDS = {
        obj: ['headers', 'proxyTable'],
        arr: ['plugins']
    };
    const EXTRA_FIELDS_ALL = [...EXTRA_FIELDS.obj, ...EXTRA_FIELDS.arr];

    // extra fields need to be merged
    const baseConfig_extra_obj = _.pick(baseConfig, EXTRA_FIELDS.obj);
    const baseConfig_extra_arr = _.pick(baseConfig, EXTRA_FIELDS.arr);
    const baseConfig_plain = _.omit(baseConfig, EXTRA_FIELDS_ALL);

    const fileConfig_extra_obj = _.pick(fileConfig, EXTRA_FIELDS.obj);
    const fileConfig_extra_arr = _.pick(fileConfig, EXTRA_FIELDS.arr);
    const fileConfig_plain = _.omit(fileConfig, EXTRA_FIELDS_ALL);

    const mergedConfig_plain = _.assignWith({}, baseConfig_plain, fileConfig_plain, custom_assign);

    // Check config value
    Object.keys(mergedConfig_plain).forEach(config => {
        const checkFn = CheckFunctions[config];
        checkFn && checkFn(mergedConfig_plain[config]);
    });

    const mergedConfig_extra_obj = _.merge({}, baseConfig_extra_obj, fileConfig_extra_obj);

    const mergedConfig_extra_arr = {};
    EXTRA_FIELDS.arr.forEach(field => {
        const baseConfigField = baseConfig_extra_arr[field] || [];
        const fileConfigField = fileConfig_extra_arr[field] || [];
        mergedConfig_extra_arr[field] = [...new Set([...baseConfigField, ...fileConfigField])];
    });

    // other plain field need to be replaced
    const mergedFileConfig = _.merge({}, mergedConfig_extra_obj, mergedConfig_extra_arr, mergedConfig_plain)

    return mergedFileConfig;
}

/**
 * Parse each router in Route Table
 * @param {Object} config
 * @return {CliTable}
 */
function parseRouter(config) {

    const {
        target,
        proxyTable,
    } = config;


    const Table = require('cli-table');
    const outputTable = new Table({
        head: [chalk.yellow('Proxy'), chalk.white('Target'), chalk.white('Path Rewrite'), chalk.yellow('Result')]
    });

    const proxyPaths = Object.keys(proxyTable).sort(pathCompareFactory(1));

    proxyPaths.forEach(proxyPath => {
        if (!CheckFunctions.proxyTable.proxyPath(proxyPath)) return;
        const router = proxyTable[proxyPath];
        /**
         * assign localValue
         * if no value provided, replace with global/default value
         * [ localKey, defaultValue, checkFunction ]
         */
        [
            ['path', '/', CheckFunctions.proxyTable.path],
            ['target', target, CheckFunctions.proxyTable.target],
            ['pathRewrite', {}],
        ].forEach(pair => {
            checkRouteConfig(router, pair);
        });

        outputTable.push(resolveRouteProxyMap(proxyPath, router));
    });

    return outputTable;
}

/**
 * Resolve single router configuration
 * @param {RouterObject} router
 * @param {String} localPath
 * @param {any} defaultValue
 * @return {any} resolvedValue
 */
function checkRouteConfig(router, [localKey, defaultValue, checkFn]) {
    if (_.isUndefined(router[localKey])) {
        router[localKey] = defaultValue;
    }

    checkFn && checkFn(router[localKey]);
}


/**
 * Resolve route proxy map
 * @param {String} proxyPath original route path
 * @param {Object} router router config
 */
function resolveRouteProxyMap(proxyPath, router) {
    const {
        path: overwritePath,
        target: overwriteTarget,
        pathRewrite: overwritePathRewrite,
    } = router;

    function pathRewriteToString(pathRewriteMap) {
        if (_.isEmpty(pathRewriteMap)) {
            return '-';
        }
        else {
            const Table = require('cli-table');
            const rewriteMapTable = new Table({
                chars: {
                    'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
                    , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
                    , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
                    , 'right': '', 'right-mid': '', 'middle': ' '
                },
                style: { 'padding-left': 0 }
            });


            Object.keys(pathRewriteMap).forEach(path => {
                rewriteMapTable.push([`'${path}'`, chalk.yellow('->'), `'${pathRewriteMap[path]}'`]);
            });

            return rewriteMapTable.toString();
        }
    }


    function resolveProxyRoute() {
        const { target: overwriteTarget_target, path: overwriteTarget_path } = splitTargetAndPath(overwriteTarget);
        let proxyedPath = joinUrl(overwriteTarget_path, overwritePath, proxyPath);
        proxyedPath = transformPath(overwriteTarget_target + proxyedPath, overwritePathRewrite);
        return addHttpProtocol(proxyedPath);
    }

    return [
        // Proxy
        proxyPath,
        // Target 
        joinUrl(splitTargetAndPath(overwriteTarget)['path'], overwritePath),
        // Path Rewrite
        pathRewriteToString(overwritePathRewrite),
        // Result
        resolveProxyRoute(),
    ];
}


/**
 * Main Config Parser
 * user arguments setting > user file setting > base internal setting
 * @author Calvin
 * @param {Commander} command
 */
exports.parse = function parse(command) {

    let runtimeConfig = {};
    const { config: configFile } = command;

    // configs
    const argsConfig = _.pick(command, [
        'config',
        "watch",
        "port",
        "host",
        "target",
        "info",
    ]);

    argsConfig.configFileName = configFile;
    delete argsConfig.config;

    const { path: filePath, config: fileConfig } = parseFile(configFile);
    // replace fileConfig by argsConfig
    runtimeConfig = _.assignWith({}, fileConfig, argsConfig, custom_assign);

    const output = {
        routeTable: parseRouter(runtimeConfig)
    };

    register._trigger('output', output, value => {
        command.context.output = value;
    });

    const currentCommand = command.context.command;

    if (currentCommand && fs.existsSync(filePath) && !isWatching && runtimeConfig.watch) {
        fs.unwatchFile(filePath);
        fs.watchFile(filePath, function () {
            console.clear();
            console.log('> 👳   dalao is watching at your config file');
            console.log(chalk.yellow('> 😤   dalao find your config file has changed, reloading...'));

            // reparse config file
            const changedFileConfig = parseFile(filePath).config;
            // replace fileConfig by argsConfig
            runtimeConfig = _.assignWith({}, changedFileConfig, argsConfig, custom_assign);

            const routeTable = parseRouter(runtimeConfig);
            register._trigger('output', { routeTable }, value => {
                command.context.output = value;

                // emit event to reload proxy server
                parseEmitter.emit('config:parsed', {
                    path: filePath,
                    config: runtimeConfig
                });
                isWatching = true;
            });
        });
    }
    // emit event to reload proxy server
    // parseEmitter.emit('config:parsed', runtimeConfig);
    parseEmitter.emit('config:parsed', {
        path: filePath,
        config: runtimeConfig
    });

};


/**
 * Parse plugins from config and installed
 * @returns {Array}
 */
exports.parsePlugins = function parsePlugins() {
    const fileConfig = parseFile(parsePathFromArgv()).config;
    return fileConfig.plugins;
}
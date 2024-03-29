const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const _ = require('lodash');

const pwd = process.cwd();
const defaultConfig = _.cloneDeep(require('../../config'));
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
                rawConfig: fileConfig,
                config: mergeConfig(defaultConfig, fileConfig)
            };
        }
        else {
            return {
                path: null,
                rawConfig: null,
                config: defaultConfig
            };
        }
    } catch (error) {
        console.error(chalk.red(` > An error occurred (${error.message}) while parsing config file.`))
        return {
            path: resolvedPath,
            rawConfig: null,
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

    // merge plain fields
    const baseConfig_plain = _.omit(baseConfig, EXTRA_FIELDS_ALL);
    const fileConfig_plain = _.omit(fileConfig, EXTRA_FIELDS_ALL);
    const mergedConfig_plain = _.assignWith({}, baseConfig_plain, fileConfig_plain, custom_assign);

    Object.keys(mergedConfig_plain).forEach(config => {
        const checkFn = CheckFunctions[config];
        checkFn && checkFn(mergedConfig_plain[config]);
    });

    // merge extra fields
    const baseConfig_extra_obj = _.pick(baseConfig, EXTRA_FIELDS.obj);
    const baseConfig_extra_arr = _.pick(baseConfig, EXTRA_FIELDS.arr);
    const fileConfig_extra_obj = _.pick(fileConfig, EXTRA_FIELDS.obj);
    const fileConfig_extra_arr = _.pick(fileConfig, EXTRA_FIELDS.arr);

    Object.keys(fileConfig_extra_obj).forEach(key => fileConfig_extra_obj[key] = fileConfig_extra_obj[key] || {});
    Object.keys(fileConfig_extra_arr).forEach(key => fileConfig_extra_arr[key] = fileConfig_extra_arr[key] || []);
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


function mergePluginsConfig(targetConfig, plugins) {
    plugins.forEach(plugin => {
        let field;
        if (Array.isArray(plugin.setting.optionsField)) {
            field = plugin.setting.optionsField[0];
            plugin.setting.optionsField.forEach(field => delete targetConfig[field]);
        }
        else {
            field = plugin.setting.optionsField;
        }
        if (field) {
            targetConfig[field] = plugin.config;
        }
    });
}

/**
 * Parse each router in Route Table
 * @param {Object} config
 * @return {CliTable}
 */
function parseRouter(config) {

    const {
        target,
        changeOrigin,
        proxyTable,
    } = config;


    const Table = require('cli-table3');
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
            ['changeOrigin', changeOrigin],
            ['pathRewrite', {}],
        ].forEach(pair => {
            checkRouteConfig(router, pair);
        });

        router.target = addHttpProtocol(router.target);

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
            const Table = require('cli-table3');
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
        return proxyedPath;
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
    const argsConfig = Object.assign({}, command.context.options);

    argsConfig.configFileName = argsConfig.config;
    delete argsConfig.config;

    const { path: filePath, config: fileConfig } = parseFile(argsConfig.configFileName);

    // replace fileConfig by argsConfig
    runtimeConfig = _.assignWith({}, fileConfig, argsConfig, custom_assign);
    mergePluginsConfig(runtimeConfig, command.context.plugins);

    const output = {
        routeTable: parseRouter(runtimeConfig)
    };

    register._trigger('output', output, value => {
        command.context.output = value;
    });

    const currentCommand = command.context.command;

    if (currentCommand && fs.existsSync(filePath) && runtimeConfig.watch) {
        fs.unwatchFile(filePath);
        fs.watchFile(filePath, function () {
            parseEmitter.emit('config:triggerParse:fileChange');
            console.log(chalk.yellow('> dalao find your config file has changed, reloading...'));
        });
    }
    // emit event to reload proxy server
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
    return parseFile(parsePathFromArgv());
}

exports.mergePluginsConfig = mergePluginsConfig;
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const _ = require('lodash')

const pwd = process.cwd();
const baseConfig = require('../config');
const CheckFunctions = require('./check');
const {
    custom_assign,
    pathCompareFactory,
    transformPath,
    joinUrl,
    addHttpProtocol,
    splitTargetAndPath,
    checkAndCreateCacheFolder
} = require('./utils');

const parseEmitter = new EventEmitter();
exports.parseEmitter = parseEmitter;

let isWatching;


/**
 * Parse file defined config
 * @argument {String} filePath target file to parse
 * @return {Config} mergedFileConfig
 */
function fileParser(filePath) {
    try {
        const file = fs.readFileSync(filePath, 'utf-8');
        const fileConfig = JSON.parse(file);
        // * merge strategy fields
        const EXTRA_FIELDS = ['headers', 'proxyTable'];

        // extra fields need to be merged
        const baseConfig_extra = _.pick(baseConfig, EXTRA_FIELDS);
        const baseConfig_plain = _.omit(baseConfig, EXTRA_FIELDS);

        const fileConfig_extra = _.pick(fileConfig, EXTRA_FIELDS);
        const fileConfig_plain = _.omit(fileConfig, EXTRA_FIELDS);

        const mergedConfig_plain = _.assignWith({}, baseConfig_plain, fileConfig_plain, custom_assign);

        // Check config value
        Object.keys(mergedConfig_plain).forEach(config => {
            const checkFn = CheckFunctions[config];
            checkFn && checkFn(mergedConfig_plain[config]);
        });

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
        proxyTable,
        cache,
        cacheDirname,
        cacheContentType,
    } = config;

    if (cache) {
        checkAndCreateCacheFolder(cacheDirname);
    }

    const Table = require('cli-table');
    const outputTable = new Table({
        head: ['Proxy'.yellow, 'Target'.white, 'Path Rewrite'.white, 'Result'.yellow, 'Cache'.yellow]
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
            ['path',            '/',        CheckFunctions.proxyTable.path],
            ['target',          target,     CheckFunctions.proxyTable.target],
            ['pathRewrite',     {}],
            ['cache',           cache,      CheckFunctions.proxyTable.cache],
            ['cacheContentType',cacheContentType]
        ].forEach(pair => {
            checkRouteConfig(router, pair);
        });

        outputTable.push(resolveRouteProxyMap(proxyPath, router));
    });
    console.log(outputTable.toString().green);
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
        cache: overwriteCache,
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
                rewriteMapTable.push([`'${path}'`, '->'.yellow, `'${pathRewriteMap[path]}'`]);
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
        // Cache
        overwriteCache
    ];
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
        "cache",
        "info",
    ]);

    let filePath;

    if (!configFile) {
        filePath = path.resolve(baseConfig.configFilename);
    }
    else {
        filePath = path.resolve(pwd, configFile);
    }

    const fileConfig = fileParser(filePath);
    // replace fileConfig by argsConfig
    runtimeConfig = _.assignWith({}, fileConfig, argsConfig, custom_assign);
    parseRouter(runtimeConfig);

    if (fs.existsSync(filePath) && !isWatching && runtimeConfig.watch) {
        console.log(`> 👀 dalao is ${'watching'.green} at your config file`);
        fs.watchFile(filePath, function () {
            console.clear();
            console.log('> 👀   dalao is watching at your config file');
            console.log('> 😤   dalao find your config file has changed, reloading...'.yellow);

            // re-parse config file
            const changedFileConfig = fileParser(filePath);
            // replace fileConfig by argsConfig
            runtimeConfig = _.assignWith({}, changedFileConfig, argsConfig, custom_assign);
            parseRouter(runtimeConfig);
            // emit event to reload proxy server
            parseEmitter.emit('config:parsed', runtimeConfig);
            isWatching = true;
        });
    }
    // emit event to reload proxy server
    parseEmitter.emit('config:parsed', runtimeConfig);

};
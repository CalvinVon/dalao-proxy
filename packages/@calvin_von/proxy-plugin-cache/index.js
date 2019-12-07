const chalk = require('chalk');
const path = require('path');
const moment = require('moment');
const fs = require('fs');
const {
    checkAndCreateCacheFolder,
    url2filename
} = require('./utils');

function cleanRequireCache(fileName) {
    const id = fileName;
    const cache = require.cache;

    const cleanRelativeModuleCache = (mod) => {
        mod.children.forEach(it => {
            // clean modules not from npm
            if (!/node_modules/.test(it.id)) {
                delete require.cache[it.id];
                cleanRelativeModuleCache(it);
            }
        });
    };

    if (cache[id]) {
        const mod = cache[id];
        cleanRelativeModuleCache(mod);
        module.children = module.children.filter(m => m !== mod);
        cache[id] = null;
        delete cache[id];
    }
}

module.exports = {
    beforeCreate() {

    },
    beforeProxy(context, next) {
        const SUPPORTED_EXTENSIONS = ['.js', '.json'];
        const { config, response, request } = context;
        const { cacheDirname, info } = config;
        const { cache, cacheMaxAge } = context.matched.route;
        const { method, url } = request;

        // Try to read cache
        // Cache Read Strategy(Updated at v0.9.0):
        //      - `cache` option is `true`
        //      - the `cache file` DO NOT contains `CACHE_TIME` field
        try {
            if (cache) {
                checkAndCreateCacheFolder(cacheDirname);
                const cacheSearchName = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}`);
                const [cacheUnit = 'second', cacheDigit = 0] = cacheMaxAge;

                let targetFileName;
                const hasCacheFile = SUPPORTED_EXTENSIONS.some(ext => {
                    if (fs.existsSync(cacheSearchName + ext)) {
                        targetFileName = cacheSearchName + ext;
                        return true;
                    }
                    return false;
                })

                if (hasCacheFile) {
                    const jsonContent = require(targetFileName);
                    const fileContent = JSON.stringify(jsonContent, null, 4);

                    const cachedTimeStamp = jsonContent['CACHE_TIME'];

                    // need validate expire time
                    if (!cachedTimeStamp || cacheDigit === '*') {
                        response.setHeader('X-Cache-Request', 'true');
                        response.setHeader('X-Cache-Expire-Time', 'permanently valid');
                        response.setHeader('X-Cache-Rest-Time', 'forever');

                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        response.end(fileContent);
                        context.cache = {
                            data: jsonContent,
                            rawData: fileContent,
                            type: 'application/json',
                            size: fileContent.length
                        };

                        info && logMatchedPath(targetFileName);

                        // 中断代理请求
                        next('Hit cache');
                    }
                    // permanently valid
                    else {
                        const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);
                        // valid cache file
                        if (moment().isBefore(deadlineMoment)) {
                            response.setHeader('X-Cache-Request', 'true');
                            // calculate rest cache time
                            response.setHeader('X-Cache-Expire-Time', moment(deadlineMoment).format('llll'));
                            response.setHeader('X-Cache-Rest-Time', moment.duration(moment().diff(deadlineMoment)).humanize());

                            response.writeHead(200, {
                                'Content-Type': 'application/json'
                            });
                            response.end(fileContent);
                            context.cache = jsonContent;

                            info && logMatchedPath(targetFileName);

                            // 中断代理请求
                            next('Hit cache');
                        }
                        else {
                            // Do not delete expired cache automatically
                            // V0.6.4 2019.4.17
                            // fs.unlinkSync(cacheSearchName);

                            // 继续代理请求
                            next();
                        }
                    }

                    cleanRequireCache(targetFileName);

                }
                else {
                    next();
                }
            }
            else {
                next();
            }
        } catch (error) {
            console.error(error);
            next();
        }

        function logMatchedPath(targetFileName) {
            const message = chalk.green(`> ⚡   Hit! [${context.matched.path}]`)
                + `   ${method.toUpperCase()}   ${url}`
                + chalk.green('  >>>>  ')
                + chalk.yellow(targetFileName);
            console.log(message);
        }
    },
    afterProxy(context) {
        const { cacheDirname } = context.config;
        const { method, url } = context.request;
        const { response: proxyResponse } = context.proxy;
        const { route: matchedRouter } = context.matched;

        const {
            cache,
            cacheContentType,
            responseFilter
        } = matchedRouter;

        // cache the response data
        if (cache && !context.data.error) {
            try {
                const response = proxyResponse.response;
                const cacheSearchName = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`)

                // Only cache ajax request response
                let contentTypeReg = /application\/json/;

                // TODO: multiple type caching support
                if (cacheContentType.length) {
                    contentTypeReg = new RegExp(`(${
                        cacheContentType
                            .map(it => it.replace(/^\s*/, '').replace(/\s*$/, ''))
                            .join('|')
                        })`);
                }
                if (contentTypeReg.test(response.headers['content-type'])) {
                    const resJson = Object.assign({}, context.data.response.data);

                    if (resJson[responseFilter[0]] === responseFilter[1]) {
                        resJson.CACHE_INFO = 'Cached from Dalao Proxy';
                        resJson.CACHE_TIME = Date.now();
                        resJson.CACHE_TIME_TXT = moment().format('YYYY-MM-DD HH:mm:ss');
                        resJson.CACHE_REQUEST_DATA = {
                            url,
                            method,
                            ...context.data.request
                        };
                        fs.writeFileSync(
                            cacheSearchName,
                            JSON.stringify(resJson, null, 4),
                            {
                                encoding: 'utf8',
                                flag: 'w'
                            }
                        );

                        console.log(chalk.grey('> 📥   Cached into [') + chalk.grey(cacheSearchName) + chalk.grey(']'));
                    }

                }

            } catch (error) {
                console.error(error);
                console.error(chalk.red(` > An error occurred (${error.message}) while caching response data.`));
            }
        }
    }
}
const chalk = require('chalk');
const path = require('path');
const moment = require('moment');
const fs = require('fs');
const { FOREVER_VALID_FIELD_TEXT, HEADERS_FIELD_TEXT } = require('./generate-mock');
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
    beforeProxy(context, next) {
        const SUPPORTED_EXTENSIONS = ['.js', '.json'];
        const { response, request } = context;
        const {
            dirname: cacheDirname,
            maxAge: cacheMaxAge,
            logger,
        } = this.config;

        const { method, url } = request;

        // Try to read cache
        try {
            checkAndCreateCacheFolder(cacheDirname);
            const cacheSearchName = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}`);
            const [cacheDigit = 0, cacheUnit = 'second'] = cacheMaxAge;

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
                if (jsonContent[FOREVER_VALID_FIELD_TEXT] || !cachedTimeStamp || cacheDigit === '*') {
                    const headers = jsonContent[HEADERS_FIELD_TEXT];
                    for (const header in headers) {
                        response.setHeader(header, headers[header]);
                    }
                    response.setHeader('X-Cache-Response', 'true');
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

                    logger && logMatchedPath(targetFileName);

                    // 中断代理请求
                    next('Hit cache');
                }
                // permanently valid
                else {
                    const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);
                    // valid cache file
                    if (moment().isBefore(deadlineMoment)) {
                        response.setHeader('X-Cache-Response', 'true');
                        // calculate rest cache time
                        response.setHeader('X-Cache-Expire-Time', moment(deadlineMoment).format('llll'));
                        response.setHeader('X-Cache-Rest-Time', moment.duration(moment().diff(deadlineMoment)).humanize());

                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        response.end(fileContent);
                        context.cache = jsonContent;

                        logger && logMatchedPath(targetFileName);

                        // do interrupter
                        next('Hit cache');
                    }
                    else {
                        // Do not delete expired cache automatically
                        // V0.6.4 2019.4.17
                        // fs.unlinkSync(cacheSearchName);

                        // continue
                        next();
                    }
                }

                cleanRequireCache(targetFileName);

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
        const {
            dirname: cacheDirname,
            contentType: cacheContentType,
            filters
        } = this.config;
        const { method, url } = context.request;
        const { response: proxyResponse } = context.proxy;

        const route = context.matched.route;
        const cacheFilters = filters.filter(filter => (filter.applyRoute === '*' || filter.applyRoute === route.path));

        // cache the response data
        if (!context.data.error) {
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

                    if (isMeetFiltering()) {
                        resJson.CACHE_INFO = 'Cached from Dalao Proxy';
                        resJson.CACHE_TIME = Date.now();
                        resJson.CACHE_TIME_TXT = moment().format('YYYY-MM-DD HH:mm:ss');
                        resJson.CACHE_REQUEST_DATA = {
                            url,
                            method,
                            ...context.data.request
                        };
                        resJson[FOREVER_VALID_FIELD_TEXT] = false;
                        resJson[HEADERS_FIELD_TEXT] = context.proxy.response.headers;
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

                    function isMeetFiltering() {
                        if (!cacheFilters.length) return true;

                        let isMeetList = [];
                        for (const filter of cacheFilters) {
                            let isMeet;
                            if (filter.custom) {
                                isMeet = filter.custom.call(this, content, context);
                            }
                            else {
                                const filterContext = {
                                    query: context.data.request.query,
                                    body: context.data.request.body,
                                    data: resJson,
                                    headers: context.proxy[filter.when].headers
                                };
                                isMeet = filterContext[filter.where][filter.field] === filter.value;
                            }

                            isMeetList.push(isMeet);
                            if (!isMeet) {
                                break;
                            }
                        }

                        return isMeetList.every(Boolean);
                    }

                }

            } catch (error) {
                console.error(error);
                console.error(chalk.red(` > An error occurred (${error.message}) while caching response data.`));
            }
        }
    }
}
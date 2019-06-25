const path = require('path');
const moment = require('moment');
const fs = require('fs');
const _ = require('lodash');
const {
    checkAndCreateCacheFolder,
    url2filename
} = require('./utils');

function cleanRequireCache(file) {
    const id = require.resolve(file);
    const cache = require.cache;

    if (cache[id]) {
        module.children = module.children.filter(mod => mod.id !== id);
        delete cache[id];
    }
}

module.exports = {
    beforeProxy(context, next) {
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
                const cacheFileName = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}`);
                const [cacheUnit = 'second', cacheDigit = 0] = cacheMaxAge;

                if (fs.existsSync(cacheFileName + '.js') || fs.existsSync(cacheFileName + '.json')) {
                    cleanRequireCache(cacheFileName);

                    const jsonContent = require(cacheFileName);
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

                        info && logMatchedPath();

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

                            info && logMatchedPath();

                            // 中断代理请求
                            next('Hit cache');
                        }
                        else {
                            // Do not delete expired cache automatically
                            // V0.6.4 2019.4.17
                            // fs.unlinkSync(cacheFileName);

                            // 继续代理请求
                            next();
                        }
                    }

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

        function logMatchedPath() {
            const message = `> ⚡   Hit! [${context.matched.path}]`.green + `   ${method.toUpperCase()}   ${url}  ${'>>>>'.green}  ${context.proxy.uri}`.white;
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
                const cacheFileName = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`)

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

                    if (_.get(resJson, responseFilter[0]) === responseFilter[1]) {
                        resJson.CACHE_INFO = 'Cached from Dalao Proxy';
                        resJson.CACHE_TIME = Date.now();
                        resJson.CACHE_TIME_TXT = moment().format('YYYY-MM-DD HH:mm:ss');
                        resJson.CACHE_REQUEST_DATA = {
                            url,
                            method,
                            ...context.data.request
                        };
                        fs.writeFileSync(
                            cacheFileName,
                            JSON.stringify(resJson, null, 4),
                            {
                                encoding: 'utf8',
                                flag: 'w'
                            }
                        );

                        console.log('> 📥   Cached into ['.grey + cacheFileName.grey + ']'.grey);
                    }

                }

            } catch (error) {
                console.error(error);
                console.error(` > An error occurred (${error.message}) while caching response data.`.red);
            }
        }
    }
}
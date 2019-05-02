const path = require('path');
const moment = require('moment');
const fs = require('fs');
const {
    checkAndCreateCacheFolder,
    url2filename
} = require('./utils');

module.exports = {
    beforeProxy(context, next) {
        const { config, response, request } = context;
        const { cacheDirname } = config;
        const { cache, cacheMaxAge } = context.matched.route;
        const { method, url } = request;

        // Try to read cache
        // Cache Read Strategy:
        //      - `cache` option is `true`
        //      - `cacheDigit` field > 0
        //      - `cacheDigit` field is `*`
        //        `cacheDigit` field is considered to be `*` by default when it's empty
        try {
            if (cache) {
                checkAndCreateCacheFolder(cacheDirname);
                const cacheFileName = path
                    .resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`);
                const [cacheUnit = 'second', cacheDigit = '*'] = cacheMaxAge;
                if (cacheDigit != 0 && fs.existsSync(cacheFileName)) {

                    const fileContent = fs.readFileSync(cacheFileName, 'utf8');
                    const jsonContent = JSON.parse(fileContent);

                    const cachedTimeStamp = jsonContent['CACHE_TIME'] || Date.now();
                    const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);

                    // need validate expire time
                    if (cacheDigit === '*') {
                        response.setHeader('X-Cache-Request', 'true');
                        response.setHeader('X-Cache-Expire-Time', 'permanently valid');
                        response.setHeader('X-Cache-Rest-Time', 'forever');

                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        response.end(fileContent);

                        logMatchedPath(true);

                        // 中断代理请求
                        next(true);
                    }
                    // permanently valid
                    else {
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

                            logMatchedPath(true);

                            // 中断代理请求
                            next(true);
                        }
                        else {
                            // Do not delete expired cache automatically
                            // V0.6.4 2019.4.17
                            // fs.unlinkSync(cacheFileName);

                            // 继续代理请求
                            next(false);
                        }
                    }

                }
                else next();
            }
            else {
                next();
            }
        } catch (error) {
            console.error(error);
            next(false);
        }

        function logMatchedPath(cached) {
            process.stdout.write(`> 🎯   ${cached ? 'Cached' : 'Hit'}! [${context.matched.path}]`.green);
            process.stdout.write(`   ${method.toUpperCase()}   ${url}  ${'>>>>'.green}  ${context.proxy.uri}`.white);
            process.stdout.write('\n');
        }
    },
    // afterProxy({ config, matchedRouter, proxyResponse }) {
    //     const {
    //         cacheDirname,
    //     } = config;

    //     const {
    //         cache,
    //         cacheContentType,
    //         responseFilter
    //     } = matchedRouter;

    //     // cache the response data
    //     if (cache) {
    //         let responseData = [];
    //         proxyResponse.on('data', chunk => {
    //             responseData.push(chunk);
    //         });

    //         proxyResponse.on('end', setResponseCache);

    //         function setResponseCache() {
    //             try {
    //                 const buffer = Buffer.concat(responseData);
    //                 const response = proxyResponse.response;
    //                 const cacheFileName = path
    //                     .resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`)

    //                 // gunzip first
    //                 if (/gzip/.test(response.headers['content-encoding'])) {
    //                     responseData = zlib.gunzipSync(buffer);
    //                 }
    //                 // Only cache ajax request response
    //                 let contentTypeReg = /application\/json/;
    //                 if (cacheContentType.length) {
    //                     contentTypeReg = new RegExp(`(${
    //                         cacheContentType
    //                             .map(it => it.replace(/^\s*/, '').replace(/\s*$/, ''))
    //                             .join('|')
    //                         })`);
    //                 }
    //                 if (contentTypeReg.test(response.headers['content-type'])) {
    //                     const resJson = JSON.parse(fixJson(responseData.toString()));

    //                     if (_.get(resJson, responseFilter[0]) === responseFilter[1]) {
    //                         resJson.CACHE_INFO = 'Cached from Dalao Proxy';
    //                         resJson.CACHE_TIME = Date.now();
    //                         resJson.CACHE_TIME_TXT = moment().format('YYYY-MM-DD HH:mm:ss');
    //                         resJson.CACHE_DEBUG = {
    //                             url,
    //                             method,
    //                             rawBody: reqRawBody,
    //                             body: reqParsedBody
    //                         };
    //                         fs.writeFileSync(
    //                             cacheFileName,
    //                             JSON.stringify(resJson, null, 4),
    //                             {
    //                                 encoding: 'utf8',
    //                                 flag: 'w'
    //                             }
    //                         );

    //                         console.log('   > cached into [' + cacheFileName.yellow + ']');
    //                     }

    //                 }

    //             } catch (error) {
    //                 console.error(` > An error occurred (${error.message}) while caching response data.`.red);
    //             }
    //         }
    //     }
    // }
}
const path = require('path');
const fs = require('fs');
const {
    checkAndCreateCacheFolder,
    url2filename
} = require('./utils');

module.exports = {
    beforeCreate() {
        console.log('[plugin cache] has been invoked');
    },
    onRequest({ request, response, data }, next) {
        // console.log(data);
        // request.pipe(response);
        // response.end(data.rawBody);
        next();
    },
    onRouteMatch(context, next) {
        context;
        next();
    },
    beforeProxy(context, next) {
        context;
        next();
    },
    afterProxy(context) {
        context;
    },
    // beforeProxy({ config, matchedRouter, res }, next) {

    //     const {
    //         cacheDirname,
    //     } = config;

    //     const {
    //         cache,
    //         cacheMaxAge,
    //     } = matchedRouter;

    //     // Try to read cache
    //     // Cache Read Strategy:
    //     //      - `cache` option is `true`
    //     //      - `cacheDigit` field > 0
    //     //      - `cacheDigit` field is `*`
    //     //        `cacheDigit` field is considered to be `*` by default when it's empty
    //     if (cache) {
    //         checkAndCreateCacheFolder(cacheDirname);
    //         const cacheFileName = path
    //             .resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`);
    //         const [cacheUnit = 'second', cacheDigit = '*'] = cacheMaxAge;
    //         try {
    //             if (cacheDigit != 0 && fs.existsSync(cacheFileName)) {

    //                 const fileContent = fs.readFileSync(cacheFileName, 'utf8');
    //                 const jsonContent = JSON.parse(fileContent);

    //                 const cachedTimeStamp = jsonContent['CACHE_TIME'] || Date.now();
    //                 const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);

    //                 // need validate expire time
    //                 if (cacheDigit === '*') {
    //                     res.setHeader('X-Cache-Request', 'true');
    //                     res.setHeader('X-Cache-Expire-Time', 'permanently valid');
    //                     res.setHeader('X-Cache-Rest-Time', 'forever');

    //                     res.writeHead(200, {
    //                         'Content-Type': 'application/json'
    //                     });
    //                     res.end(fileContent);

    //                     logMatchedPath(true);

    //                     // 中断代理请求
    //                     next(true);
    //                 }
    //                 // permanently valid
    //                 else {
    //                     // valid cache file
    //                     if (moment().isBefore(deadlineMoment)) {
    //                         res.setHeader('X-Cache-Request', 'true');
    //                         // calculate rest cache time
    //                         res.setHeader('X-Cache-Expire-Time', moment(deadlineMoment).format('llll'));
    //                         res.setHeader('X-Cache-Rest-Time', moment.duration(moment().diff(deadlineMoment)).humanize());

    //                         res.writeHead(200, {
    //                             'Content-Type': 'application/json'
    //                         });
    //                         res.end(fileContent);

    //                         logMatchedPath(true);

    //                         // 中断代理请求
    //                         next(true);
    //                     }
    //                     else {
    //                         // Do not delete expired cache automatically
    //                         // V0.6.4 2019.4.17
    //                         // fs.unlinkSync(cacheFileName);

    //                         // 继续代理请求
    //                         next(false);
    //                     }
    //                 }

    //             }
    //         } catch (e) {
    //             console.error(e);
    //             next(false);
    //         }
    //     }

    //     function logMatchedPath(cached) {
    //         process.stdout.write(`> 🎯   ${cached ? 'Cached' : 'Hit'}! [${proxyPath}]`.green);
    //         process.stdout.write(`   ${method.toUpperCase()}   ${url}  ${'>>>>'.green}  ${proxyUrl}`.white);
    //         process.stdout.write('\n');
    //     }
    // },
    // afterProxy({ config, matchedRouter, proxyResponse }, next) {
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
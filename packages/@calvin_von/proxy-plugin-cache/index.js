const chalk = require('chalk');
const path = require('path');
const querystring = require('querystring');
const concat = require('concat-stream');
const mime = require('mime-types');
const moment = require('moment');
const fs = require('fs');

const { FOREVER_VALID_FIELD_TEXT, HEADERS_FIELD_TEXT } = require('./mock.command/mock');
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
        const userConfigHeaders = context.config.headers;
        const {
            dirname: cacheDirname,
            maxAge: cacheMaxAge,
        } = this.config;

        const { method, url } = request;

        // Try to read cache
        try {
            checkAndCreateCacheFolder(cacheDirname);
            const cacheSearchName = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}`);
            const [cacheDigit = 0, cacheUnit = 'second'] = cacheMaxAge;

            let targetFilePath,
                hasCacheFile,
                isInJsonFormat;

            if (fs.existsSync(cacheSearchName)) {
                targetFilePath = cacheSearchName;
                hasCacheFile = true;
                isInJsonFormat = path.extname(targetFilePath) === '.json';
            }
            else {
                hasCacheFile = SUPPORTED_EXTENSIONS.some(ext => {
                    if (fs.existsSync(cacheSearchName + ext)) {
                        targetFilePath = cacheSearchName + ext;
                        isInJsonFormat = true;
                        return true;
                    }
                    return false;
                })
            }

            if (hasCacheFile) {

                // in JSON format
                if (isInJsonFormat) {
                    const jsonContent = require(targetFilePath);
                    const fileContent = JSON.stringify(jsonContent, null, 4);

                    const cachedTimeStamp = jsonContent['CACHE_TIME'];
                    const fileHeaders = jsonContent[HEADERS_FIELD_TEXT];

                    // need validate expire time
                    if (jsonContent[FOREVER_VALID_FIELD_TEXT] || !cachedTimeStamp || cacheDigit === '*') {
                        const presetHeaders = {
                            'X-Cache-Response': 'true',
                            'X-Cache-Expire-Time': 'permanently valid',
                            'X-Cache-Rest-Time': 'forever',
                        };

                        const headers = mergeHeaders(userConfigHeaders, fileHeaders, presetHeaders)
                        setHeaders(response, headers);

                        response.writeHead(200, {
                            'Content-Type': 'application/json'
                        });


                        collectRealRequestDataAndRespond();
                        context.cache = {
                            data: jsonContent,
                            rawData: fileContent,
                            type: 'application/json',
                            size: fileContent.length
                        };

                        logMatchedPath(targetFilePath);

                        // 中断代理请求
                        next('Hit cache');
                    }
                    // permanently valid
                    else {
                        const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);
                        // valid cache file
                        if (moment().isBefore(deadlineMoment)) {
                            const presetHeaders = {
                                'X-Cache-Response': 'true',
                                'X-Cache-Expire-Time': moment(deadlineMoment).format('llll'),
                                'X-Cache-Rest-Time': moment.duration(moment().diff(deadlineMoment)).humanize(),
                            };
                            const headers = mergeHeaders(userConfigHeaders, fileHeaders, presetHeaders)
                            setHeaders(response, headers);

                            collectRealRequestDataAndRespond();
                            context.cache = {
                                data: jsonContent,
                                rawData: fileContent,
                                type: 'application/json',
                                size: fileContent.length
                            };
                            logMatchedPath(targetFilePath);

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

                    cleanRequireCache(targetFilePath);

                    function collectRealRequestDataAndRespond() {
                        request.pipe(concat(buffer => {
                            const contentType = request.headers['content-type'];
                            const data = {
                                rawBody: buffer.toString(),
                                body: '',
                                query: querystring.parse(request.URL.query),
                                type: contentType
                            };

                            if (data.rawBody && contentType) {
                                try {
                                    if (/application\/x-www-form-urlencoded/.test(contentType)) {
                                        data.body = querystring.parse(data.rawBody);
                                    } else if (/application\/json/.test(contentType)) {
                                        data.body = JSON.parse(data.rawBody);
                                    } else if (/multipart\/form-data/.test(contentType)) {
                                        data.body = data.rawBody;
                                    }
                                } catch (error) {
                                    info && console.log(' > Error: can\'t parse requset body. ' + error.message);
                                }
                            }

                            jsonContent.REAL_REQUEST_DATA = data;
                            const fileContent = JSON.stringify(jsonContent, null, 4);
                            response.end(fileContent);
                        }));
                    }
                }
                // in Orignal format
                else {
                    // only when cache max age is `*` valid
                    if (cacheDigit !== '*') {
                        return next();
                    }
                    const presetHeaders = {
                        'Content-Type': mime.contentType(targetFilePath),
                        'X-Cache-Response': 'true'
                    };
                    const headers = mergeHeaders(userConfigHeaders, presetHeaders);
                    setHeaders(response, headers);
                    const source = fs.createReadStream(targetFilePath);
                    source.pipe(response);
                    logMatchedPath(targetFilePath);
                    next('Hit cache')
                }

            }
            else {
                next();
            }

        } catch (error) {
            console.error(error);
            next();
        }

        function logMatchedPath(targetFilePath) {
            const message = chalk.green(`> Hit! [${context.matched.path}]`)
                + `   ${method.toUpperCase()}   ${url}`
                + chalk.green('  >>>>  ')
                + chalk.yellow(targetFilePath);
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
        const { response } = context.proxy;

        const route = context.matched.route;
        const cacheFilters = filters.filter(filter => (filter.applyRoute === '*' || filter.applyRoute === route.path));

        // cache the response data
        try {
            const cacheFileWithNoExt = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}`);

            let contentTypeReg;
            if (cacheContentType.length) {
                contentTypeReg = new RegExp(`${
                    cacheContentType
                        .map(it => it
                            // remove blanks
                            .replace(/^\s*/, '')
                            .replace(/\s*$/, '')
                            // replace */ --> \S+/
                            .replace(/\*\//, '\\S+/')
                            // replace /* --> /\S+
                            .replace(/\/\*/, '/\\S+'))
                        .join('|')
                    }`);
            }
            const responseContentType = response.headers['content-type'] || response.headers['Content-Type'];
            if (contentTypeReg.test(responseContentType)) {

                if (isMeetFiltering()) {
                    let cacheFileName;
                    if (/json/.test(responseContentType)) {
                        cacheFileName = cacheFileInJSON();
                    }
                    else {
                        cacheFileName = cacheFileInOrignal();
                    }

                    console.log(chalk.gray('> Cached into [') + chalk.grey(cacheFileName) + chalk.grey(']'));
                }


                /**
                 * Determine whether meet the filter conditions
                 * @returns {Boolean}
                 */
                function isMeetFiltering() {
                    if (!cacheFilters.length) return true;

                    let isMeetList = [];
                    for (const filter of cacheFilters) {
                        let isMeet;
                        if (filter.custom) {
                            isMeet = filter.custom.call(null, context);
                        }
                        else {
                            const filterContext = {
                                query: context.data.request.query,
                                body: context.data.request.body,
                                data: context.data.response.data,
                                headers: context.proxy[filter.when].headers
                            };
                            isMeet = filterContext[filter.where][filter.field] == filter.value;
                        }

                        isMeetList.push(isMeet);
                        if (!isMeet) {
                            break;
                        }
                    }

                    return isMeetList.every(Boolean);
                }


                /**
                 * Cache file in JSON format
                 */
                function cacheFileInJSON() {
                    const resJson = Object.assign({}, context.data.response.data);

                    resJson.CACHE_INFO = 'Cached from Dalao Proxy';
                    resJson.CACHE_TIME = Date.now();
                    resJson.CACHE_TIME_TXT = moment().format('YYYY-MM-DD HH:mm:ss');
                    resJson.CACHE_REQUEST_DATA = {
                        url,
                        method,
                        ...context.data.request
                    };
                    delete resJson.CACHE_REQUEST_DATA.rawBuffer;
                    resJson[FOREVER_VALID_FIELD_TEXT] = false;
                    resJson[HEADERS_FIELD_TEXT] = context.proxy.response.headers;

                    const cacheFileName = /\.json$/.test(cacheFileWithNoExt) ? cacheFileWithNoExt : (cacheFileWithNoExt + '.json');
                    fs.writeFileSync(
                        cacheFileName,
                        JSON.stringify(resJson, null, 4),
                        {
                            encoding: 'utf8',
                            flag: 'w'
                        }
                    );

                    return cacheFileName;
                }

                /**
                 * Cache file in original format
                 */
                function cacheFileInOrignal() {
                    fs.writeFileSync(
                        cacheFileWithNoExt,
                        context.data.response.rawBuffer,
                        {
                            encoding: 'buffer',
                            flag: 'w'
                        }
                    );
                    return cacheFileWithNoExt;
                }

            }

        } catch (error) {
            console.error(error);
            console.error(chalk.red(` > An error occurred (${error.message}) while caching response data.`));
        }
    },
}



function mergeHeaders(userConfigHeaders, ...headers) {
    const headerMergeList = [];
    if (typeof (userConfigHeaders.response) === 'object') {
        headerMergeList.push(userConfigHeaders.response);
    }
    else if (typeof (userConfigHeaders) === 'object') {
        headerMergeList.push(userConfigHeaders);
    }
    headerMergeList.push(...headers);
    return Object.assign({}, ...headerMergeList, { request: null, response: null });
}

function setHeaders(target, headers) {
    for (const header in headers) {
        const value = headers[header];
        if (value) {
            target.setHeader(header, value);
        }
        else {
            target.removeHeader(header);
        }
    }
}
const path = require('path');
const querystring = require('querystring');
const chalk = require('chalk');
const _ = require('lodash');
const concat = require('concat-stream');
const mime = require('mime-types');
const moment = require('moment');
const fs = require('fs');

const {
    MOCK_FIELD_TEXT,
    HEADERS_FIELD_TEXT,
    STATUS_FIELD_TEXT
} = require('./mock.command/mock');
const {
    checkAndCreateCacheFolder,
    url2filename
} = require('./utils');

function cleanRequireCache(fileName) {
    const id = fileName;
    const cache = require.cache;
    const mod = cache[id];

    const cleanRelativeModuleCache = (mod) => {
        mod.children.forEach(it => {
            // clean modules not from npm
            if (!/node_modules/.test(it.id)) {
                delete require.cache[it.id];
                cleanRelativeModuleCache(it);
            }
        });
    };

    if (mod) {
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
        const logger = context.config.logger;
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
                isInJsonFormat,
                isInJsFormat;

            // search static files
            if (fs.existsSync(cacheSearchName)) {
                targetFilePath = cacheSearchName;
                hasCacheFile = true;
                isInJsonFormat = path.extname(targetFilePath) === '.json';
            }
            // content is in json format
            else {
                hasCacheFile = SUPPORTED_EXTENSIONS.some(ext => {
                    if (fs.existsSync(cacheSearchName + ext)) {
                        targetFilePath = cacheSearchName + ext;
                        isInJsonFormat = ext === '.json';
                        isInJsFormat = ext === '.js';
                        return true;
                    }
                    return false;
                })
            }

            if (hasCacheFile) {

                // return data in JSON format
                // file maybe in json or js format
                if (isInJsonFormat) {
                    const jsonContent = require(targetFilePath);
                    const fileContent = JSON.stringify(jsonContent, null, 4);

                    handleRespond(jsonContent, fileContent);
                }

                // judge whether js file exports functions or object
                else if (isInJsFormat) {
                    const exportsContent = require(targetFilePath);
                    if (exportsContent) {
                        if (Object.prototype.toString.call(exportsContent) === '[object Object]') {
                            const jsonContent = exportsContent;
                            const fileContent = JSON.stringify(jsonContent, null, 4);

                            handleRespond(jsonContent, fileContent);
                        }
                        else if (typeof (exportsContent) === 'function') {
                            collectRealRequestData(() => {
                                const returnValue = exportsContent.call(null, context);
                                if (returnValue instanceof Promise) {
                                    returnValue
                                        .then(value => {
                                            let jsonContent;
                                            if (Object.prototype.toString.call(value) === '[object Object]') {
                                                jsonContent = value;
                                            }
                                            else {
                                                jsonContent = {};
                                            }
                                            const fileContent = JSON.stringify(jsonContent, null, 4);
                                            handleRespond(jsonContent, fileContent, true);
                                        })
                                        .catch(err => {
                                            console.error(chalk.red('[Plugin cache] Found error in your mock file: ' + targetFilePath));
                                            console.error(error.message);
                                        })
                                }
                                else {
                                    const jsonContent = returnValue;
                                    const fileContent = JSON.stringify(jsonContent, null, 4);

                                    handleRespond(jsonContent, fileContent);
                                }
                            });
                        }
                        else {
                            console.warn(chalk.red('[Plugin cache] You should return an object or a promise in your mock file: ' + targetFilePath));
                            next();
                        }
                    }
                    else {
                        next();
                    }
                    cleanRequireCache(targetFilePath);
                }
                // in Orignal format
                else {
                    // only when cache max age is `*` valid
                    if (cacheDigit !== '*') {
                        return next();
                    }

                    const contentType = mime.lookup(targetFilePath);
                    const presetHeaders = {
                        'Content-Type': contentType,
                        'X-Cache-Response': 'true',
                        'X-Cache-File': encodeURIComponent(targetFilePath)
                    };
                    const headers = mergeHeaders(userConfigHeaders, presetHeaders);
                    setHeaders(response, headers);
                    const fileContent = fs.readFileSync(targetFilePath);
                    response.write(fileContent);
                    response.end();
                    logMatchedPath(targetFilePath);

                    context.cache = {
                        data: null,
                        rawData: fileContent.toString(),
                        type: contentType,
                        size: fileContent.length,
                        file: targetFilePath,
                        expireTime: 'permanently valid',
                        restTime: 'forever'
                    };
                    next('Hit cache');
                }


                /**
                 * Universal handle responding
                 * @param {Object} jsonContent content in JSON object format
                 * @param {String} fileContent content in string format
                 * @param {Boolean} [noCollectRequestData] if skip collect request data
                 */
                function handleRespond(jsonContent, fileContent, noCollectRequestData) {
                    const cachedTimeStamp = jsonContent['CACHE_TIME'];
                    const fileHeaders = jsonContent[HEADERS_FIELD_TEXT];
                    const respondStatus = jsonContent[STATUS_FIELD_TEXT] || 200;

                    // permanently valid
                    if (jsonContent[MOCK_FIELD_TEXT] || !cachedTimeStamp || cacheDigit === '*') {
                        const presetHeaders = {
                            'X-Cache-Response': 'true',
                            'X-Cache-Expire-Time': 'permanently valid',
                            'X-Cache-Rest-Time': 'forever',
                            'X-Cache-File': encodeURIComponent(targetFilePath)
                        };

                        const headers = mergeHeaders(userConfigHeaders, fileHeaders, presetHeaders)
                        setHeaders(response, headers);

                        response.writeHead(respondStatus, {
                            'Content-Type': 'application/json'
                        });

                        if (noCollectRequestData) {
                            jsonContent.REAL_REQUEST_DATA = context.data.request;
                            const fileContent = JSON.stringify(jsonContent, null, 4);
                            response.end(fileContent);
                        }
                        else {
                            collectRealRequestDataAndRespond();
                        }
                        context.cache = {
                            data: jsonContent,
                            rawData: fileContent,
                            type: 'application/json',
                            size: fileContent.length,
                            file: targetFilePath,
                            expireTime: 'permanently valid',
                            restTime: 'forever',
                        };

                        logMatchedPath(targetFilePath);

                        // 中断代理请求
                        next('Hit cache');
                    }
                    // need validate expire time
                    else {
                        const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);
                        // valid cache file
                        if (moment().isBefore(deadlineMoment)) {
                            const expireTime = moment(deadlineMoment).format('llll');
                            const restTime = moment.duration(moment().diff(deadlineMoment)).humanize();
                            const presetHeaders = {
                                'X-Cache-Response': 'true',
                                'X-Cache-Expire-Time': expireTime,
                                'X-Cache-Rest-Time': restTime,
                            };
                            const headers = mergeHeaders(userConfigHeaders, fileHeaders, presetHeaders)
                            setHeaders(response, headers);

                            if (noCollectRequestData) {
                                jsonContent.REAL_REQUEST_DATA = context.data.request;
                                const fileContent = JSON.stringify(jsonContent, null, 4);
                                response.end(fileContent);
                            }
                            else {
                                collectRealRequestDataAndRespond();
                            }
                            context.cache = {
                                data: jsonContent,
                                rawData: fileContent,
                                type: 'application/json',
                                size: fileContent.length,
                                file: targetFilePath,
                                expireTime,
                                restTime
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
                        collectRealRequestData(data => {
                            jsonContent.REAL_REQUEST_DATA = data;
                            const fileContent = JSON.stringify(jsonContent, null, 4);
                            response.end(fileContent);
                        });
                    }
                }

            }
            else {
                next();
            }

        } catch (error) {
            console.error(chalk.red(`[plugin cache] Error loading cache/mock file: ${error.message}`));
            console.error(chalk.red(`[plugin cache] Error occurred when method=${method} url=${url}`));
            next();
        }


        function collectRealRequestData(cb) {
            request.pipe(concat(buffer => {
                const contentType = request.headers['content-type'];
                const data = {
                    rawBody: buffer.toString(),
                    body: '',
                    query: querystring.parse(request.URL.query),
                    type: contentType
                };

                context.data = {
                    request: data
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
                        console.log(' > Error: can\'t parse requset body. ' + error.message);
                    }
                }

                cb(data);
            }));
        }

        function logMatchedPath(targetFilePath) {
            if (!logger) return;

            const message = chalk.yellow(`> Hit! [${context.matched.path}]`)
                + `   ${method.toUpperCase()}   ${url}`
                + chalk.green('  >>>>  ')
                + chalk.yellow(targetFilePath);
            console.log(message);
        }
    },

    afterProxy(context) {
        const logger = context.config.logger;
        const {
            dirname: cacheDirname,
            contentType: cacheContentType,
            filters,
        } = this.config;
        const { method, url } = context.request;
        const { response, error } = context.proxy;

        if (error) return;

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

                    logger && console.log(chalk.gray('> Cached into [') + chalk.grey(cacheFileName) + chalk.grey(']'));
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
                                header: {},
                                status: response.statusCode
                            };
                            const headers = context.proxy[filter.when].headers;
                            Object.keys(headers).forEach(header => {
                                const _header = formatHeader(header);
                                filterContext.header[_header] = headers[header];
                            });
                            if (filter.where === 'header') {
                                filter.field = formatHeader(filter.field);
                            }

                            if (filter.where === 'status') {
                                isMeet = filterContext.status == filter.value;
                            }
                            else {
                                isMeet = filterContext[filter.where][filter.field] == filter.value;
                            }
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
                    resJson[MOCK_FIELD_TEXT] = false;
                    resJson[HEADERS_FIELD_TEXT] = context.proxy.response.headers;
                    resJson[STATUS_FIELD_TEXT] = context.proxy.response.statusCode;

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
                        context.data.response.rawBuffer
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
        headerMergeList.push(formatHeaders(userConfigHeaders.response));
    }
    else if (typeof (userConfigHeaders) === 'object') {
        headerMergeList.push(formatHeaders(userConfigHeaders));
    }
    headerMergeList.push(...headers.map(formatHeaders));
    return Object.assign({}, ...headerMergeList, { request: null, response: null });
}

function setHeaders(target, headers) {
    for (const header in headers) {
        const _header = formatHeader(header);
        const value = headers[header];
        if (value) {
            target.setHeader(_header, value);
        }
        else {
            target.removeHeader(_header);
        }
    }
}

function formatHeader(string) {
    // return string.split('-').map(item => _.upperFirst(item.toLowerCase())).join('-');
    return string.toLowerCase();
}

function formatHeaders(headers) {
    const _headers = {};
    for (const header in headers) {
        const value = headers[header];
        _headers[formatHeader(header)] = value;
    }
    return _headers;
}
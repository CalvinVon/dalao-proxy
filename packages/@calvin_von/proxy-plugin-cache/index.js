const path = require('path');
const querystring = require('querystring');
const chalk = require('chalk');
const concat = require('concat-stream');
const mime = require('mime-types');
const moment = require('moment');
const fs = require('fs');
const { setAsOriginalUser, restoreProcessUser } = require('@dalao-proxy/utils');

const SwitcherUIServer = require('./switcher-ui/server');

const {
    MOCK_FIELD_TEXT,
    HEADERS_FIELD_TEXT,
    STATUS_FIELD_TEXT
} = require('./mock.command/mock');

const {
    checkAndCreateFolder,
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


let BodyParser, Utils;

module.exports = {
    beforeCreate() {
        BodyParser = this.context.exports.BodyParser;
        Utils = this.context.exports.Utils;
    },
    onRequest(context, next) {
        SwitcherUIServer.handle.call(this, context, next);
    },

    beforeProxy(context, next) {
        const SUPPORTED_EXTENSIONS = ['.js', '.json'];
        const { response, request } = context;
        const { method, url } = request;
        const logger = context.config.logger;
        const enableCORS = this.config.mock.cors;

        const userConfigHeaders = context.config.headers;
        const {
            dirname: cacheDirname,
            maxAge: cacheMaxAge,
        } = this.config.cache;
        const {
            dirname: mockDirname,
            enable: mockEnable
        } = this.config.mock;

        // Try to read cache
        try {
            checkAndCreateFolder(mockDirname);
            checkAndCreateFolder(cacheDirname);

            const mockSearchName = path.resolve(process.cwd(), `./${mockDirname}/${url2filename(method, url)}`);
            const cacheSearchName = path.resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}`);

            if (mockEnable) {
                tryLoadLocalFile(mockSearchName, false, () => {
                    tryLoadLocalFile(cacheSearchName, true, () => {
                        // enable CORS, respond OPTIONS request
                        if (enableCORS && method === 'OPTIONS') {
                            const headers = mergeHeaders(userConfigHeaders, {
                                'x-mock-cors': true
                            });
                            setHeaders(response, headers);
                            response.writeHead(200);
                            response.end();
                            context.cache = {
                                data: null,
                                rawData: '',
                                type: 'text/plain',
                                size: 0
                            };

                            logMatchedPath('[MOCK CORS]');
                            next('Hit mock CORS');
                        }
                        else {
                            next();
                        }
                    });
                });
            }
            else {
                tryLoadLocalFile(cacheSearchName, true, next);
            }

        } catch (error) {
            console.error(chalk.red(`[plugin cache] Error loading cache/mock file: ${error.message}`));
            console.error(chalk.red(`[plugin cache] Error occurred when method=${method} url=${url}`));
            next();
        }


        /**
         * Try to load file from local files
         * @param {string} searchFilePath file pathlike
         * @param {boolean} searchCacheFile is searching cache files or mocked files
         * @param {Function} missCallback called when not found
         */
        function tryLoadLocalFile(searchFilePath, searchCacheFile, missCallback) {
            let targetFilePath,
                hasFoundFile,
                isInJsonFormat,
                isInJsFormat;

            // search static files
            if (searchCacheFile && fs.existsSync(searchFilePath)) {
                targetFilePath = searchFilePath;
                hasFoundFile = true;
                isInJsonFormat = path.extname(targetFilePath) === '.json';
            }
            // content is in json format
            else {
                hasFoundFile = SUPPORTED_EXTENSIONS.some(ext => {
                    if (fs.existsSync(searchFilePath + ext)) {
                        targetFilePath = searchFilePath + ext;
                        isInJsonFormat = ext === '.json';
                        isInJsFormat = ext === '.js';
                        return true;
                    }
                    return false;
                })
            }

            if (hasFoundFile) {
                const [cacheDigit = 0, cacheUnit = 'second'] = cacheMaxAge;

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
                        // handle plain object
                        if (Utils.getType(exportsContent, 'Object')) {
                            const jsonContent = exportsContent;
                            const fileContent = JSON.stringify(jsonContent, null, 4);

                            handleRespond(jsonContent, fileContent);
                        }
                        // handle export Promise
                        else if (Utils.getType(exportsContent, 'Promise')) {
                            exportsContent
                                .then(value => {
                                    let jsonContent;
                                    if (Object.prototype.toString.call(value) === '[object Object]') {
                                        jsonContent = value;
                                    }
                                    else {
                                        jsonContent = {};
                                    }
                                    const fileContent = JSON.stringify(jsonContent, null, 4);
                                    handleRespond(jsonContent, fileContent);
                                })
                                .catch(error => {
                                    console.error(chalk.red('[Plugin cache] Found error in your mock file: ' + targetFilePath));
                                    console.error(error.message);
                                })
                        }
                        else if (Utils.getType(exportsContent, 'Function')) {
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
                                        .catch(error => {
                                            console.error(chalk.red('[Plugin cache] Found error in your mock file: ' + targetFilePath));
                                            console.error(error.message);
                                        })
                                }
                                else {
                                    const jsonContent = returnValue;
                                    const fileContent = JSON.stringify(jsonContent, null, 4);

                                    handleRespond(jsonContent, fileContent, true);
                                }
                            });
                        }
                        else {
                            console.warn(chalk.red('[Plugin cache] You should return an object or a promise in your mock file: ' + targetFilePath));
                            missCallback();
                        }
                    }
                    else {
                        missCallback();
                    }
                    cleanRequireCache(targetFilePath);
                }
                // in Orignal format
                else {
                    // only when cache max age is `*` valid
                    if (cacheDigit !== '*') {
                        return missCallback();
                    }

                    const contentType = mime.lookup(targetFilePath);
                    const presetHeaders = {
                        'Content-Type': contentType,
                        'X-Cache-Response': 'true',
                        'X-Cache-File': encodeURIComponent(targetFilePath),
                        'Content-Length': null,
                        'Content-Encoding': null
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
                 * @param {object} jsonContent content in JSON object format
                 * @param {string} fileContent content in string format
                 * @param {boolean} [noCollectRequestData] if skip collect request data
                 */
                function handleRespond(jsonContent, fileContent, noCollectRequestData) {
                    const cachedTimeStamp = jsonContent['CACHE_TIME'];
                    const fileHeaders = jsonContent[HEADERS_FIELD_TEXT];
                    const respondStatus = jsonContent[STATUS_FIELD_TEXT] || 200;

                    let condition;
                    if (searchCacheFile) {
                        condition = jsonContent[MOCK_FIELD_TEXT] || !cachedTimeStamp || cacheDigit === '*';
                    }
                    else {
                        condition = jsonContent[MOCK_FIELD_TEXT];
                    }

                    // permanently valid
                    if (condition) {
                        const presetHeaders = {
                            'X-Cache-Response': 'true',
                            'X-Cache-Expire-Time': 'permanently valid',
                            'X-Cache-Rest-Time': 'forever',
                            'X-Cache-File': encodeURIComponent(targetFilePath),
                            'Content-Length': null,
                            'Content-Encoding': null
                        };

                        const headers = mergeHeaders(userConfigHeaders, fileHeaders, presetHeaders);
                        setHeaders(response, headers);

                        response.writeHead(respondStatus, {
                            'Content-Type': 'application/json'
                        });

                        if (noCollectRequestData) {
                            jsonContent.REAL_REQUEST_DATA = context.data.request;
                            const fileContent = JSON.stringify(jsonContent, null, 4);
                            response.write(fileContent);
                            response.end();
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
                        if (!searchCacheFile) {
                            return missCallback();
                        }
                        const deadlineMoment = moment(cachedTimeStamp).add(cacheDigit, cacheUnit);
                        // valid cache file
                        if (moment().isBefore(deadlineMoment)) {
                            const expireTime = moment(deadlineMoment).format('llll');
                            const restTime = moment.duration(moment().diff(deadlineMoment)).humanize();
                            const presetHeaders = {
                                'X-Cache-Response': 'true',
                                'X-Cache-Expire-Time': expireTime,
                                'X-Cache-Rest-Time': restTime,
                                'Content-Length': null,
                                'Content-Encoding': null
                            };
                            const headers = mergeHeaders(userConfigHeaders, fileHeaders, presetHeaders);
                            setHeaders(response, headers);

                            if (noCollectRequestData) {
                                jsonContent.REAL_REQUEST_DATA = context.data.request;
                                const fileContent = JSON.stringify(jsonContent, null, 4);
                                response.write(fileContent);
                                response.end();
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
                            // fs.unlinkSync(searchFilePath);

                            // continue
                            missCallback();
                        }
                    }

                    cleanRequireCache(targetFilePath);


                    function collectRealRequestDataAndRespond() {
                        collectRealRequestData(data => {
                            jsonContent.REAL_REQUEST_DATA = data;
                            const fileContent = JSON.stringify(jsonContent, null, 4);
                            response.write(fileContent);
                            response.end();
                        });
                    }
                }

            }
            else {
                missCallback();
            }
        }

        function mergeHeaders(userConfigHeaders, ...headers) {
            const origin = formatHeaders(request.headers)['origin'];
            const headerMergeList = [
                request.headers,
                {
                    'access-control-allow-origin': origin ? Utils.addHttpProtocol(origin) : '*',
                    'access-control-allow-methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                    'access-control-allow-credentials': true,
                    'access-control-allow-headers': 'Content-Type, Authorization, Token',
                }
            ];
            if (typeof (userConfigHeaders.response) === 'object') {
                headerMergeList.push(formatHeaders(userConfigHeaders.response));
            }
            else if (typeof (userConfigHeaders) === 'object') {
                headerMergeList.push(formatHeaders(userConfigHeaders));
            }
            headerMergeList.push(...headers.map(formatHeaders));
            return Object.assign({}, ...headerMergeList, { request: null, response: null });
        }


        function collectRealRequestData(cb) {
            request.pipe(concat(buffer => {
                const contentType = request.headers['content-type'];
                const data = {
                    body: null,
                    query: querystring.parse(request.URL.query),
                    type: contentType
                };
                data.body = BodyParser.parse(contentType, buffer, {
                    noRawFileData: true
                });

                if (!/multipart\/form-data/.test(contentType)) {
                    data.rawBody = buffer.toString();
                }

                context.data = {
                    request: data
                };
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
        setAsOriginalUser();
        const logger = context.config.logger;
        const {
            dirname: cacheDirname,
            contentType: cacheContentType,
            filters,
        } = this.config.cache;
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

        restoreProcessUser();
    },
}



function setHeaders(target, headers) {
    for (const header in headers) {
        const _header = formatHeader(header);
        const value = headers[header];
        if (value === null || value === undefined) {
            target.removeHeader(_header);
        }
        else {
            if (Utils.getType(value, ['String', 'Number', 'Boolean', 'Array'])) {
                target.setHeader(_header, value);
            }
        }
    }
}

function formatHeader(string) {
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
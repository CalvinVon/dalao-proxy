const chalk = require('chalk');
const _ = require('lodash');

const os = require('os');
const path = require('path');
const URL = require('url').URL;
const fs = require('fs');
const fsPromises = require('fs/promises');

const HTTP_PROTOCOL_REG = new RegExp(/^(https?:\/\/)/);

function isDebugMode() {
    return process.env.DALAO_ENV === 'DEV';
}

function custom_assign(objValue, srcValue) {
    return srcValue === undefined ? objValue : srcValue;
}

// make url complete with http/https
function addHttpProtocol(urlFragment) {
    if (!HTTP_PROTOCOL_REG.test(urlFragment)) {
        return 'http://' + urlFragment;
    }
    else {
        return urlFragment;
    }
}


function splitTargetAndPath(url) {
    const { origin: target } = new URL(addHttpProtocol(url));
    return {
        target,
        path: url.replace(target, '')
    };
}


/**
 * url path deep compare
 * @param {Number} order
 * @return {Function} compare function
 */
function pathCompareFactory(order) {
    return function (prev, curr) {
        const prev_dep = (prev.match(/(\/)/g) || []).length;
        const curr_dep = (curr.match(/(\/)/g) || []).length;

        if (prev_dep === curr_dep) {
            return (prev - curr) * order;
        }
        else {
            return (prev_dep - curr_dep) * order;
        }
    }
}


function rewriteString(string, map) {
    let result = string;
    if (!_.isEmpty(map)) {
        Object.keys(map).forEach(key => {
            const rewriteReg = new RegExp(key);
            const replaceStr = map[key];

            result = result
                .replace(rewriteReg, (...matched) => {
                    return replaceStr.replace(/\$(\d+)/g, (_, index) => {
                        return matched[index];
                    });
                })
        });
    }
    return result;
}

/**
* Proxy path transformer
* @param {String} url proxy target url
* @param {Object} pathRewriteMap path rewrite rule map
*/
function transformPath(url, hostRewriteMap, pathRewriteMap) {
    try {
        const { target: targetTarget, path: targetPath } = splitTargetAndPath(url);

        const target = rewriteString(targetTarget, hostRewriteMap);
        const urlpath = path.normalize(rewriteString(targetPath, pathRewriteMap));
        return target + urlpath;

    } catch (error) {
        throw new Error('Can\'t rewrite proxy path. ' + error.message);
    }
}

/**
 * Route matcher
 * @param {string} url 
 * @param {Record<string, any>} proxyTable 
 */
function locationMatch(url, proxyTable) {
    const proxyPaths = Object.keys(proxyTable);
    let mostAccurateMatch;
    let matched;
    let matchingLength = url.length;
    for (let index = 0; index < proxyPaths.length; index++) {
        const proxyPath = proxyPaths[index];
        const modeReg = /^~(\*?)\s/;
        let matchReg;
        // If the matched path starts with '~'
        // then proceed with RegExp matching
        let modeResult;
        if (modeResult = proxyPath.match(modeReg)) {
            const ignoreCase = modeResult[1] === '*';
            matchReg = new RegExp(`${proxyPath.replace(modeReg, '')}(.*)`, ignoreCase ? 'i' : '');
        }
        else {
            matchReg = new RegExp(`^${proxyPath}(.*)`);
        }
        let matchingResult;
        if (matchingResult = url.match(matchReg)) {
            const currentLenth = matchingResult[1].length;
            if (currentLenth < matchingLength) {
                matchingLength = currentLenth;
                mostAccurateMatch = proxyPaths[index];
                matched = matchingResult;
            }
        }
    }

    return {
        matched: mostAccurateMatch,
        matchResult: matched
    }
}

function locationTransform(matchedRoute, matchedResult) {
    const {
        path: overwritePath,
        target: overwriteTarget,
        pathRewrite: overwritePathRewrite,
        hostRewrite: overwriteHostRewrite,
    } = matchedRoute;

    const { target: overwriteHost_target, path: overwriteHost_path } = splitTargetAndPath(overwriteTarget);
    const proxyedPath = overwriteHost_target + joinUrl(overwriteHost_path, overwritePath, matchedResult[0]);
    const proxyUrl = transformPath(addHttpProtocol(proxyedPath), overwriteHostRewrite, overwritePathRewrite);
    return proxyUrl;
}

// NOTE: do not pass something like http://...
function joinUrl(...urls) {
    return path.join(...urls).replace(/\\/g, '/');
}

function fixJson(value) {
    return value
        .replace(/,\s*,/g, '')
        .replace(/":,/g, '":')
        .replace(/([{\[])\s*,/g, function (matched) {
            return matched[1];
        })
        .replace(/,\s*([}\]])/g, function (matched) {
            return matched[1];
        })
}


function getIPv4Address() {
    const interfaces = os.networkInterfaces();
    let ipv4;
    for (let i in interfaces) {
        const nets = interfaces[i];
        const [net] = nets.filter(net => {
            if (!net.internal && net.family === 'IPv4') {
                return true;
            }
            return false;
        });

        if (net) {
            ipv4 = net.address;
            break;
        }
    }
    return ipv4;
}

function getType(value, type) {
    if (type) {
        if (Array.isArray(type)) {
            return type.some(tp => Object.prototype.toString.call(value) === `[object ${tp}]`);
        }
        else {
            return Object.prototype.toString.call(value) === `[object ${type}]`;
        }
    }
    return Object.prototype.toString.call(value);
}


/**
 * defineProxy
 * @param {any} target proxy target
 * @param {Object} [opt]
 * @param {Function} [opt.setter] trigger when set value
 * @param {Function} [opt.getter] trigger when get value
 */
function defineProxy(target, opt) {
    const { setter, getter } = opt || {};
    return new Proxy(target, {
        set: function (t, p, v) {
            if (typeof setter === 'function' && t[p] !== v) {
                setter.call(this, t, p, v);
            }
            return Reflect.set(t, p, v);
        },
        get: function (t, p) {
            if (typeof getter === 'function') {
                getter.call(this, t, p, v);
            }
            return Reflect.get(t, p);
        }
    })
}


function printWelcome(version) {
    let str = '';
    str += ' ___    __    _      __    ___       ___   ___   ___   _     _    \n';
    str += '| | \\  / /\\  | |    / /\\  / / \\     | |_) | |_) / / \\ \\ \\_/ \\ \\_/ \n';
    str += '|_|_/ /_/--\\ |_|__ /_/--\\ \\_\\_/     |_|   |_| \\ \\_\\_/ /_/ \\  |_|  \n\n';
    str += '                                             ';

    console.log(chalk.yellow(str), chalk.yellow('Dalao Proxy'), chalk.green('v' + version));
    console.log('                                            powered by CalvinVon');
    console.log(chalk.grey('                        https://github.com/CalvinVon/dalao-proxy'));
    console.log('\n');
};


/**
 * format headers to upper case word
 * @param {Object} headers
 */
function formatHeaders(headers) {
    const formattedHeaders = {};
    Object.keys(headers).forEach(key => {
        const header = key.toLowerCase();
        const value = headers[key];
        if (value) {
            formattedHeaders[header] = value;
        }
    });
    return formattedHeaders;
}


/**
 * @param {object} headerSetting 
 * @param {'request'|'response'} type 
 */
function parseHeaders(headerSetting, type) {
    let headers = {};
    if (typeof (headerSetting[type]) === 'object') {
        headers = headerSetting[type];
    }
    else if (typeof (headerSetting) === 'object') {
        headers = headerSetting;
    }
    return headers;
}


async function ensureFolder(path) {
    try {
        await fsPromises.access(path);
    } catch (error) {
        fsPromises.mkdir(path, { recursive: true });
    }
}

module.exports = {
    printWelcome,
    isDebugMode,
    
    HTTP_PROTOCOL_REG,
    custom_assign,

    joinUrl,
    addHttpProtocol,
    splitTargetAndPath,
    pathCompareFactory,
    rewriteString,
    transformPath,
    locationMatch,
    locationTransform,

    fixJson,
    getIPv4Address,
    getType,
    defineProxy,

    formatHeaders,
    parseHeaders,

    ensureFolder,
}
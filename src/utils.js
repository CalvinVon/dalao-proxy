const os = require('os');
const _ = require('lodash');
const path = require('path');

const HTTP_PREFIX_REG = new RegExp(/^(https?:\/\/)/);
const STATIC_FILE_REG = new RegExp(/(^\/$|\.[^\.]+$)/);

function isDebugMode() {
    return process.env.DALAO_ENV === 'DEBUG';
}

function custom_assign(objValue, srcValue) {
    return srcValue === undefined ? objValue : srcValue;
}

// make url complete with http/https
function addHttpProtocol(urlFragment) {
    if (!HTTP_PREFIX_REG.test(urlFragment)) {
        return 'http://' + urlFragment;
    }
    else {
        return urlFragment;
    }
}


function splitTargetAndPath(url) {
    const [_, target = '', path = ''] = url.match(/^((?:https?:\/\/)?(?:(?:[\w-_]+\.)+[\w-_]+|localhost)(?::\d+)?)?(.+)?/i) || [];
    return {
        target,
        path
    }
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

/**
* Proxy path transformer
* @param {String} url origin url
* @param {String} target proxy target url
* @param {Object} pathRewriteMap path rewrite rule map
*/
function transformPath(target, pathRewriteMap) {
    try {
        const { target: targetTarget, path: targetPath } = splitTargetAndPath(target);
        if (!_.isEmpty(pathRewriteMap)) {
            let result = targetPath;

            Object.keys(pathRewriteMap).forEach(path => {
                const rewriteReg = new RegExp(path);
                const replaceStr = pathRewriteMap[path];
                // use string match replace first, then regexp match
                result = result
                    .replace(path, replaceStr)
                    .replace(rewriteReg, replaceStr)
            });

            return targetTarget + result.replace(/\/\//g, '/');
        }
        else {
            return target;
        }

    } catch (error) {
        throw new Error('Can\'t rewrite proxy path. ' + error.message);
    }
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

// is static file uri value
function isStaticResouce(uri = '') {
    return STATIC_FILE_REG.test(
        uri
            .replace(/\?.+/, '')
            .replace(/#.+/, '')
    )

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
    return ipv4 || 'unavailable';
}

function getType(value, type) {
    if (type) {
        return Object.prototype.toString.call(value) === `[object ${type}]`;
    }
    return Object.prototype.toString.call(value);
}


module.exports = {
    isDebugMode,
    HTTP_PREFIX_REG,
    custom_assign,
    joinUrl,
    addHttpProtocol,
    isStaticResouce,
    splitTargetAndPath,
    pathCompareFactory,
    transformPath,
    fixJson,
    getIPv4Address,
    getType
}
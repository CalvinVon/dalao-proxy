const chalk = require('chalk');
const _ = require('lodash');

const os = require('os');
const URL = require('url').URL;
const path = require('path');

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

                result = result
                    .replace(rewriteReg, (...matched) => {
                        return replaceStr.replace(/\$(\d+)/g, (_, index) => {
                            return matched[index];
                        });
                    })
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
    const isObject = getType(target, 'Object');
    const isArray = getType(target, 'Array');

    let _target;
    if (isObject) {
        _target = { ...target };
    }
    else if (isArray) {
        _target = [...target];
    }
    else {
        return target;
    }

    for (const key in _target) {
        const value = _target[key];
        _target[key] = defineProxy(value, opt);
    }
    return new Proxy(_target, {
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
 * change `uid` of the `process`
 */
function changeProcessUid(uid, gid, _process = process) {
    const hasUid = _process.setgid && _process.setuid && _process.getuid;
    if (hasUid) {
        try {
            _process.setuid(uid);
            _process.setgid(gid);
        } catch (error) {
            console.log(chalk.yellow('Switching user failed.'));
            throw error;
        }
    }
}

/**
 * set `uid` of the `process` to root
 */
function setAsRootUser(_process = process) {
    changeProcessUid(0, 0, _process);
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
    transformPath,
    fixJson,
    getIPv4Address,
    getType,
    defineProxy,
    changeProcessUid,
    setAsRootUser
}
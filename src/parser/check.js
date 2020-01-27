const chalk = require('chalk');
const REG_PROTOCOL_HOST_PORT = /^(https?:\/\/)?(([\w-_]+\.)+[\w-_]+|localhost)(\:\d+)?/;

/**
 * base check function
 * @param {String} field check field
 * @param {String} value 
 * @param {RegExp} regexp
 * @param {Boolean} canIgnore if `true`, check return `false` even if there's an error
 */
function _check (field, value, regexp, canIgnore = false) {
    if (regexp.test(String(value))) {
        return true;
    }
    console.log(chalk.red(`[Config check]: ${canIgnore ? 'Deprecated' : 'Incorrect' } config field \`${field}\`: value \`${value}\`, please check your config file`));
    // return false || canIgnore;
    !canIgnore && process.exit(-1);
}

const proxyTable = {
    // Supported Regexp
    proxyPath: value => _check('proxyTable.[proxy]', value, /^\/([\w-_]+\/?)*$/),
    // proxyPath: value => _check('proxyTable.[proxy]', value, /^[\w-_^$\\\.\/()\[\]]+$/),
    
    // Support $n replacement
    path: value => _check('proxyTable.path', value, /^\/([\w-_]+\/?)*$/),
    target: value => _check('proxyTable.target', value, REG_PROTOCOL_HOST_PORT, true),
}

// All check functions return true when it is valid.
module.exports = {
    configFileName: value => _check('configFileName', value, /^\.?([^\\\/\:\*\?"<>\|\s]+\.)*[^\\\/\:\*\?"<>\|\s]+(\.js(on)?)?$/),
    cacheDirname: value => _check('cacheDirname', value, /^\.?([^\\\/\:\*\?"<>\|\s]+\.)*[^\\\/\:\*\?"<>\|\s]+$/),
    watch: value => _check('watch', value, /^(true|false)$/),
    // cache: value => _check('cache', value, /^(true|false)$/),
    host: value => _check('host', value, /^([\w-_]+\.)*[\w-_]+$/),
    port: value => _check('port', value, /^\d{2,5}$/),
    target: value => _check('target', value, REG_PROTOCOL_HOST_PORT),
    proxyTable
}
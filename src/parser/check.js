const chalk = require('chalk');
const REG_PROTOCOL_HOST_PORT = /^(https?:\/\/)?(([a-z\u00a1-\uffff0-9%_-]+\.)+[a-z\u00a1-\uffff0-9%_-]+|localhost)(\:\d+)?/i;

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
    proxyPath: value => _check('proxyTable.[proxy]', value, /^\/([a-z\u00a1-\uffff0-9%_-]+\/?)*$/i),
    // proxyPath: value => _check('proxyTable.[proxy]', value, /^[\w-_^$\\\.\/()\[\]]+$/),
    
    // Support $n replacement
    path: value => _check('proxyTable.path', value, /^\/([a-z\u00a1-\uffff0-9%_-]+\/?)*$/i),
    target: value => _check('proxyTable.target', value, REG_PROTOCOL_HOST_PORT, true),
}

// All check functions return true when it is valid.
module.exports = {
    configFileName: value => _check('configFileName', value, /^\.?([^\\\/\:\*\?"<>\|\s]+\.)*[^\\\/\:\*\?"<>\|\s]+(\.js(on)?)?$/),
    watch: value => _check('watch', value, /^(true|false)$/),
    host: value => _check('host', value, /^([a-z\u00a1-\uffff0-9%_-]+\.)*[a-z\u00a1-\uffff0-9%_-]+$/i),
    port: value => _check('port', value, /^\d{2,5}$/),
    target: value => _check('target', value, REG_PROTOCOL_HOST_PORT),
    proxyTable
}
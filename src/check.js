const REG_PROTOCOL_HOST_PORT = /^(https?:\/\/)?((\w+\.)+\w+|localhost)(\:\d+)?/;

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
    console.log(`[Config check]: ${canIgnore ? 'Deprecated' : 'Incorrect' } config field \`${field}\`: value \`${value}\`, please check your config file`.red);
    // return false || canIgnore;
    !canIgnore && process.exit(-1);
}

const proxyTable = {
    proxyPath: value => _check('proxyTable.[proxy]', value, /^\/(\w+)?/),
    path: value => _check('proxyTable.path', value, /^\/(\w+)?/),
    target: value => _check('proxyTable.target', value, REG_PROTOCOL_HOST_PORT, true),
    cache: value => _check('proxyTable.cache', value, /^(true|false)$/),
}

// All check functions return true when it is valid.
module.exports = {
    configFilename: value => _check('configFilename', value, /^\.?([^\\\/\:\*\?"<>\|\s]+\.)*[^\\\/\:\*\?"<>\|\s]+\.js(on)?$/),
    cacheDirname: value => _check('cacheDirname', value, /^\.?([^\\\/\:\*\?"<>\|\s]+\.)*[^\\\/\:\*\?"<>\|\s]+$/),
    watch: value => _check('watch', value, /^(true|false)$/),
    cache: value => _check('cache', value, /^(true|false)$/),
    host: value => _check('host', value, /^([\w-_]+\.)*[\w-_]+$/),
    port: value => _check('port', value, /^\d{2,5}$/),
    target: value => _check('target', value, REG_PROTOCOL_HOST_PORT),
    proxyTable
}
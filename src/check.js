/**
 * base check function
 * @param {String} field check field
 * @param {String} value 
 * @param {RegExp} regexp
 * @param {Boolean} canIgnore if `true`, check return `false` even if there's an error
 */
function _check (field, value, regexp, canIgnore = false) {
    if (regexp.test(value)) {
        return true;
    }
    console.log(`  [Config check]: ${canIgnore ? 'Deprecated' : 'Incorrect' } config field \`${field}\`: value \`${value}\`, please check your config file`.red);
    // return false || canIgnore;
    !canIgnore && process.exit(-1);
}

const proxyTable = {
    proxyPath: value => _check('proxyTable.[proxy]', value, /^\/(\w+)?/),
    path: value => _check('proxyTable.path', value, /^\/(\w+)?/),
    target: value => _check('proxyTable.target', value, /^(https?:\/\/)?((\w+\.)+\w+|localhost)(\:\d+)?/, true),
    cache: value => _check('proxyTable.cache', value, /^(true|false)$/),
}

// All check functions return true when it is valid.
module.exports = {
    proxyTable
}
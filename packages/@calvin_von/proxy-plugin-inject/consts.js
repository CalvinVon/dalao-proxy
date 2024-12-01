const random = Math.random().toString(16).slice(-4);
const PROXY_PREFIX = `/__inject-${random}__`;
const URL_PREFIX = PROXY_PREFIX + '/';

module.exports = {
    PROXY_PREFIX,
    URL_PREFIX,
    DEBUGGER_PORT: 8108
}
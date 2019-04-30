const path = require('path');
const fs = require('fs');

function checkAndCreateCacheFolder (cacheDirname) {
    const pwd = process.cwd();
    const fullCacheDirname = path.resolve(pwd, cacheDirname);
    if (!fs.existsSync(fullCacheDirname)) {
        fs.mkdirSync(fullCacheDirname);
    }
}

// transfer url to (cache) filename
// /`${GET/POST}_${URI}`/
function url2filename(method, url) {
    return method.toUpperCase()
        + url.split('/')
            .join('_')
            .replace(/\?.+/, '')
            .replace(/#.+/, '')
}

module.exports = {
    checkAndCreateCacheFolder,
    url2filename
};
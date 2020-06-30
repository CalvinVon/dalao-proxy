const path = require('path');
const fs = require('fs');

const DELIMITER = '_';

function checkAndCreateFolder (dirname) {
    const pwd = process.cwd();
    const fullDirname = path.resolve(pwd, dirname);
    if (!fs.existsSync(fullDirname)) {
        fs.mkdirSync(fullDirname);
    }
}

// transfer url to (cache) filename
// /`${Method}_${URI}`/
function url2filename(method, url) {
    return method.toUpperCase()
        + url.split('/')
            .join(DELIMITER)
            .replace(/\?.+/, '')
            .replace(/#.+/, '')
        + (url === '/' ? '.html' : '')
}

function filename2url(filename) {
    const parts = filename.split(DELIMITER);
    const method = parts.shift();
    const url = '/' + parts.join('/');
    return {
        method,
        url
    }
}

module.exports = {
    checkAndCreateFolder,
    url2filename,
    filename2url
};
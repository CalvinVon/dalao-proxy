const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { url2filename } = require('./utils');
const _ = require('lodash');
const moment = require('moment');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function questionUrl(method, { cacheDirname }) {
    rl.question('Request url path', function (path) {
        const mockFileName = path
            .resolve(process.cwd(), `./${cacheDirname}/${url2filename(method, url)}.json`)
        const json = {
            CACHE_INFO: 'Mocked by Dalao Proxy',
            CACHE_TIME: Date.now(),
            CACHE_TIME_TXT: moment().format('llll'),
            CACHE_DEBUG = {
                url: path,
                method
            }
        };
        fs.writeFileSync(
            url2filename(method, path),
            JSON.stringify(json, null, 4),
            {
                encoding: 'utf8',
                flag: 'w'
            }
        );
    });
}


module.exports = function MockFileGenerator (program, method, runtimeConfig) {
    return questionUrl(method, runtimeConfig);
}
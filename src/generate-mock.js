const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { checkAndCreateCacheFolder } = require('./utils');
const baseConfig = require('../config');
const { url2filename } = require('./utils');
const moment = require('moment');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let resolvedConfig = baseConfig;
let resolvedCacheFolder = baseConfig.cacheDirname;
function questionUrl(program, method, { cacheDirname, configFilename }) {
    // used custom config file
    if (configFilename !== baseConfig.configFilename) {
        try {
            resolvedConfig = JSON.parse(fs.readFileSync(configFilename));
            resolvedCacheFolder = resolvedConfig.cacheDirname;
        } catch (error) {
            console.error(' Parse config file failed with ' + error.message);
        }
    }
    if (cacheDirname !== resolvedConfig.cacheDirname) {
        resolvedCacheFolder = cacheDirname;
    }
    
    function question() {
        rl.question('Request url path: ', function (url) {
            rl.resume()
            console.log('> get: ' + url);
            if (!/^(\/[\w-_]+)*/.test(url)) {
                console.log('Please input a valid path');
                question();
            }
            const mockFileName = path
                .resolve(process.cwd(), `./${resolvedCacheFolder}/${url2filename(method, url)}.json`)
            const json = {
                CACHE_INFO: 'Mocked by Dalao Proxy',
                CACHE_TIME: Date.now(),
                CACHE_TIME_TXT: moment().format('llll'),
                CACHE_DEBUG: {
                    url,
                    method
                },
                data: {}
            };
            json[resolvedConfig.responseFilter[0] || 'code'] = resolvedConfig.responseFilter[1] || 200;
            checkAndCreateCacheFolder(resolvedCacheFolder);
            fs.writeFileSync(
                mockFileName,
                JSON.stringify(json, null, 4),
                {
                    encoding: 'utf8',
                    flag: 'w'
                }
            );
        });
    }

    question();
}


module.exports = function MockFileGenerator(program, method, runtimeConfig) {
    if (runtimeConfig) {
        return questionUrl(program, method, runtimeConfig);
    }
    else {
        return questionUrl(program, method, {
            cacheDirname: program.dir || baseConfig.cacheDirname,
            configFilename: program.config || baseConfig.configFilename
        });
    }
}
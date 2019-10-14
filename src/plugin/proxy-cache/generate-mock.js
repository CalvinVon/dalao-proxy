const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { checkAndCreateCacheFolder, url2filename } = require('./utils');
const moment = require('moment');
const baseConfig = require('../../../config');

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
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('> Request url path: '.yellow, function (url) {
            if (!/^\/([\w-_]+\/?)*$/.test(url)) {
                console.log('Please input a valid path');
                rl.close();
                return question();
            }
            const isInJsFile = program.js;
            const mockFileName = path.resolve(process.cwd(), `./${resolvedCacheFolder}/${url2filename(method, url)}`) + (isInJsFile ? '.js' : '.json');
            const json = {
                CACHE_INFO: 'Mocked by Dalao Proxy',
                CACHE_TIME_TXT: moment().format('llll'),
                CACHE_REQUEST_DATA: {
                    url,
                    method
                },
                data: {}
            };
            json[resolvedConfig.responseFilter[0] || 'code'] = resolvedConfig.responseFilter[1] || 200;
            checkAndCreateCacheFolder(resolvedCacheFolder);

            let fileContent = JSON.stringify(json, null, 4);

            if (isInJsFile) {
                const wrapper = [
                    'module.exports = ',
                    ';'
                ];
                fileContent = wrapper[0] + fileContent + wrapper[1];
            }
            fs.writeFileSync(
                mockFileName,
                fileContent,
                {
                    encoding: 'utf8',
                    flag: 'w'
                }
            );
            console.log(`Mock file created in ${mockFileName}\n`.yellow);
            rl.close();
            process.exit(1);
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
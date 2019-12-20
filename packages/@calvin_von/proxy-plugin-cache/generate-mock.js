const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { checkAndCreateCacheFolder, url2filename } = require('./utils');
const moment = require('moment');

const HEADERS_FIELD_TEXT = '[[headers]]';
const FOREVER_VALID_FIELD_TEXT = '[[mock]]';

exports.MockFileGenerator = function MockFileGenerator(method, options, config) {
    return questionUrl(method, options, config);
}

exports.HEADERS_FIELD_TEXT = HEADERS_FIELD_TEXT;
exports.FOREVER_VALID_FIELD_TEXT = FOREVER_VALID_FIELD_TEXT;

function questionUrl(method, options, config) {

    function question() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(
            chalk.yellow('> Request url path: ') + config.prefix,
            function (url) {
                url += config.prefix;
                if (!/^\/([\w-_]+\/?)*$/.test(url)) {
                    console.log('Please input a valid path');
                    rl.close();
                    return question();
                }
                const isInJsFile = options.js;
                const mockFileName = path.resolve(process.cwd(), `./${config.dirname}/${url2filename(method, url)}`) + (isInJsFile ? '.js' : '.json');
                const json = {
                    CACHE_INFO: 'Mocked by Dalao Proxy',
                    CACHE_TIME_TXT: moment().format('llll'),
                    CACHE_REQUEST_DATA: {
                        url,
                        method
                    },
                    data: {},
                    [HEADERS_FIELD_TEXT]: {},
                    [FOREVER_VALID_FIELD_TEXT]: true
                };

                applyFilter(config.filters, json);
                checkAndCreateCacheFolder(config.dirname);

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
                console.log(chalk.yellow(`Mock file created in ${mockFileName}\n`));
                rl.close();
                process.exit(0);
            }
        );
    }

    question();
}


function applyFilter(filters, data) {
    filters.forEach(filter => {
        if (filter.when) return;

        if (filter.where === 'body') {
            if (filter.field) {
                data[filter.field] = filter.value;
            }
        }
        else {
            if (filter.field) {
                data[HEADERS_FIELD_TEXT][filter.field] = filter.value;
            }
        }
    });
}
const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { checkAndCreateFolder, url2filename } = require('../utils');
const moment = require('moment');

const HEADERS_FIELD_TEXT = '[[headers]]';
const MOCK_FIELD_TEXT = '[[mock]]';
const STATUS_FIELD_TEXT = '[[status]]';

exports.MockFileGenerator = function MockFileGenerator(method, url, options, config) {
    if (url) {
        generateFile(method, url, options, config);
        process.exit(0);
    }
    else {
        questionUrl(method, options, config);
    }
}

exports.HEADERS_FIELD_TEXT = HEADERS_FIELD_TEXT;
exports.MOCK_FIELD_TEXT = MOCK_FIELD_TEXT;
exports.STATUS_FIELD_TEXT = STATUS_FIELD_TEXT;

function questionUrl(method, options, config) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const questions = [
        chalk.yellow('[Mock] Method: '),
        chalk.yellow('[Mock] Url: ') + config.mock.prefix,
    ];

    const validators = [
        method => {
            if (!/^(GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD)$/i.test(method)) {
                console.error(chalk.red(method + ' is not a valid HTTP method'));
                return false;
            }
            return true;
        },
        url => {
            const mockUrl = config.mock.prefix + url;
            if (!/^\/([a-z\u00a1-\uffff0-9%_-]+\/?)*$/i.test(mockUrl)) {
                console.error(chalk.red(mockUrl + ' is not a valid url'));
                return false;
            }
            return true;
        }
    ];

    const answers = [];

    let index = 0;
    if (method) {
        index++;
        answers.push(method);
    }

    function askQuestion() {
        rl.question(
            questions[index],
            value => {
                if (validators[index].call(null, value)) {
                    answers.push(value);
                    if (index === questions.length - 1) {
                        generateFile(...answers, options, config);
                        process.exit(0);
                    }
                    else {
                        index++;
                        askQuestion();
                    }
                }
                else {
                    askQuestion();
                }
            }
        );
    }

    askQuestion();
}

function generateFile(method, url, options, config) {
    const mockUrl = config.mock.prefix + url;
    const isInJsFile = options.js;
    const mockFileName = path.resolve(process.cwd(), `./${config.mock.dirname}/${url2filename(method, mockUrl)}`) + (isInJsFile ? '.js' : '.json');
    const json = {
        CACHE_INFO: 'Mocked by Dalao-Proxy Plugin Cache',
        CACHE_TIME_TXT: moment().format('llll'),
        CACHE_REQUEST_DATA: {
            url: mockUrl,
            method
        },
        [HEADERS_FIELD_TEXT]: {},
        [MOCK_FIELD_TEXT]: true,
        [STATUS_FIELD_TEXT]: 200
    };

    applyFilter(config.cache.filters, json);
    checkAndCreateFolder(config.mock.dirname);

    let fileContent = JSON.stringify(json, null, 4);

    if (isInJsFile) {
        const fileWrapper = content => {
            if (options.time) {
                return `const data = ${content};

module.exports = new Promise(resolve => {
    setTimeout(() => {
        resolve(data);
    }, ${options.time});
});`
            }
            else {
                return `module.exports = ${content};`
            }
        };
        fileContent = fileWrapper(fileContent);
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
}


function applyFilter(filters, data) {
    filters.forEach(filter => {
        // find matched route filter
        if (filter.custom) return;
        if (filter.when === 'request') return;
        if (filter.applyRoute !== '*' && data.CACHE_REQUEST_DATA.url.indexOf(filter.applyRoute) === -1) return;

        if (filter.field) {
            if (filter.where === 'headers') {
                data[HEADERS_FIELD_TEXT][filter.field] = filter.value;
            }
            else if (filter.where === 'data') {
                data[filter.field] = filter.value;
            }
            else if (filter.where === 'body') {
                data[filter.field] = filter.value;
            }
        }
    });
}
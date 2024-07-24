const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { checkAndCreateFolder, urlMapFS, HTTP_METHODS } = require('../utils');
const moment = require('moment');

const HEADERS_FIELD_TEXT = '[[headers]]';
const MOCK_FIELD_TEXT = '[[mock]]';
const STATUS_FIELD_TEXT = '[[status]]';

const ContentWrapper = {
    useObject: content => {
        return `module.exports = ${content};`;
    },

    usePromise: (content, time) => {
        return `const data = ${content};

module.exports = new Promise(resolve => {
    setTimeout(() => {
        resolve(data);
    }, ${time});
});`
    },

    useFunction: content => {
        return `const data = ${content};

module.exports = function(context) {
    return data;
}`;
    },

    useFunctionReturnPromise: (content, time) => {
        return `const data = ${content};

module.exports = function(context) {
    const { request, response } = context;
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, ${time});
    });
}`;
    }
};
let validators;

exports.HEADERS_FIELD_TEXT = HEADERS_FIELD_TEXT;
exports.MOCK_FIELD_TEXT = MOCK_FIELD_TEXT;
exports.STATUS_FIELD_TEXT = STATUS_FIELD_TEXT;


exports.ContentWrapper = ContentWrapper;

exports.MockFileGenerator = async function MockFileGenerator(method, url, options, config) {
    validators = {
        method: method => {
            if (!new RegExp(`^${HTTP_METHODS.join('|')}$`, 'i').test(method)) {
                console.error(chalk.red(method + ' is not a valid HTTP method'));
                return false;
            }
            return true;
        },
        url: url => {
            const mockUrl = config.mock.prefix + url;
            if (!/^\/\S*$/i.test(mockUrl)) {
                console.error(chalk.red(mockUrl + ' is not a valid url'));
                return false;
            }
            return true;
        }
    };
    validators[0] = validators.method;
    validators[1] = validators.url;


    if (method && url) {
        if (validators.method.call(null, method) && validators.url.call(null, url)) {
            await generateFile(method, url, options, config);
        }
        process.exit(0);
    }
    else {
        questionUrl(method, options, config);
    }
};

function questionUrl(method, options, config) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('close', () => {
        process.exit();
    });

    const questions = [
        chalk.yellow('[Mock] Method: '),
        chalk.yellow('[Mock] Url: ') + config.mock.prefix,
    ];

    const answers = [];

    let index = 0;
    if (method) {
        if (validators.method.call(null, method)) {
            index++;
            answers.push(method);
        }
        else {
            process.exit(-1);
        }
    }

    function askQuestion() {
        rl.question(
            questions[index],
            async value => {
                if (validators[index].call(null, value)) {
                    answers.push(value);
                    if (index === questions.length - 1) {
                        await generateFile(...answers, options, config);
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

async function generateFile(method, url, options, config) {
    const mockUrl = config.mock.prefix + url;
    const isInJsFile = options.program;
    const mockFileName = path.resolve(process.cwd(), `./${config.mock.dirname}/${urlMapFS(mockUrl, method, '', config.cache.filenameTpl).fullPath}`) + (isInJsFile ? '.js' : '.json');
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

    let fileContent = JSON.stringify(json, null, 2);

    if (isInJsFile) {
        const fileWrapper = content => {
            const {
                time: useDelay,
                function: useFunction
            } = options;

            let useWrapper;

            if (useDelay && useFunction) {
                useWrapper = ContentWrapper.useFunctionReturnPromise.bind(null, content, useDelay);
            }
            else if (useDelay) {
                useWrapper = ContentWrapper.usePromise.bind(null, content, useDelay);
            }
            else if (useFunction) {
                useWrapper = ContentWrapper.useFunction.bind(null, content);
            }
            else {
                useWrapper = ContentWrapper.useObject.bind(null, content);
            }

            return useWrapper();
        };

        fileContent = fileWrapper(fileContent);
    }
    await checkAndCreateFolder(path.dirname(mockFileName));
    await fs.promises.writeFile(
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
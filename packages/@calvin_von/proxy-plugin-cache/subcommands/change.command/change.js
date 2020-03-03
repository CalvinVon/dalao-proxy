const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { ContentWrapper, MOCK_FIELD_TEXT } = require('../../mock.command/mock');
const { url2filename, filename2url } = require('../../utils');

module.exports = function changeMockFile(file, options, config, parentName) {
    const {
        method,
        url,
        json: useJSON,
        time: useDelayTime,
        function: useFunction
    } = options;

    const getType = this.context.exports.Utils.getType;
    const pwd = process.cwd();
    const filePath = path.join(pwd, file);
    const filename = path.basename(file);

    try {
        parseRawFile((err, mockData) => {
            if (err) {
                process.exit(-1);
            }

            if (parentName === 'mock') {
                mockData[MOCK_FIELD_TEXT] = true;
            }
            else {
                mockData[MOCK_FIELD_TEXT] = false;
            }

            generateFile(mockData);
        })
    } catch (error) {
        console.error(chalk.red('Changing file error: ' + error.message));
        process.exit(-1);
    }


    function parseRawFile(next) {
        if (fs.existsSync(filePath)) {
            const content = require(filePath);
            if (getType(content, 'Object')) {
                next(null, content);
            }
            else if (getType(content, 'Promise')) {
                console.log(chalk.yellow('This file may have mocked network delay, please waiting for parse...'));
                content
                    .then(data => {
                        next(null, data);
                    })
                    .catch(error => {
                        console.error(chalk.red('Parsing file error: ' + error.message));
                        next(error);
                    });
            }
            else if (getType(content, 'Function')) {
                console.warn(chalk.yellow('This file may not be changed into another extension, cause it exports a function that may access proxy context.'));
                try {
                    const returnValue = content.call(null, {});
                    if (getType(returnValue, 'Promise')) {
                        console.log(chalk.yellow('This file may have mocked network delay, please waiting for parse...'));
                        returnValue
                            .then(data => {
                                next(null, data);
                            })
                            .catch(error => {
                                console.error(chalk.red('Parsing file error: ' + error.message));
                                next(error);
                            });
                    }
                    else {
                        next(null, returnValue);
                    }
                } catch (error) {
                    console.error(chalk.red('Parsing file error: ' + error.message));
                    next(error);
                }
            }
        }
        else {
            console.log(chalk.red('File not exist: ' + filePath));
            next(true);
        }
    }

    function generateFile(data) {
        let content = JSON.stringify(data, null, 4);
        let extension;
        if (!useJSON) {
            extension = '.js';
            if (useFunction && useDelayTime) {
                content = ContentWrapper.useFunctionReturnPromise(content, useDelayTime);
            }
            else if (useDelayTime) {
                content = ContentWrapper.usePromise(content, useDelayTime);
            }
            else if (useFunction) {
                content = ContentWrapper.useFunction(content);
            }
            else {
                content = ContentWrapper.useObject(content);
            }
        }
        else {
            extension = '.json';
        }

        let newFilename = filename;
        if (method || url) {
            const { prefix } = config.mock;
            const parseResult = filename2url(filename);
            parseResult.method = method || parseResult.method;
            if (url) {
                parseResult.url = (prefix ? prefix : '') + url;
            }
            newFilename = url2filename(parseResult.method, parseResult.url);
        }

        newFilename = newFilename.replace(new RegExp(path.extname(newFilename) + '$'), extension);

        const { dirname } = config[parentName];
        const newFilePath = path.join(pwd, dirname, newFilename);
        fs.writeFileSync(
            newFilePath,
            content
        );
        console.log(chalk.green('Changed file generated in ' + newFilePath));
        process.exit(0);
    }

};
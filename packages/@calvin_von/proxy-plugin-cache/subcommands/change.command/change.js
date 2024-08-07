const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const mimeTypes = require('mime-types');
const { ContentWrapper, MOCK_FIELD_TEXT } = require('../../mock.command/mock');
const { urlMapFS, fsMapUrl, checkAndCreateFolder } = require('../../utils');

module.exports = function changeMockFile(file, options, config, parentName) {
    const {
        method,
        url,
        json: useJSON,
        time: useDelayTime,
        function: useFunction
    } = options;

    const { filenameTpl, queryFilter } = config.cache;

    const { dirname } = config[parentName];
    const folderReg = new RegExp(`^(.+)?(${config.cache.dirname}|${config.mock.dirname})`);

    const getType = this.context.exports.Utils.getType;
    const pwd = process.cwd();
    const filePath = path.isAbsolute(file) ? file : path.join(pwd, file);
    const relativePath = filePath.replace(folderReg, '');

    try {
        parseRawFile(async (err, mockData) => {
            if (err) {
                process.exit(-1);
            }

            if (parentName === 'mock') {
                mockData[MOCK_FIELD_TEXT] = true;
            }
            else {
                mockData[MOCK_FIELD_TEXT] = false;
            }

            await generateFile(mockData);
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

    async function generateFile(data) {
        let content = JSON.stringify(data, null, 2);
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

        let newFilename = relativePath;
        if (method || url) {
            const { prefix } = config.mock;
            const parseResult = fsMapUrl(newFilename, filenameTpl);
            if (method) {
                parseResult.method = method;
            }
            if (url) {
                parseResult.url = (prefix ? prefix : '') + url;
            }
            newFilename = urlMapFS(parseResult.url, parseResult.method, mimeTypes.lookup(extension), filenameTpl, queryFilter);
        }

        newFilename = newFilename.replace(new RegExp(path.extname(newFilename) + '$'), extension);

        const newFilePath = path.join(pwd, dirname, newFilename);
        await checkAndCreateFolder(path.dirname(newFilePath));
        await fs.promises.writeFile(
            newFilePath,
            content,
        );
        console.log(chalk.green('Changed file generated in ' + newFilePath));
        process.exit(0);
    }

};
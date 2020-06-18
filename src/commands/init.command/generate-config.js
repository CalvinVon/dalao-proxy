const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { program } = require('../../../src');
const { Plugin } = require('../../plugin');
const defaultConfig = require('../../../config');
const custom_assign = require('../../utils').custom_assign;

const pwd = process.cwd();
const Generator = module.exports;

// questions
let questionObjs = [
    { label: 'Config file name', value: 'configFileName', text: true, radio: false },
    { label: 'Proxy server host', value: 'host', text: true, radio: false },
    { label: 'Proxy server port', value: 'port', text: true, radio: false },
    { label: 'Proxy target server address', value: 'target', text: true, radio: false },
    { label: 'Enable cache response', value: 'cache', text: false, radio: true },
];

// default answers
let defaultAnswers = [
    defaultConfig.configFileName,
    defaultConfig.host,
    defaultConfig.port,
    defaultConfig.target,
    true,
];

// user answers
const answers = [];
let index = 0;

function createConfigFile(config) {
    const {
        force: forceSkip,
        js: inJsFormat,
    } = config;

    let generateConfig = {};
    const saveFileExtention = inJsFormat ? '.js' : '.json';
    const saveFileWrapper = context => inJsFormat ? `module.exports = ${context};` : context;


    questionObjs.forEach(function (questionObj, index) {
        generateConfig[questionObj.value] = answers[index];
    });

    generateConfig = _.assignWith({}, _.omit(defaultConfig, ['version', 'debug', 'logger', 'configFileName']), generateConfig, custom_assign);
    // prevent build-in plugins exposing
    generateConfig.plugins = [];

    const fullConfigFilePath = path.resolve(pwd, forceSkip ? defaultAnswers[0] : generateConfig.configFileName) + saveFileExtention;

    const fileContent = saveFileWrapper(JSON.stringify(generateConfig, null, 4));
    fs.writeFileSync(fullConfigFilePath, fileContent);
    console.log(chalk.green(`> 🎉  Congratulations, \`${fullConfigFilePath}\` has generated for you.`));
    console.log(chalk.grey('  More details about proxy config or cache config, please see ') + chalk.yellow('https://github.com/CalvinVon/dalao-proxy#docs\n'));
}

/**
 * Run question loop
 * @param {Object} config
 * @param {Boolean} config.forceSkip if true skip all the questions
 */
function runQuestionLoop(config, callback) {
    const { force: forceSkip } = config;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (forceSkip || index === questionObjs.length) {
        createConfigFile(config);
        rl.close();
        callback();
    }

    const questionObj = questionObjs[index];
    const defaultAnswer = defaultAnswers[index];
    let question = '> ';
    const { label, radio, text } = questionObj;
    if (text) {
        question += label + ' (' + defaultAnswer + '): ';
    }
    else if (radio) {
        question += label + ' (y/n, default: ' + (defaultAnswer ? 'yes' : 'no') + '): ';
    }

    rl.question(question, function (answer) {
        if (text) {
            answers.push(answer || defaultAnswer);
            index++;
        }
        else if (radio) {
            if (!answer) {
                answers.push(defaultAnswer);
                index++;
            }
            else {
                const yesMatched = /^(true|y|yes)$/i.test(answer);
                const noMatched = /^(false|no?)$/i.test(answer);
                if (yesMatched || noMatched) {
                    answers.push(yesMatched || defaultAnswer);
                    index++;
                }
                else {
                    console.log(chalk.red('> dalao says: 👋  enter `y/yes` or `n/no`'));
                }
            }
        }
        rl.close();
        runQuestionLoop(config, callback);
    });
}

function addPluginConfig(config) {
    const {
        plugin: pluginName,
        config: configFilePath,
        js: inJsFormat,
    } = config;

    const fileConfig = require(configFilePath);

    const plugin = new Plugin(pluginName, program.context);
    const pluginDefaultConfig = plugin.parser({});
    const pluginConfigField = plugin.setting.optionsField;

    if (Array.isArray(pluginConfigField)) {
        console.warn(chalk.yellow('Init warning: this plugin(' + pluginName + ') contains multiple options fields(' + pluginConfigField.join(', ') + '), \n'
            + 'We are trying to generate the corresponding configuration for you as much as possible, but it is not guaranteed to\n'
            + 'be correct, please find the corresponding plugin configuration document.\n'));
        for (const field of pluginConfigField) {
            fileConfig[field] = pluginDefaultConfig[field];
        }
    }
    else {
        fileConfig[pluginConfigField] = pluginDefaultConfig;
    }

    const saveFileExtention = inJsFormat ? '.js' : '.json';
    const saveFileWrapper = context => inJsFormat ? `module.exports = ${context};` : context;

    const fileContent = saveFileWrapper(JSON.stringify(fileConfig, null, 4));
    const filePath = configFilePath.replace(path.extname(configFilePath), '') + saveFileExtention;
    fs.writeFileSync(filePath, fileContent);

    console.log(chalk.green(`> Config for plugin \`${pluginName}\` updated in field \`${pluginConfigField}\` of \`${filePath}\`.`));
    console.log(chalk.grey('  More config about the plugin, please use the command ') + chalk.yellow(`\`dalao-proxy plugin config ${pluginName}.\`\n`));
}

Generator.generateConfigFile = function generateConfigFile(config, callback) {
    if (!config.force) {
        const preHint = `
This utility will walk you through creating a config file.
It only covers the most common items, and tries to guess sensible defaults.

See \`dalao-proxy --help\` for definitive documentation on these fields
and exactly what they do.

Press ^C at any time to quit.
`;

        console.log(preHint);
    }
    return runQuestionLoop(config, callback);
};

Generator.generatePluginConfig = function (config, callback) {
    const {
        config: configFilePath,
    } = config;

    if (!fs.existsSync(configFilePath)) {
        Generator.generateConfigFile(config, () => {
            addPluginConfig(config);
            callback();
        });
    }
    else {
        addPluginConfig(config);
        callback();
    }
};

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const defalutConfig = require('../config');
const pwd = process.cwd();
const custom_assign = require('./utils').custom_assign;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// questions
let questionObjs = [
    { label: 'Config file name', value: 'host', text: true, radio: false },
    { label: 'Proxy server host', value: 'host', text: true, radio: false },
    { label: 'Proxy server port', value: 'port', text: true, radio: false },
    { label: 'Proxy target server address', value: 'target', text: true, radio: false },
    { label: 'Should cache request', value: 'cache', text: false, radio: true },
    { label: 'Cache folder name', value: 'info', text: true, radio: false },
];

// default answers
let defaultAnswers = [
    defalutConfig.configFilename,
    defalutConfig.host,
    defalutConfig.port,
    defalutConfig.target,
    defalutConfig.cache,
    defalutConfig.cacheDirname,
];

// user answers
const answers = [];
let index = 0;

function createConfigFile() {
    let generateConfig = {};
    questionObjs.forEach(function (questionObj, index) {
        generateConfig[questionObj.value] = answers[index];
    });

    generateConfig = _.assignWith({}, _.omit(defalutConfig, ['version', 'configFilename']), generateConfig, custom_assign);

    const fullConfigFilePath = path.resolve(pwd, defalutConfig.configFilename);
    fs.writeFileSync(fullConfigFilePath, JSON.stringify(generateConfig, null, 4));
    console.log(`> 😉  dalao says: 🎉  Congratulations, \`${defalutConfig.configFilename}\` has generated for you.`.green);
    console.log(`  Do more about proxy config or cache config, please edit ${fullConfigFilePath}`.grey);
}

/**
 * Run question loop
 * @param {Boolean} forceSkip if true skip all the questions
 */
function runQuestionLoop(forceSkip) {
    if (forceSkip) {
        createConfigFile();
        rl.close();
        process.exit(0);
        return;
    }

    if (index === questionObjs.length) {
        createConfigFile();
        rl.close();
        process.exit(0);
        return;
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
                const yesMatched = ['true', 'y', 'yes'].some(item => item.toUpperCase() === answer.toUpperCase());
                const noMatched = ['false', 'n', 'no'].some(item => item.toUpperCase() === answer.toUpperCase());
                if (yesMatched || noMatched) {
                    answers.push(yesMatched || defaultAnswer);
                    index++;
                }
                else {
                    console.log('> dalao says: 👋  enter `y/yes` or `n/no`'.red);
                }
            }
        }
        runQuestionLoop();
    });
}

module.exports = function ConfigGenerator ({ force }) {
    return runQuestionLoop(force);
}
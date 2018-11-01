const readline = require('readline');
const fs = require('fs');
const _ = require('lodash');
const defalutConfig = require('../config');
const path = require('path');
const pwd = process.cwd();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// questions
let questionObjs = [
    { label: 'Proxy server host', value: 'host', text: true, radio: false },
    { label: 'Proxy server port', value: 'port', text: true, radio: false },
    { label: 'Proxy target server address', value: 'target', text: true, radio: false },
    { label: 'Should cache request', value: 'cache', text: false, radio: true },
    { label: 'Should output log', value: 'info', text: false, radio: true },
];

// default answers
let defaultAnswers = [
    defalutConfig.host,
    defalutConfig.port,
    defalutConfig.target,
    defalutConfig.cache,
    defalutConfig.info,
];

// user answers
const answers = [];
let index = 0;

function createConfigFile() {
    let generateConfig = {};
    questionObjs.forEach(function (questionObj, index) {
        generateConfig[questionObj.value] = answers[index];
    });

    generateConfig = Object.assign({}, _.omit(defalutConfig, ['version', 'configFilename']), generateConfig);

    fs.writeFileSync(path.resolve(pwd, defalutConfig.configFilename), JSON.stringify(generateConfig, null, 4));
    console.log(`> 😉  dalao says: 🎉  Congratulations, \`${defalutConfig.configFilename}\` has generated for you.`.green);
}

/**
 * Run question loop
 * @param {Boolean} forceSkip if true skip all the questions
 */
function runQuestionLoop(forceSkip) {
    if (forceSkip) {
        createConfigFile();
        rl.close();
        return;
    }

    if (index === questionObjs.length) {
        createConfigFile();
        rl.close();
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
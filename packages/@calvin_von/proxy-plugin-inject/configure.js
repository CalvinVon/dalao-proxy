
const fs = require('fs');
// presets
const PresetConsole = require('./presets/mobile-console');
const RemoteDebug = require('./presets/remote-console');

/**
 * Config field
 * @example
 *  "inject": {
 *      rules: [
 *          {
 *              test: 'index\.html$',
 *              serves: {
 *                  'inject-file.js': './libs/injected-file.js',
 *                  'inject-style.css': './libs/inject-style.css'
 *              },
 *              template: '<script>alert('something')</script>',
 *              templateSrc: './inject-script-to-html.js',
 *              insert: 'body'
 *          }
 *      ],
 *      presets: {
 *          mobileConsole: false,
 *          remoteConsole: false,
 *      }
 *  }
 */
const defaultOptions = {
    rules: [],
    presets: {
        mobileConsole: false,
        remoteConsole: false
    }
};

module.exports = {
    setting() {
        return {
            optionsField: 'inject'
        };
    },

    parser(rawOptions) {
        if (rawOptions && typeof rawOptions === 'object') {
            const presets = {
                ...defaultOptions.presets,
                ...(rawOptions.presets || {})
            };
            return {
                ...defaultOptions,
                ...{
                    rules: parseRules(rawOptions.rules || [], presets),
                    presets
                }
            }
        }
        else {
            return {
                rules: parseRules([], defaultOptions.presets),
                presets: defaultOptions.presets
            };
        }
    }
};


function parseRules(rawRules, presets) {
    const rules = [];
    if (presets.mobileConsole) {
        rules.push(...PresetConsole.rules);
    }
    if (presets.remoteConsole) {
        rules.push(...RemoteDebug.rules);
    }

    rules.push(
        ...rawRules
            .filter((rule, index) => {
                if (!rule.test) {
                    console.warn('[Plugin inject]: inject.rules.' + index + '.test should not be empty');
                    return false;
                }
                if (!rule.template && !lookUpTemplateFile(rule.templateSrc)) {
                    console.warn('[Plugin inject]: inject.rules.' + index + ' no template or template file found');
                    return false;
                }

                if (!/^(head|body)$/.test(rule.insert)) {
                    if (!rule.insert) {
                        rule.insert = 'body';
                    }
                    else {
                        console.warn('[Plugin inject]: inject.rules.' + index + '.insert should be `body` or `head`');
                        return false;
                    }
                }

                return true;

                function lookUpTemplateFile(src) {
                    return fs.existsSync(src);
                }
            })
    );

    return rules;
}
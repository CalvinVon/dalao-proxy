/**
 * Config field
 * @example
 *  "inject": {
 *      rules: [
 *          {
 *              test: 'index\.html$',
 *              serves: {
 *                  '/inject-file.js': './libs/injected-file.js',
 *                  '/inject-style.css': './libs/inject-style.css'
 *              },
 *              template: '<script>alert('something')</script>',
 *              templateSrc: './inject-script-to-html.js'
 *          }
 *      ],
 *      presets: {
 *          console: true,
 *          remoteDebug: true,
 *      }
 *  }
 */
const defaultOptions = {
    rules: [],
    preset: {
        console: true,
        remoteDebug: true
    }
};

module.exports = {
    configureSetting() {
        return {
            userOptionsField: 'inject'
        };
    },

    parser(rawOptions) {
        return {
            ...defaultOptions,
            // ...{
                // rules: parseRules(rawOptions.rules),
                // preset: {
                //     ...defaultOptions.preset,
                //     ...(rawOptions.preset || {})
                // }
            // }
        }
    }
};
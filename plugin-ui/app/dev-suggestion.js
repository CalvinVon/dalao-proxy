const path = require('path');
const fs = require('fs');
const pwd = process.cwd();

const detectors = {
    react: detectReactSetting,
    vue: detectVueSetting,
};

function Suggestion(command, config) {
    this.command = command;
    this.config = config;
}

module.exports = function devSuggestion(callback) {
    let whatApp;
    const packagePath = path.join(pwd, './package.json');
    if (!fs.existsSync(packagePath)) {
        return null;
    }

    const content = fs.readFileSync(packagePath);
    const json = JSON.parse(content.toString());

    const packageScripts = (json['dependencies'] || {});
    for (const dep in packageScripts) {
        if (dep.match(/\breact\b/)) {
            whatApp = 'react';
            break;
        }
        else if (dep.match(/\bvue\b/)) {
            whatApp = 'vue';
            break;
        }
    };

    if (detectors[whatApp]) {
        detectors[whatApp](json, (err, suggestions) => {
            callback(err, {
                app: whatApp,
                suggestions
            });
        });
    }
    else {
        callback(null, {
            app: 'unknown',
            suggestions: null
        });
    }
}





/**
 * detect react app setting
 * @param {Object} packageJson content of package.json
 */
function detectReactSetting(packageJson, callback) {
    const packageScripts = (packageJson['scripts'] || {});
    const config = {};
    let command;
    for (const script in packageScripts) {
        const scriptCmd = packageScripts[script];
        if (scriptCmd.match(/react-scripts start/)) {
            // suggestion for [plugin-autorun-scripts]
            config.autorun = {
                scripts: [script]
            };
            command = script;
            break;
        }
    };


    const [hostValue, portValue] = tryLoadValueFromFiles(
        ['host', 'port'],
        [
            '.env.development.local',
            '.env.development',
            '.env.local',
            '.env'
        ].map(it => path.join(pwd, it))
    );

    hostValue && (config.host = hostValue);
    portValue && (config.port = portValue);

    if (!config.port) {
        config.port = 3000;
    }

    callback(null, [new Suggestion(command, config)]);
}

function detectVueSetting(packageJson, callback) {
    const packageScripts = (packageJson['scripts'] || {});
    const packageDevDep = (packageJson['devDependencies'] || {});

    // judge vue-cli project version 2/3+
    let v2satisfied = 0;
    for (const dep in packageDevDep) {
        // version 3+
        if (dep === '@vue/cli-service') {
            handleVueCli3(callback);
            break;
        }
        else if (dep === 'webpack-dev-server' || dep === 'vue-loader') {
            v2satisfied++;
            if (v2satisfied === 2) {
                handleVueCli2(callback);
                break;
            }
        }
    }


    function handleVueCli3(callback) {
        let vueConfig, vueConfigPath = path.join(pwd, 'vue.config.js');
        try {
            vueConfig = require(vueConfigPath);
        } catch (error) { }

        const suggestions = [];
        // suggestion for [plugin-autorun-scripts]
        for (const script in packageScripts) {
            const scriptCmd = packageScripts[script];
            if (scriptCmd.match(/^vue-cli-service serve/)) {
                const config = {};
                config.autorun = {
                    scripts: [script]
                };

                const hostMatched = scriptCmd.match(/--host(?:\=|\s+)(\S+)/);
                if (hostMatched) {
                    config.host = hostMatched[1];
                }

                const portMatched = scriptCmd.match(/--port(?:\=|\s+)(\S+)/);
                if (portMatched) {
                    config.port = portMatched[1];
                }

                const defaults = {
                    host: '0.0.0.0',
                    port: 8080
                };
                let vueConfigDefined = {};
                if (vueConfig && vueConfig.devServer) {
                    vueConfigDefined = {
                        host: vueConfig.devServer.host || defaults.host,
                        port: vueConfig.devServer.port || defaults.port
                    };
                }

                const mergedConfig = Object.assign(defaults, vueConfigDefined, config);
                suggestions.push(new Suggestion(script, mergedConfig));
            }
        };

        delete require.cache[vueConfigPath];
        module.children = module.children.filter(child => child.id !== vueConfigPath);

        callback(null, suggestions);
    }

    function handleVueCli2(callback) {
        const config = {};
        for (const script in packageScripts) {
            const scriptCmd = packageScripts[script];
            let command;

            if (scriptCmd.match(/webpack-dev-server/)) {
                let matched,
                    configPath;
                if (matched = scriptCmd.match(/--config\s+(\S+)/)) {
                    configPath = path.join(pwd, matched[1]);
                }

                if (!configPath) {
                    configPath = path.join(pwd, 'webpack.config.js');
                }

                command = script;
                break;
            }

            try {
                require(configPath)
                    .then(webpackConfig => {
                        const { host, port } = webpackConfig.devServer;
                        config.host = host;
                        config.port = port;
                        callback(null, [new Suggestion(command, config)]);
                        cleanCache();
                    })
                    .catch(err => {
                        callback(err);
                        cleanCache();
                    })
            } catch (error) {
                callback(err);
                cleanCache();
            }

            function cleanCache() {
                delete require.cache[configPath];
                module.children = module.children.filter(child => child.id !== configPath);
            }
        }
    }
}

/**
 * try load field value from a list of files which sorts of priority
 * @param {Array<String>} fields 
 * @param {Array<String>} filePathList
 * @returns Array<String>
 */
function tryLoadValueFromFiles(fields, filePathList) {
    let mergedValue = [];
    let i = filePathList.length - 1;
    while (i >= 0) {
        const filePath = filePathList[i];
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath).toString();
            fields.forEach((field, index) => {
                const matched = content.match(new RegExp(`\\b${field}\\b\\s*=\\s*(.+))`, 'i'));
                if (matched) {
                    mergedValue[index] = matched[1];
                }
            });
        }
        i--;
    };

    return mergedValue;
}
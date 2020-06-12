const chalk = require('chalk');
const path = require('path');
const mockCommand = require('./mock.command');
const cacheCommand = require('./cache.command');
const { cleanCache } = require('./subcommands/clean.command/clean');
const { handleStore, handleRestore, handleListStore } = require('./subcommands/store.command/index');

module.exports = function (program, register, config) {
    mockCommand.call(this, program, register, config);
    cacheCommand.call(this, program, register, config);

    program.enableCollectData();

    register.addLineCommand('cache:clr', 'cache:clean');
    register.addLineCommand('cache:store', 'cache:restore', 'cache:list');
    register.on('input', input => {
        let matched;
        if (matched = input.match(/\bcache\:(clr|clean|cacheclean)\b(?:\s(\S+))?/)) {
            const storeName = matched[2];
            cleanCache({
                config: config['cache'],
                options: {
                    storeName
                }
            });
            console.log(chalk.grey('[plugin-cache] cache files has been cleaned!\n'));
        }
        else if (matched = input.match(/\b(?:cache\:((?:re)?store|list))\b(?:\s+(\S+))?/)) {
            const cmd = matched[1];
            const storeName = matched[2];

            const handlers = {
                store: name => handleStore.call(null, name, config, 'cache'),
                restore: name => handleRestore.call(null, name, config, 'cache'),
                list: () => handleListStore.call(null, () => null, config, 'cache')
            }[cmd];

            handlers.call(null, storeName);
        }
    });

    register.configure('config', (config, callback) => {
        config.plugins.push([
            '@calvin_von/proxy-plugin-inject',
            {
                optionsField: 'cache__inject'
            }
        ]);

        config['cache__inject'] = {
            rules: [
                {
                    test: /^\/$|.html?$/,
                    serves: {
                        'cache-switcher-ui.js': path.join(__dirname, 'switcher-ui', 'dist', 'cache-switcher-ui.js'),
                    },
                    template: `
                        <script src="{{cache-switcher-ui.js}}"></script>
                        <script>
                            window.addEventListener('load', function() {
                                new window.cacheSwitcherUI.default('${config.cache.ui.container}');
                            });
                        </script>
                    `,
                    insert: 'body'
                },
                {
                    test: /^\/$|.html?$/,
                    serves: {
                        'cache-switcher-ui.css': path.join(__dirname, 'switcher-ui', 'dist', 'cache-switcher-ui.css'),
                    },
                    template: `<link rel="stylesheet" href="{{cache-switcher-ui.css}}"></link>`,
                    insert: 'head'
                }
            ]
        };

        callback(null, config);
    });
};


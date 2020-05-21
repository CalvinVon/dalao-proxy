const chalk = require('chalk');
const mockCommand = require('./mock.command');
const cacheCommand = require('./cache.command');
const { cleanCache } = require('./subcommands/clean.command/clean');

module.exports = function (program, register, config) {
    mockCommand.call(this, program, register, config);
    cacheCommand.call(this, program, register, config);

    program.enableCollectData();

    register.addLineCommand('clr', 'clean', 'cacheclean');
    register.on('input', input => {
        let matched;
        if (matched = input.match(/\b(clr|clean|cacheclean)\b(?:\s(\S+))?/)) {
            const storeName = matched[2];
            cleanCache({
                config: config['cache'],
                options: {
                    storeName
                }
            });
            console.log(chalk.grey('[plugin-cache] cache files has been cleaned!\n'));
        }
    });
};


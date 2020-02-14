const { MockFileGenerator } = require('./mock');
const storeCommand = require('../subcommands/store.command');
const cleanCommand = require('../subcommands/clean.command');

module.exports = function MockCommand(program, register, config) {
    program
        .command('mock [method] [url]')
        .description('create a mock file in json format')
        .option('--js', 'use javascript file')
        .option('-t, --time <delayTime>', 'mock network transfer delay time')
        .option('-d, --dir <dirname>', 'use custom mock dirname')
        .forwardSubcommands(function (method, url) {
            const { dir, time } = this.context.options;
            if (dir) {
                config.mock.dirname = dir;
            }

            if (time) {
                this.context.options.js = true;
            }
            MockFileGenerator(method, url, this.context.options, config);
        })
        .use(function (command) {
            storeCommand(command, register, config, 'mock');
            cleanCommand(command, register, config, 'mock');
        })
}
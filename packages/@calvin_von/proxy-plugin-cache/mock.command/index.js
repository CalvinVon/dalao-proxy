const { MockFileGenerator } = require('./mock');
const storeCommand = require('../subcommands/store.command');
const cleanCommand = require('../subcommands/clean.command');
const changeCommand = require('../subcommands/change.command');

module.exports = function MockCommand(program, register, config) {
    const plugin = this;
    
    program
        .command('mock [method] [url]')
        .description('create a mock file in json extension')
        .option('-p, --program', 'use programable javascript file')
        .option('-t, --time <delayTime>', 'mock network transfer delay time')
        .option('-f, --function', 'use js mock file which exports function')
        .option('-d, --dir <dirname>', 'use custom mock dirname')
        .forwardSubcommands(function (method, url) {
            const { dir, time, function: useFunction } = this.context.options;
            if (dir) {
                config.mock.dirname = dir;
            }

            if (time || useFunction) {
                this.context.options.program = true;
            }
            MockFileGenerator(method, url, this.context.options, config);
        })
        .use(function (command) {
            storeCommand.call(plugin, command, register, config, 'mock');
            cleanCommand.call(plugin, command, register, config, 'mock');
            changeCommand.call(plugin, command, register, config, 'mock');
        });
}
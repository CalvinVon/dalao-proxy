const storeCommand = require('../subcommands/store.command');
const cleanCommand = require('../subcommands/clean.command');
const changeCommand = require('../subcommands/change.command');

module.exports = function CacheCommand(program, register, config) {
    const plugin = this;

    program
        .command('cache')
        .description('manage the cache files')
        .forwardSubcommands()
        .use(function (command) {
            storeCommand.call(plugin, command, register, config, 'cache');
            cleanCommand.call(plugin, command, register, config, 'cache');
            changeCommand.call(plugin, command, register, config, 'cache');
        })
}

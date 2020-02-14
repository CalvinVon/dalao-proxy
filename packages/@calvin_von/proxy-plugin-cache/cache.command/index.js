const storeCommand = require('../subcommands/store.command');
const cleanCommand = require('../subcommands/clean.command');

module.exports = function CacheCommand(program, register, config) {
    program
        .command('cache')
        .description('manage the cache files')
        .forwardSubcommands()
        .use(function (command) {
            storeCommand(command, register, config, 'cache');
            cleanCommand(command, register, config, 'cache');
        })
}

const storeCommand = require('./store.command');
const cleanCommand = require('./clean.command');

module.exports = function CacheCommand(program, register, config) {
    program
        .command('cache')
        .description('store the current cache files')
        .forwardSubcommands()
        .use(function (command) {
            storeCommand(command, register, config);
            cleanCommand(command, register, config);
        })
}

const {
    pluginInstallCommand,

} = require('./install.command');

module.exports = function pluginManagerCommand(program) {
    program
        .command('plugin')
        .description('plugin manager, list and view all plugins, install, remove or update plugins')
        .forwardSubcommands()
        .use(pluginInstallCommand)
};
const {
    pluginInstallCommand,
    
} = require('./install.command');

module.exports = function pluginManagerCommand(program) {
    program
        .command('plugin')
        .description('plugin manager, list and view all plugins, install, remove or update plugins')
        .forwardSubcommands()
        .action(function() {
            if (this.context.commandName === 'plugin') {
                this.help();
            }
        })
        .use(pluginInstallCommand)
};
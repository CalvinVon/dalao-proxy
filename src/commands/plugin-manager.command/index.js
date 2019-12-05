const installCommand = require('./install.command');
const listCommand = require('./list.command');
const viewCommand = require('./view.command');

module.exports = function pluginManagerCommand(program) {
    program
        .command('plugin')
        .description('plugin manager, list and view all plugins, install, remove or update plugins')
        .forwardSubcommands()
        .use(installCommand)
        .use(listCommand)
        .use(viewCommand)
};
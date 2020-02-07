const installCommand = require('./install.command');
const listCommand = require('./list.command');
const viewCommand = require('./view.command');
const configCommand = require('./config.command');
const createCommand = require('./create.command');

module.exports = function pluginManagerCommand(program) {
    program
        .command('plugin')
        .description('Plugins manager')
        .forwardSubcommands()
        .use(installCommand)
        .use(listCommand)
        .use(viewCommand)
        .use(configCommand)
        .use(createCommand)
};
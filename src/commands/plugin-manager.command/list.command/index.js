const { displayPluginTable } = require('./list-plugin');

module.exports = function pluginListCommand(pluginCommand) {
    pluginCommand
        .command('list')
        .description('list all installed plugins')
        .option('-g, --global', 'show plugins globally installed only')
        .option('-a, --all', 'show all table fields')
        .option('--midware', 'show middleware field')
        .option('--cmd', 'show command field')
        .option('--conf', 'show configure field')
        .action(function () {
            const plugins = this.context.plugins;
            const {
                global: isGlobal,
                all: showAll,
                midware: showMiddleware,
                cmd: showCommand,
                conf: showConfigure
            } = this.context.options;

            displayPluginTable(plugins, {
                isGlobal,
                showMiddleware: showMiddleware || showAll,
                showCommand: showCommand || showAll,
                showConfigure: showConfigure || showAll,
            });
        });
};
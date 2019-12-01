const { install, uninstall } = require('./install-plugin');

exports.pluginInstallCommand = function pluginInstallCommand(pluginCommand) {
    pluginCommand
        .command('install <name> [names...]')
        .alias('add', 'update')
        .description('install plugins to extends ability')
        .option('-D, --local', 'install plugin locally')
        .option('-g, --global', 'install plugin globally')
        .option('--before <plugin>', 'make it execute before the existed plugin')
        .option('--after <plugin>', 'make it execute after the existed plugin')
        .action(function (name, names) {
            const { local, global, before, after } = this.context.options;
            install([name, ...names], {
                isLocally: global ? false : local,
                before,
                after,
            });
        });

    pluginCommand
        .command('uninstall <name> [names...]')
        .alias('remove', 'rm')
        .description('uninstall plugins to extends ability')
        .option('-l, --local', 'install plugin locally')
        .option('-g, --global', 'install plugin globally')
        .action(function (name, names) {
            const { local, global } = this.context.options;
            uninstall([name, ...names], {
                isLocally: global ? false : local,
            });
        });

    pluginCommand
        .command('list')
        .description('list all installed plugins')
        .option('--global', 'show globally installed plugin only')
        .action(function () {
            console.log(this.context.plugins);
            process.exit(0);
        });
};
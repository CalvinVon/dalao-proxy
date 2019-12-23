const { install, uninstall } = require('./install-plugin');

module.exports = function pluginInstallCommand(pluginCommand) {
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
                callback(errCode) {
                    process.exit(errCode || 0);
                }
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
                callback(errCode) {
                    process.exit(errCode || 0);
                }
            });
        });
};
const { install, uninstall } = require('./install-plugin');

exports.pluginInstallCommand = function pluginInstallCommand(pluginCommand) {
    pluginCommand
        .command('install <name> [names...]')
        .alias('add', 'update')
        .description('install plugins to extends ability')
        .option('-l, --local', 'install plugin locally')
        .option('-g, --global', 'install plugin globally')
        .action(function (name, names) {
            const isLocally = this.context.options.local;
            console.log(name, names, isLocally);
            // process.exit(0);
            // install([name, ...names], isLocally);
        });

    pluginCommand
        .command('uninstall <name> [names...]')
        .alias('remove', 'rm')
        .description('uninstall plugins to extends ability')
        .option('-l, --local', 'install plugin locally')
        .option('-g, --global', 'install plugin globally')
        .action(function (name, names) {
            const isLocally = this.context.options.local;
            uninstall([name, ...names], isLocally);
        });
};
const AddPlugin = require('./add-plugin');

exports.pluginInstallCommand = function pluginInstallCommand(pluginCommand) {
    pluginCommand
        .command('install <name> [names...]')
        .alias('add')
        .description('install plugins to extends ability')
        .option('--local', 'install plugin locally')
        .option('--global', 'install plugin globally')
        .action(function (name, names) {
            process.exit(0);
        });
};
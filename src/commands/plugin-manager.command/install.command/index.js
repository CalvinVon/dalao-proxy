const AddPlugin = require('./add-plugin');

exports.pluginInstallCommand = function pluginInstallCommand(pluginCommand) {
    pluginCommand
        .command('install <pluginName>')
        .alias('add')
        .description('add plugin globally')
        .option('-d, --delete', 'delete plugin globally')
        .action(function (pluginName) {
            // AddPlugin(program, pluginName);
            console.log(pluginName)
        });
};
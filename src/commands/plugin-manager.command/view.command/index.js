const { displayViewPlugin } = require('./view-package');

module.exports = function pluginViewCommand(pluginCommand) {
    pluginCommand
        .command('view <package>')
        .description('view package and check plugin detail')
        .option('--registry <url>', 'override configuration registry')
        .action(function (package) {
            displayViewPlugin(package, this.context.plugins, this.context.options);
        });
};
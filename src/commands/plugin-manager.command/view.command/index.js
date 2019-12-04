const { viewPlugin } = require('./view-package');

module.exports = function pluginViewCommand(pluginCommand) {
    pluginCommand
        .command('view <package>')
        .description('view package and check plugin detail')
        .option('--registry <url>', 'override configuration registry')
        .action(function (package) {
            viewPlugin(package, this.context.options);
        });
};
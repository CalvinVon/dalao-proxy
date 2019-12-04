const { viewPackage } = require('./view-package');

module.exports = function pluginViewCommand(pluginCommand) {
    pluginCommand
        .command('view <package>')
        .description('view package and check plugin detail')
        .action(function (package) {
            viewPackage(package);
        });
};
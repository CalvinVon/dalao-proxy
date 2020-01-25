const createPlugin = require('./create');

module.exports = function (pluginCommand) {
    pluginCommand
        .command('create <pluginName> [distDir]')
        .description('create plugin folder under specific direct')
        .option('--configure', 'create a configure.js file to configure setting and parse user config of the plugin')
        .option('--commander', 'create a commander.js file to extend commands')
        .option('--complete', 'create a fully-functional plugin', true)
        .option('--simple', 'create a simply-functional plugin', false)
        .action(function (pluginName, distDir) {
            createPlugin(
                {
                    pluginName,
                    distDir,
                    ...this.context.options
                },
                () => {
                    process.exit(0);
                }
            );
        });
}
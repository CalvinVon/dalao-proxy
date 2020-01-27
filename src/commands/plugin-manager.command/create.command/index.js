const createPlugin = require('./create');

module.exports = function (pluginCommand) {
    pluginCommand
        .command('create <pluginName> [distDir]')
        .description('create plugin folder under specific direct')
        .option('--configure', 'create a configure.js file to configure setting and parse user config of the plugin')
        .option('--commander', 'create a commander.js file to extend commands')
        .option('--configure-only', 'create a configure.js file only')
        .option('--commander-only', 'create a commander.js file only')
        .option('--complete', 'create a fully-functional plugin', true)
        .option('--simple', 'create a simply-functional plugin', false)
        .option('-F, --force', 'overwrite files if already existed', false)
        .action(function (pluginName, distDir) {

            createPlugin({
                pluginName,
                distDir,
                ...this.context.options
            });
            process.exit(0);
        });
}
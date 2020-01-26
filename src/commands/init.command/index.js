const { generateConfigFile, generatePluginConfig } = require('./generate-config');

module.exports = function registerInitCommand(program) {
    program
        .command('init [plugin]')
        .description('create a config file in current folder. If a plugin name is given, then generate default config of the plugin')
        .option('--js', 'set the config file to javascript file', true)
        .option('-f, --force', 'Skip options and force generate default config file', false)
        .action(function (plugin) {
            const options = this.context.options;
            options.plugin = plugin;
            !options.config && (options.config = this.context.configPath);

            if (plugin) {
                generatePluginConfig(options, () => {
                    process.exit(0);
                });
            }
            else {
                generateConfigFile(options, () => {
                    process.exit(0);
                });
            }
        })
}
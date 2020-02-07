const { generateConfigFile, generatePluginConfig } = require('./generate-config');

module.exports = function registerInitCommand(program) {
    program
        .command('init [plugin]')
        .description('Create a config file in the current folder.\nProvide a specific plugin name to generate the default plugin config.')
        .option('--js', 'generate javascript file', true)
        .option('--json', 'generate json file', false)
        .option('-f, --force', 'Skip options and force generate default config file', false)
        .action(function (plugin) {
            const options = this.context.options;
            options.plugin = plugin;
            options.js = options.json ? false : true;
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
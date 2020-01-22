const chalk = require('chalk');
const getPluginConfig = require('./get-plugin-config');

module.exports = function configCommand(pluginCommand) {
    pluginCommand
        .command('config [pluginName]')
        .description('check the config of installed plugin')
        .action(function (pluginName) {
            getPluginConfig.call(this, pluginName, configObject => {

                if (pluginName) {
                    console.log('Plugin ' + chalk.underline.yellow(pluginName + ':') + '\n');
                }
                else {
                    console.log(chalk.underline.yellow('Dalao proxy ') + '\n');
                }
                console.log(chalk.yellow('* Default config:'));
                console.log(JSON.stringify(configObject.defaultConfig, null, 4));
                console.log();
                console.log(chalk.yellow('* Current config: '));
                console.log(JSON.stringify(configObject.config, null, 4));
                process.exit(0);
            });
        });
};
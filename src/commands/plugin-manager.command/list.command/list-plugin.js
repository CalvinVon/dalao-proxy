const chalk = require('chalk');
const Table = require('cli-table');
const findExtendedCommand = require('./find-extended-command');

exports.listPlugins = function (runtimePlugins, options) {
    const {
        isGlobal, showDescription, showMiddleware, showCommand, showConfigure
    } = options || {};

    const enabledEmoji = '✔️';
    const disabledEmoji = '❌';

    const table = new Table({
        head: [
            [true, chalk.yellow('Plugin ID')],
            [true, chalk.white('Version')],
            [showDescription, chalk.white('Description')],
            [showMiddleware, chalk.yellow('Middlewares\nimplemented')],
            [showCommand, chalk.yellow('Commands\nextended')],
            [showConfigure, chalk.white('Config options')],
            [true, chalk.yellow('Enabled')]
        ]
            .map(([flag, text]) => flag && text)
            .filter(Boolean)
    });

    let plugins = runtimePlugins;

    if (isGlobal) {
        const baseConfigFilePath = require('path').join(__dirname, '../../../../config/index.js');
        const config = require(baseConfigFilePath);
        plugins = runtimePlugins.filter(plugin => config.plugins.some(name => plugin.id === name));
    }

    // console.log(runtimePlugins);

    plugins.forEach(plugin => {
        function wrapper([flag, output = '-']) {
            if (flag) {
                if (plugin.meta.error) {
                    return disabledEmoji + '  ' + plugin.meta.error.code
                }
                else {
                    return output;
                }
            }
            else {
                return null;
            }
        }


        const data = [
            // version
            [true, plugin.meta.version],


            // Description
            [showDescription, isBuildIn(plugin) ? '📦  Build-in plugin' : plugin.meta.description],

            // Middlewares implemented
            [showMiddleware, Object.keys(plugin.middleware).join('\n')],

            // Commands extended
            [showCommand, displayCommands(plugin)],

            // Config options
            [showConfigure, (plugin.config || {}).toString()],

            // Enabled
            [true, plugin.meta.enabled ? enabledEmoji : disabledEmoji]
        ]
            .map(wrapper)
            .filter(Boolean);

        data.unshift(
            // Plugin ID
            isBuildIn(plugin) ? plugin.id.replace('BuildIn:plugin/', '') : plugin.id,
        );
        table.push(data)
    });

    console.log(table.toString());
    process.exit(0);
}



function isBuildIn(plugin) {
    return plugin.meta.isBuildIn;
}

function displayCommands(plugin) {
    if (plugin.commander) {
        const { commands, configure, on } = findExtendedCommand(plugin.commander);
        let output = '';
        if (commands.length) {
            output += chalk.yellow('Commands: ') + commands.join(', ') + '\n';
        }
        if (configure.length) {
            output += chalk.yellow('Configure: ') + configure.join(', ') + '\n';
        }
        if (on.length) {
            output += chalk.yellow('Listeners: ') + on.join(', ') + '\n';
        }

        return output;
    }
}
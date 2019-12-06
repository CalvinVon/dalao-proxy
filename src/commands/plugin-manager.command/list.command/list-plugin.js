const chalk = require('chalk');
const Table = require('cli-table');
const { Plugin } = require('../../../plugin');
const findExtendedCommand = require('../find-extended-command');

/**
 * Analysis single plugin detail
 * @param {Plugin} plugin 
 * @returns {PluginDetail}
 */
function analysisPlugin(plugin) {
    return {
        instance: plugin,
        id: isBuildIn(plugin) ? plugin.id.replace('BuildIn:plugin/', '') : plugin.id,
        version: plugin.meta.version,
        description: isBuildIn(plugin) ? '📦  Build-in plugin' : plugin.meta.description,
        middlewares: Object.keys(plugin.middleware).filter(it => Plugin.AllMiddlewares.some(m => m === it)),
        commands: plugin.commander ? findExtendedCommand(plugin.commander) : null,
        configure: Plugin.resolveSetting(plugin),
        enabled: plugin.meta.enabled
    }
}

/**
 * Analysis plugins list
 * @param {Array<Plugin>} runtimePlugins
 * @param {Object} options
 * @returns {Array<PluginDetail>}
 */
function analysisPluginList(runtimePlugins, options) {
    const { isGlobal } = options || {};

    let plugins = runtimePlugins;

    if (isGlobal) {
        const baseConfigFilePath = require('path').join(__dirname, '../../../../config/index.js');
        const config = require(baseConfigFilePath);
        plugins = runtimePlugins.filter(plugin => config.plugins.some(name => plugin.id === name));
    }


    const analyzedPluginList = [];
    plugins.forEach(plugin => {
        analyzedPluginList.push(analysisPlugin(plugin));
    });

    return analyzedPluginList;
};


/**
 * Display analysis plugins list for CLI
 * @param {Array<Plugin>} runtimePlugins
 * @param {Object} options
 */
function displayPluginTable(runtimePlugins, options) {
    const analyzedPluginList = analysisPluginList(runtimePlugins, options);

    const {
        showMiddleware, showCommand, showConfigure
    } = options || {};

    const displayEmpty = '-';
    const enabledEmoji = '✔️';
    const disabledEmoji = '❌';

    const table = new Table({
        head: [
            [true, chalk.yellow('Plugin ID')],
            [true, chalk.white('Version')],
            [true, chalk.white('Description')],
            [showMiddleware, chalk.yellow('Middlewares\nimplemented')],
            [showCommand, chalk.yellow('Commands\nextended')],
            [showConfigure, chalk.white('Configure')],
            [true, chalk.yellow('Enabled')]
        ]
            .map(([flag, text]) => flag && text)
            .filter(Boolean),
        style: {
            compact: true
        }
    });


    analyzedPluginList.forEach(analyzedPlugin => {
        function wrapper([flag, output = '-']) {
            if (flag) {
                const error = analyzedPlugin.instance.meta.error;
                if (error) {
                    return disabledEmoji + '  ' + error.code
                }
                else {
                    return output;
                }
            }
            else {
                return null;
            }
        }

        table.push([
            // ID
            [true, analyzedPlugin.id],
            // version
            [true, analyzedPlugin.version],
            // Description
            [true, analyzedPlugin.description || displayEmpty],
            // Middlewares implemented
            [showMiddleware, analyzedPlugin.middlewares.join('\n') || displayEmpty],
            // Commands extended
            [showCommand, displayCommands(analyzedPlugin) || displayEmpty],
            // Config options
            [showConfigure, displayConfigure(analyzedPlugin) || displayEmpty],
            // Enabled
            [true, analyzedPlugin.enabled ? enabledEmoji : disabledEmoji]
        ]
            .map(wrapper)
            .filter(Boolean))
    });

    console.log(table.toString());
    process.exit(0);
};



function isBuildIn(plugin) {
    return plugin.meta.isBuildIn;
}

function displayCommands(pluginDetail) {
    if (pluginDetail.commands) {
        const { commands, configure, on } = pluginDetail.commands || {};
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

function displayConfigure({ configure }) {
    let output = '';
    Object.keys(configure || {}).forEach(key => {
        output += chalk.yellow(key + ': ') + configure[key] + '\n';
    });
    return output;
}


module.exports = {
    analysisPlugin,
    analysisPluginList,
    displayPluginTable
}
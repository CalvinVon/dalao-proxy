const { Plugin, register } = require('../../../plugin');

module.exports = function getPluginConfig(pluginName, cb) {
    if (pluginName) {
        const plugin = new Plugin(pluginName, this.context);
        cb({
            config: plugin.config,
            defaultConfig: plugin.parser({})
        });
    }
    else {
        register.on('context:config', value => {
            cb({
                config: value,
                defaultConfig: this.context.defaultConfig,
            });
        });
    }
}
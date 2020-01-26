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
        register.configure('config', (value, next) => {
            next(value);

            cb({
                config: value,
                defaultConfig: this.context.defaultConfig,
            });
        });
    }
}
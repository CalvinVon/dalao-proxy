const CheckVersion = require('./check-version');

module.exports = {
    beforeCreate() {
        const plugins = this.context.plugins;
        CheckVersion.checkCoreUpdate();
        CheckVersion.checkAllPluginsUpdate(plugins);
    }
};
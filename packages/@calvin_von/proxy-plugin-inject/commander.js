module.exports = function (program, register, pluginConfig) {
    if (!pluginConfig.enable || !Array.isArray(pluginConfig.rules)) {
        return;
    }
    // collect proxy rule
    const proxyRules = {};

    pluginConfig.rules.forEach(rule => {
        if (rule.proxy && typeof (rule.proxy) === 'object') {
            Object.assign(proxyRules, rule.proxy);
        }
    });


    if (Object.keys(proxyRules).length) {
        register.configure("config:process", (config, callback) => {
            Object.assign(config.proxyTable, proxyRules);
            callback(null, config)
        });
    }


}
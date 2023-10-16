const defaultConfig = {
    /**
     * should check all installed plugins
     */
    checkPlugins: true,
    /**
     * disabled plugins list
     */
    blackList: []
};


module.exports = {
    setting() {
        return {
            optionsField: 'check',
            defaultEnable: true
        }
    },
    parser(rawConfig) {
        return {
            ...defaultConfig,
            ...(rawConfig || {})
        }
    }
};

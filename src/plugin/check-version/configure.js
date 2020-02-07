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
            optionsField: 'check'
        }
    },
    parser(rawConfig) {
        return {
            ...defaultConfig,
            ...(rawConfig || {})
        }
    }
};

const defaults = {
    rules: []
};

module.exports = {
    setting() {
        return {
            optionsField: 'redirect'
        }
    },

    parser(rawConfig) {
        return {
            ...defaults,
            ...(rawConfig || {})
        };
    }
}
const defaultOptions = {
    open: true,
    cleanOnRestart: false,
    disableLogger: true,
    maxRecords: 100,
    editor: 'code'
};

function setting() {
    return {
        defaultEnable: true,
        optionsField: 'monitor',
        enableField: 'enable',
    }
}

function parser(rawUserConfig) {
    if (rawUserConfig && typeof rawUserConfig === 'object') {
        return {
            ...defaultOptions,
            ...rawUserConfig
        }
    }
    else {
        return defaultOptions;
    }
}

module.exports = {
    setting,
    parser
};
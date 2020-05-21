const defaultOptions = {
    route: '/statics',
    root: process.cwd(),
    serveOptions: {},
};

function setting(pluginSetting) {
    return {
        defaultEnable: true,
        optionsField: 'serve',
        enableField: 'enable',
        ...(pluginSetting || {})
    }
}

function parser(rawUserConfig) {
    return {
        ...defaultOptions,
        ...(rawUserConfig || {})
    };
}

module.exports = {
    setting,
    parser
};

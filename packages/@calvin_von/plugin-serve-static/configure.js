const defaultOptions = {
    route: '/statics',
    root: process.cwd(),
    serveOptions: {},
};

function setting(pluginSetting) {
    console.log('I am loaded', pluginSetting)
    return {
        defaultEnable: true,
        optionsField: 'serve',
        enableField: 'enable',
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

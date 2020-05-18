const defaultOptions = {
    route: '/statics',
    root: process.cwd(),
    serveOptions: {},
};

function setting() {
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

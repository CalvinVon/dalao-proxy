const defaultOptions = {
    commands: ['npm start'],
    render: {
        compensate: 0
    }
};

function setting() {
    return {
        defaultEnable: true,
        optionsField: 'run',
        enableField: 'enable',
    }
}

function parser(rawUserConfig) {
    if (rawUserConfig) {
        const { commands, render } = rawUserConfig;
        return {
            commands: Array.isArray(commands)
                ? commands
                : defaultOptions.commands
            ,
            render: typeof (render) === 'object'
                ? { ...defaultOptions.render, ...render }
                : defaultOptions.render
        };
    }
    return defaultOptions;
}

module.exports = {
    setting,
    parser
};

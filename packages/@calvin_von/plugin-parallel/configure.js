const defaultOptions = {
    commands: ['npm start']
};

function setting() {
    return {
        defaultEnable: true,
        optionsField: 'run',
        enableField: 'enable',
    }
}

function parser(rawUserConfig) {
    if (rawUserConfig && Array.isArray(rawUserConfig.commands)) {
        return {
            commands: rawUserConfig.commands
        };
    }
    return defaultOptions;
}

module.exports = {
    setting,
    parser
};

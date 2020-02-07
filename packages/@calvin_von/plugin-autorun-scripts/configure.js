const defaultOptions = {
    scripts: ['start']
};

function setting() {
    return {
        optionsField: 'autorun'
    };
}

function parser(userOptions) {
    if (userOptions && typeof userOptions === 'object') {
        return { ...defaultOptions, ...userOptions };
    }
    else {
        return defaultOptions;
    }
}


module.exports = {
    setting,
    parser
}
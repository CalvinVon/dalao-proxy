const defaultOptions = {
    scripts: ['start']
};

function configureSetting() {
    return {
        userOptionsField: 'autorun'
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
    configureSetting,
    parser
}
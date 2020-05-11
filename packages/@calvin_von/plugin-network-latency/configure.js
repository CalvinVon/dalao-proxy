const defaultOptions = {
    // test work url
    test: /\//,
    include: [],
    exclude: [],
    // simulate network latency time
    time: 0,
    // simulate network latency when request to real server
    request: false,
    // simulate network latency when respond to client side
    response: true
};

function setting() {
    return {
        defaultEnable: true,
        optionsField: 'latency',
        enableField: 'enable',
    }
}

function parser(rawUserConfig) {
    return {
        ...defaultOptions,
        ...rawUserConfig
    };
}

module.exports = {
    setting,
    parser
};

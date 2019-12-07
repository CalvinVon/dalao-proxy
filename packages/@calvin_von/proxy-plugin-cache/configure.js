const defaultOptions = {
    "dirname": ".dalao-cache",
    "contentType": [
        "application/json"
    ],
    "maxAge": [
        0,
        "second"
    ],
    "filters": [
        {
            "where": "header",
            "field": "code",
            "value": 200
        }
    ],
};



/**
 * Configure plugin setting
 * @description Define plugin configuration field in config file.
 */
function configureSetting() {
    return {
        defaultEnable: true,
        userOptionsField: 'cache',
        configureEnableField: 'enable',
    };
}


/**
 * Parser raw config
 * @description The first parameter passed in depends on the field configureSetting.configField,
 *              the second parameter is the whole raw config object.
 */
function parser(cacheOptions) {
    if (cacheOptions && typeof cacheOptions === 'object') {
        return Object.assign({}, defaultOptions, cacheOptions);
    }
    else {
        return defaultOptions;
    }
}

module.exports = {
    configureSetting,
    parser
};
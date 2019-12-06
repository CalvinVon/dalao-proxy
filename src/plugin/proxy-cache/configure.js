const defaultOptions = {
    enable: true,
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
function parser(cacheOptions, rawConfig) {
    if (cacheOptions && typeof cacheOptions === 'object') {
        return {
            ...cacheOptions,
            appendField: 'configurable'
        }
    }
    else {
        return defaultOptions;
    }
}

module.exports = {
    configureSetting,
    parser
};
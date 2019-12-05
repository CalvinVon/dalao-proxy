
/**
 * Configure plugin setting
 * @description Return an object that includes extra config field
 */
function configureSetting() {
    return {
        enable: true,
        configField: 'cache'
    };
}


/**
 * Parser raw config
 * @description The first parameter passed in depends on the field configureSetting.configField,
 *              the second parameter is the whole raw config object.
 */
function parser(isCache, rawConfig) {
    return {
        cache: isCache,
        appendField: 'configurable'
    }
}

module.exports = {
    configureSetting,
    parser
};
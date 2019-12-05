
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

module.exports = {
    configureSetting,
    mergeConfig() {

    }
};
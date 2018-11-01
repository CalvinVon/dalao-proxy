exports.custom_assign = function (objValue, srcValue) {
    return !srcValue ? objValue : srcValue;
}

/**
 * url path deep compare
 * @param {Number} order
 * @return {Function} compare function
 */
exports.pathCompareFactory = function (order) {
    return function (prev, curr) {
        const prev_dep = prev.match(/(\/)/g).length;
        const curr_dep = curr.match(/(\/)/g).length;
    
        if (prev_dep === curr_dep) {
            return (prev.length - curr.length) * order;
        }
        else {
            return (prev_dep - curr_dep) * order;
        }
    }
}
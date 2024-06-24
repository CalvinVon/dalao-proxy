const { getIPv4Address } = require('../src/utils');

const defaults = {
    route: {
        hostRewrite: {
            '{{host}}': getIPv4Address()
        }
    }
};

module.exports = defaults;

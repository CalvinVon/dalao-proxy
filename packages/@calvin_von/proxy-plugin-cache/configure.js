const chalk = require('chalk');

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
    if (isType(cacheOptions, 'Object')) {
        return Object.assign({}, defaultOptions, cacheOptions, {
            contentType: parseContentType(cacheOptions.contentType),
            maxAge: parseMaxAge(cacheOptions.maxAge),
            filters: parserFilters(cacheOptions.filters)
        });
    }
    else {
        return defaultOptions;
    }
}

function parseContentType(value) {
    if (isType(value, 'Array')) {
        return cacheOptions.contentType;
    }
    else {
        configWarn('type of field `cache.contentType` should be Array');
        return defaultOptions.contentType;
    }
}

function parseMaxAge(value) {
    let maxAge = [];
    if (isType(value, 'Array')) {
        if (Number.isNaN(Number(value[0]))) {
            configWarn('type of field `cache.maxAge[0]` should be Number');
            maxAge[0] = defaultOptions.maxAge[0];
        }
        else {
            maxAge[0] = value[0];
        }

        if (!/^(s(econds?)?|m(inutes?)?|h(ours?)?|d(ays?)?|M(onths?)?|y(ears?)?)$/.test(value[1])) {
            configWarn('value of field `cache.maxAge[1]` should match `/^(s(econds?)?|m(inutes?)?|h(ours?)?|d(ays?)?|M(onths?)?|y(ears?)?)$/`');
            maxAge[1] = defaultOptions.maxAge[1];
        }
        else {
            maxAge[1] = value[1];
        }
    }
    else {
        configWarn('type of field `cache.maxAge` should be Array');
        maxAge = defaultOptions.maxAge;
    }
    return maxAge;
}

function parserFilters(value) {
    let filters;
    if (isType(value, 'Array')) {
        filters = value
            .map(item => {
                if (!/^(header|body)$/.test(item.where)) {
                    configWarn('value of `cache.filters.where` should be `header` or `body`');
                    item._disabled = true;
                }
                return item;
            })
            .filter(item => !item._disabled)
    }
    else {
        configWarn('type of field `cache.filters` should be Array');
        filters = defaultOptions.filters;
    }


    return filters;
}


function isType(value, type) {
    return Object.prototype.toString.call(value) === `[object ${type}]`;
}

function configWarn(message) {
    console.warn(chalk.red('[Plugin cache]: ' + message));
}

module.exports = {
    configureSetting,
    parser
};
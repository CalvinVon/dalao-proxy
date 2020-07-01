const chalk = require('chalk');

const cacheDefaults = {
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
            /**
             * filter when request or response
             * Options: `response`, `request`
             */
            when: "response",
            /**
             * filter by response body or header
             * Options: `status`, `data`, `header` for `response`
             * Options: `body`, `query`, `header` for `request`
             */
            where: "status",
            /**
             * filter field
             */
            field: null,
            /**
             * filter field value
             */
            value: 200,
            /**
             * custom filter function
             * @return Boolean
             */
            custom: null,
            /**
             * filter applied to specific route
             */
            applyRoute: "*"
        }
    ],
    "logger": true
};

const mockDefaults = {
    "dirname": "mocks",
    "prefix": "",
    "cors": true,
    "enable": true
};

const cacheUiDefaults = {
    enable: true,
    container: '#app'
};




/**
 * Configure plugin setting
 * @description Define plugin configuration field in config file.
 */
function setting() {
    return {
        defaultEnable: true,
        optionsField: ['cache', 'mock', 'cache-ui'],
        enableField: 'enable',
    };
}


/**
 * Parser raw cache options
 * @param {any} cacheOptions
 */
function cacheParser(cacheOptions) {
    if (isType(cacheOptions, 'Object')) {
        return {
            ...cacheDefaults,
            ...cacheOptions,
            contentType: parseContentType(cacheOptions.contentType),
            maxAge: parseMaxAge(cacheOptions.maxAge),
            filters: parseFilters(cacheOptions.filters),
            dirname: parseCacheDirname(cacheOptions.dirname),
        };
    }
    else {
        return cacheDefaults;
    }
}

/**
 * Parser raw mock options
 * @param {any} mockOptions
 */
function mockParser(mockOptions) {
    if (mockOptions) {
        return {
            prefix: parsePrefix(mockOptions.prefix),
            dirname: parseMockDirname(mockOptions.dirname),
            enable: typeof mockOptions.enable === 'undefined' ? mockDefaults.enable : mockOptions.enable,
            cors: typeof mockOptions.cors === 'undefined' ? mockDefaults.cors : mockOptions.cors,
        };
    }
    else {
        return mockDefaults;
    }
}

function parseContentType(value) {
    return makeSureFieldType(cacheDefaults, 'contentType', 'Array', value);
}

function parseMaxAge(value) {
    let maxAge = [];
    if (isType(value, 'Array')) {
        if (value[0] !== '*' && Number.isNaN(Number(value[0]))) {
            configWarn('type of field `cache.maxAge[0]` should be Number');
            maxAge[0] = cacheDefaults.maxAge[0];
        }
        else {
            maxAge[0] = value[0];
        }

        if (!/^(s(econds?)?|m(inutes?)?|h(ours?)?|d(ays?)?|M(onths?)?|y(ears?)?)$/.test(value[1])) {
            configWarn('value of field `cache.maxAge[1]` should match `/^(s(econds?)?|m(inutes?)?|h(ours?)?|d(ays?)?|M(onths?)?|y(ears?)?)$/`');
            maxAge[1] = cacheDefaults.maxAge[1];
        }
        else {
            maxAge[1] = value[1];
        }
    }
    else {
        if (value) {
            configWarn('type of field `cache.maxAge` should be Array');
        }
        maxAge = cacheDefaults.maxAge;
    }
    return maxAge;
}

function parseFilters(value) {
    let filters;
    if (isType(value, 'Array')) {
        filters = value
            .map((item, index) => {
                if (item.custom) {
                    if (!isType(item.custom, 'Function')) {
                        configWarn(`type of \`cache.filters[${index}].custom\` should be \`Function\``);
                        item.custom = null;
                    }
                    else {
                        return Object.assign({
                            field: null,
                            value: null,
                            custom: null,
                            applyRoute: '*'
                        }, item);
                    }
                }

                if (item.when === 'request') {
                    if (!/^(header|body|query)$/.test(item.where)) {
                        configWarn(`value of \`cache.filters[${index}].where\` should be \`header\`, \`body\` or \`query\` when \`filter.when\` is \`request\``);
                        item._disabled = true;
                    }
                }
                else if (item.when === 'response') {
                    if (!/^(header|data|status)$/.test(item.where)) {
                        configWarn(`value of \`cache.filters[${index}].where\` should be \`header\`, \`status\` or \`data\` when \`filter.when\` is \`response\``);
                        item._disabled = true;
                    }
                }
                else {
                    configWarn(`value of \`cache.filters[${index}].when\` should be \`request\` or \`response\``);
                    item._disabled = true;
                }

                if (item.applyRoute) {
                    if (!isType(item.applyRoute, 'String')) {
                        configWarn(`type of \`cache.filters[${index}].applyRoute\` should be \`String\``);
                        item.applyRoute = '*';
                    }
                }
                return Object.assign({
                    field: null,
                    value: null,
                    custom: null,
                    applyRoute: '*'
                }, item);
            })
            .filter(item => !item._disabled)
    }
    else {
        if (value) {
            configWarn('type of field `cache.filters` should be Array');
        }
        filters = cacheDefaults.filters;
    }


    return filters;
}

function parsePrefix(value) {
    return makeSureFieldType(mockDefaults, 'prefix', 'String', value, () => {
        if (value && value[0] !== '/') {
            configWarn('`mock.prefix` must start with `/`');
            return mockDefaults.prefix;
        }
        return value;
    });
}

function parseCacheDirname(value) {
    return makeSureFieldType(cacheDefaults, 'dirname', 'String', value);
}

function parseMockDirname(value) {
    if (isType(value, 'String')) {
        return value;
    }
    else {
        if (value) {
            configWarn(`type of field \`mock.dirname\` should be ${type}`)
        }
        return mockDefaults.dirname;
    }
}


function isType(value, type) {
    return Object.prototype.toString.call(value) === `[object ${type}]`;
}


function makeSureFieldType(source, field, type, value, callback) {
    if (isType(value, type)) {
        if (callback) {
            return callback();
        }
        else {
            return value;
        }
    }
    else {
        if (value) {
            configWarn(`type of field \`cache.${field}\` should be ${type}`)
        }
        return source[field];
    }
}

function configWarn(message) {
    console.warn(chalk.red('[Plugin cache]: ' + message));
}

module.exports = {
    setting,
    parser(cacheOptions, mockOptions, uiOptions) {
        return {
            cache: cacheParser(cacheOptions),
            mock: mockParser(mockOptions),
            ui: {
                ...cacheUiDefaults,
                ...(uiOptions || {})
            }
        };
    }
};
const version = require('../package.json').version;

const config = {
    version: version,
    "configFilename": "dalao.config.json",
    // "cacheDirname": ".dalao-cache",
    "watch": true,
    "host": "localhost",
    "port": 8000,
    "target": "target.example.com",
    // "cache": false,
    "cache": {
        "enable": true,
        "dirname": ".dalao-cache",
        "contentType": [
            "application/json"
        ],
        "maxAge": [
            "second",
            0
        ],
        "filters": [
            {
                "when": "response",
                "by": "header",
                "field": "code",
                "value": 200
            }
        ],
    },
    // "cacheContentType": [
    //     "application/json"
    // ],
    // "cacheMaxAge": [
    //     "second",
    //     0
    // ],
    // "responseFilter": [],
    "info": true,
    "debug": false,
    "headers": {},
    "proxyTable": {
        "/": {
            "path": "/"
        }
    },
    "plugins": [
        "BuildIn:plugin/proxy-cache",
        "BuildIn:plugin/check-version"
    ]
};
module.exports = config;
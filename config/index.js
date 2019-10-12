const version = require('../package.json').version;

const config = {
    version: version,
    "configFilename": "dalao.config.json",
    "info": true,
    "debug": false,
    "watch": true,
    "host": "localhost",
    "port": 8000,
    "target": "target.example.com",
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
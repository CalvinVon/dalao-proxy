const version = require('../package.json').version;

const config = {
    version: version,
    "configFileName": "dalao.config",
    "info": true,
    "debug": false,
    "watch": true,
    "host": "localhost",
    "port": 8000,
    "target": "target.example.com",
    "headers": {},
    "proxyTable": {
        "/": {
            "path": "/"
        }
    },
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
    "plugins": [
        "BuildIn:plugin/proxy-cache",
        "BuildIn:plugin/check-version"
    ]
};
module.exports = config;
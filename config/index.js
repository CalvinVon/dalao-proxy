const config = {
    "version": "0.9.9",
    "configFilename": "dalao.config.json",
    "cacheDirname": ".dalao-cache",
    "watch": true,
    "host": "localhost",
    "port": 8000,
    "target": "target.example.com",
    "cache": false,
    "cacheContentType": [
        "application/json"
    ],
    "cacheMaxAge": [
        "second",
        0
    ],
    "responseFilter": [
        "code",
        200
    ],
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
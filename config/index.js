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
    "plugins": [
        "BuildIn:plugin/check-version",
        "@calvin_von/proxy-plugin-cache",
    ]
};
module.exports = config;
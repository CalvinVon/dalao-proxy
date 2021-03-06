const version = require('../package.json').version;

const config = {
    version: version,
    "configFileName": "dalao.config",
    "logger": true,
    "debug": false,
    "watch": true,
    "host": "localhost",
    "port": 8000,
    "target": "target.example.com",
    "changeOrigin": true,
    "headers": {},
    "proxyTable": {
        "/": {
            "path": "/",
            "changeOrigin": true,
        }
    },
    "plugins": [
        "BuildIn:plugin/check-version"
    ]
};
module.exports = config;
const config = {
    "version": "1.0.0-beta.1",
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
            "changeOrigin": true
        }
    },
    "plugins": [
        "BuildIn:plugin/check-version",
    ]
};
module.exports = config;
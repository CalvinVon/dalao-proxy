const config = {
    version: '0.6.0-beta',
    // custom config file path
    configFilename: 'dalao.config.json',
    cacheDirname: '.dalao-cache',
    watch: true,
    // proxy server
    host: 'localhost',
    port: 8000,
    // target(for proxy)
    target: 'target.example.com',
    // request
    cache: false,
    cacheContentType: [
        "application/json"
    ],
    // max cache time: [`time unit`, `digit`]
    // if `digit` set to 0, permanently valid
    cacheMaxAge: ['second', 10],
    // response cache filter: [`path`, `value`]
    // e.g. ['code', 200]
    // empty array means do no filtering
    responseFilter: ['code', 200],
    info: false,
    // extra
    headers: {
    },
    proxyTable: {
        "/": {
            path: "/"
        }
    }
};

module.exports = config;
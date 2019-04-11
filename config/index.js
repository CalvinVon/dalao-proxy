const config = {
    version: '0.3.2',
    // custom config file path
    configFilename: 'dalao.config.json',
    cacheDirname: '.dalao-cache',
    watch: true,
    // proxy server
    host: 'localhost',
    port: 80,
    // target(for proxy)
    target: 'target.example.com',
    static: "static.example.com",
    rewrite: false,
    // request
    cache: false,
    // max cache time: [`time unit`, `digit`]
    cacheMaxAge: ['minute', 2],
    // response cache filter: [`path`, `value`]
    // e.g. ['code', 200]
    // empty array means do no filtering
    responseFilter: [],
    info: false,
    // extra
    headers: {
        'Access-Control-Expose-Headers': 'X-My-Custom-Header, X-Another-Custom-Header',
        'Access-Control-Max-Age': '3600',
    },
    // proxy routes
    emptyRoutes: false,    // enempty table
    proxyTable: {
        "/": {
            path: "/"
        }
    }
};

module.exports = config;
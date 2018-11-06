const config = {
    version: '0.3.0',
    // custom config file path
    configFilename: 'dalao.config.json',
    cacheDirname: '.dalao-cache',
    watch: true,
    // proxy server
    host: 'localhost',
    port: 80,
    // target(proxy for)
    target: 'target.example.com',
    static: "static.example.com",
    rewrite: false,
    // request
    cache: false,
    // response code path, response code
    // response data can be cached only while passing the filter test
    responseFilter: ['code', 0],
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
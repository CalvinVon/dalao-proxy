const config = {
    version: '0.1.3',
    // custom config file path
    configFilename: 'dalao.config.json',
    watch: true,
    // proxy server
    host: 'localhost',
    port: 80,
    // target(proxy for)
    target: 'target.example.com',
    rewrite: false,
    // request
    cache: false,
    info: false,
    // extra
    headers: {
        'Via': 'HTTP/1.1 dalao-proxy',
    },
    // proxy routes
    emptyRoutes: false,    // enempty table
    proxyTable: {
        "/": {
            path: "/",
            rewrite: false
        }
    }
};

module.exports = config;
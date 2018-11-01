const config = {
    version: '0.2.0',
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
        'Access-Control-Expose-Headers': 'X-My-Custom-Header, X-Another-Custom-Header',
        'Access-Control-Max-Age': '3600',
    },
    // proxy routes
    emptyRoutes: false,    // enempty table
    proxyTable: {
    }
};

module.exports = config;
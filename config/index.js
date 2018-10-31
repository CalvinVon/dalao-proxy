const config = {
    version: '0.0.1',
    // custom config file path
    configFilename: 'dalao.json',
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
    proxyTable: {
        "/": {
            path: "/"
        }
    }
};

module.exports = config;
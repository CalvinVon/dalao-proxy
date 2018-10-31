module.exports = {
    version: '0.0.1',
    // custom config file path
    configFilename: 'dalao.json',
    watch: true,
    // proxy server
    host: 'host.dalao.com',
    port: 80,
    // target(proxy for)
    target: 'target.example.com',
    // request
    cache: false,
    changeOrign: true,
    info: false,
    // extra
    headers: {
        'Via': 'HTTP/1.1 dalao-proxy',
    },
    proxyTable: {
        '**': {
            path: '/'
        }
    }
}
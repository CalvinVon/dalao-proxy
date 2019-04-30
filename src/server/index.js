const http = require('http');
const dalaoProxy = require('./core');

// attach server to port
function attachServerListener(server, config) {
    let { host, port } = config;

    server.on('listening', function () {
        console.log('\n> dalao has setup the Proxy for you 🚀'.green);
        console.log('> 😇  dalao is listening at 👉  ' + `http://${host}:${port}`.green);
        console.log('  You can enter `rs`,`restart`,`reload` to reload server anytime.'.gray);
        console.log('  You can enter `clean`,`cacheclr`,`cacheclean` to clean cached ajax data.'.gray);
    });

    server.on('error', function (err) {
        server.close();
        if (/listen EACCES/.test(err.message)) {
            console.error(`  Try listening port ${port} failed with code ${err.code}, please change anther port`.red);
            console.error(err);
        }
        else if (/EADDRINUSE/i.test(err.message)) {
            console.log(`  Port ${port} is in use, dalao is trying to change port to ${++port}`.grey);
            server.listen(port, host);
        }
        else {
            console.error(err);
        }
    });

    server.listen(port, host);
}

function createProxyServer(config) {

    // use plugins
    dalaoProxy.usePlugins(config.plugins);

    // create server
    const server = http.createServer(dalaoProxy.httpCallback(config));

    // attach server to port
    attachServerListener(server, config);

    return server;
}

module.exports = {
    createProxyServer
};
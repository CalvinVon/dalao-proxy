const chalk = require('chalk');
const http = require('http');
const URL = require('url').URL;
const dalaoProxy = require('./core');
const { getIPv4Address } = require('../utils');
const register = require('../plugin').register;

// attach server to port
function attachServerListener(program, server, config) {
    let { host, port } = config;

    server.on('listening', function () {
        const networkIp = getIPv4Address();

        const localAddress = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
        const networkAddress = networkIp ? `http://${networkIp}:${port}` : 'unavailable';

        server.address = {
            local: new URL(localAddress),
            network: networkIp ? new URL(networkAddress) : null,
        };

        // trigger field `server`
        register._trigger('server', server, value => {
            program.context.server = value;
        });
        
        config.port = port;
        console.log(chalk.green('\n> dalao has setup the Proxy for you 🚀\n'));
        console.log('> dalao is listening at: ');
        console.log('  - Local:    ' + chalk.green(localAddress));
        console.log('  - Network:  ' + chalk.green(networkAddress));
        console.log(chalk.grey('  You can enter `rs`,`restart`,`reload` to reload server anytime.'));
        console.log(chalk.grey('  You can enter `clean`,`cacheclr`,`cacheclean` to clean cached ajax data.'));
    });

    server.on('error', function (err) {
        server.close();
        if (/listen EACCES/.test(err.message)) {
            console.error(chalk.red(`  Try listening port ${port} failed with code ${err.code}, please change anther port`));
            console.error(err);
        }
        else if (/EADDRINUSE/i.test(err.message)) {
            console.log(chalk.grey(`  Port ${port} is in use, dalao is trying to change port to ${++port}`));
            server.listen(port, host);
        }
        else {
            console.error(err);
        }
    });

    server.listen(port, host);
}

function createProxyServer(program) {
    const { config, plugins } = program.context;

    // print route table
    console.log(program.context.output.routeTable.toString());

    // create server
    const server = http.createServer(dalaoProxy.httpCallback(config, plugins));

    // attach server to port
    attachServerListener(program, server, config);

    return server;
}

module.exports = {
    createProxyServer
};
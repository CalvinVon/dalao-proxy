const chalk = require('chalk');
const through = require('through2');
const httpolyglot = require('@httptoolkit/httpolyglot');
const WebSocket = require('ws');

const { connect } = require('net');
const http = require('http');
const URL = require('url').URL;
const dalaoProxy = require('./core');
const { getIPv4Address, locationMatch, locationTransform } = require('../utils');
const register = require('../plugin').register;
const { connections } = require('../runtime');
const { getCert } = require('../cert');

const networkIp = getIPv4Address();

// attach server to port
function attachServerListener(program, server, config) {
    let { host, port, secure } = config;

    server.on('listening', function () {

        const protocal = `http${secure ? 's' : ''}://`;
        const localAddress = `${protocal}${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
        const networkAddress = networkIp ? `${protocal}${networkIp}:${port}` : 'unavailable';

        server.address = {
            local: new URL(localAddress),
            network: networkIp ? new URL(networkAddress) : null,
        };

        config.port = port;
        console.log(chalk.green('\n> dalao has setup the Proxy for you 🚀\n'));
        console.log('> dalao is listening at: ');
        console.log('  - Local:    ' + chalk.green(localAddress));
        console.log('  - Network:  ' + chalk.green(networkAddress));
        console.log(chalk.grey('  You can enter `rs`,`restart`,`reload` to reload server anytime.'));
        console.log();

        // trigger field `server`
        register._trigger('server', server, value => {
            program.context.server = value;
        });
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

    server.on('connection', function (connection) {
        connections.add(connection);
        connection.on('close', () => {
            connections.delete(connection);
        });
    });

    server.listen(port, host);
}

async function createProxyServer(program) {
    const { config, plugins } = program.context;

    // print route table
    console.log(program.context.output.routeTable.toString());

    const proxyCallback = dalaoProxy.httpCallback(config, plugins);
    let server;
    if (config.secure) {
        const { cert, key } = await getCert(networkIp);
        const secureOpt = {
            key,
            cert
        };
        // server = https.createServer(secureOpt, proxyCallback);
        server = httpolyglot.createServer(secureOpt, proxyCallback);
    }
    else {
        server = http.createServer(proxyCallback);
    }
    server.timeout = 2 * 60 * 1000;
    server.maxConnections = 1000;
    server.keepAliveTimeout = 10 * 1000;
    server.headersTimeout = 60 * 1000;

    // attach server to port
    attachServerListener(program, server, config);

    createWebSocketServer(program, server, config);
    // createTunnelProxy(server);
    return server;
}

function createWebSocketServer(program, server, config) {
    const { proxyTable } = config;
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, request) => {
        const url = request.url;
        const locationMatcher = locationMatch(url, proxyTable);
        const proxyUrl = locationTransform(proxyTable[locationMatcher.matched], locationMatcher.matchResult);

        const wsReq = new WebSocket(proxyUrl);
        const incomingWs = WebSocket.createWebSocketStream(ws, { encoding: 'utf8', decodeStrings: false });
        const duplex = WebSocket.createWebSocketStream(wsReq, { encoding: 'utf8', decodeStrings: false });
        duplex.on('error', err => {
            console.error(err);
            wsReq.terminate();
            ws.terminate();
        });
        incomingWs.pipe(duplex);
        duplex.pipe(incomingWs);

        ws.on('close', () => {
            wsReq.terminate();
        });
        wsReq.on('close', () => {
            ws.terminate();
        });
    });
}


function createTunnelProxy(server) {
    const handleClose = (req, res) => {
        const destroy = (err) => { // 及时关闭无用的连接，防止内存泄露
            req.destroy();
            res && res.destroy();
        };
        res && res.on('error', destroy);
        req.on('error', destroy);
        req.once('close', destroy);
    }

    const getHostPort = (host, defaultPort) => {
        let port = defaultPort || 80;
        const index = host.indexOf(':');
        if (index !== -1) {
            port = host.substring(index + 1);
            host = host.substring(0, index);
        }
        return { host, port };
    };

    server.on('connect', (req, socket) => {
        const client = connect(getHostPort(req.url), () => {
            console.log(`connect ${req.url}`)
            socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            socket.pipe(client).pipe(
                through(
                    function (chunk, encode, callback) {
                        this.push(chunk)
                        callback();
                    }
                )).pipe(socket);
        });
        handleClose(socket, client);
    })

    // server.on('request', (req, res) => {
    //     console.log(`${req.method} ${req.url}`);
    //     req.pipe(
    //         through(
    //             function (chunk, encode, callback) {
    //                 this.push(chunk)
    //                 callback();
    //             }
    //         )).pipe(res);
    // })
}

module.exports = {
    createProxyServer
};
const chalk = require('chalk');
const httpolyglot = require('@httptoolkit/httpolyglot');
const WebSocket = require('ws');

const { connect } = require('net');
const url = require('url');
const http = require('http');
const tls = require('tls');
const https = require('https');
const URL = require('url').URL;
const dalaoProxy = require('./core');
const { getIPv4Address, locationMatch, locationTransform } = require('../utils');
const register = require('../plugin').register;
const { connections } = require('../runtime');
const { getCert, getCA } = require('../cert');
const { default: Lock } = require('fn.locky');

const networkIp = getIPv4Address();
/** @type {Record<string, import('https').Server>} */
const mitmServers = {};

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
            console.log(chalk.grey(`  Port ${port} is in use, please change another one`));
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

    const proxyCallback = program.context.proxyCallback = dalaoProxy.httpCallback(config, plugins);
    let server;
    if (config.secure) {
        program.context.ca = await getCA();
        const { cert, key } = await getCert(networkIp, true);
        const secureOpt = program.context.cert = {
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
    createTunnelProxy(program, server, config);
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


function createTunnelProxy(program, server, config) {
    const handleClose = (req, res) => {
        const destroy = (err) => { // 及时关闭无用的连接，防止内存泄露
            req.destroy();
            res && res.destroy();
        };
        res && res.on('error', destroy);
        req.on('error', destroy);
        req.once('close', destroy);
    }


    server.on('connect', async (req, socket, head) => {
        const targetUrl = url.parse(`https://${req.url}`);
        const targetHost = targetUrl.hostname;
        let listening = Lock.createAsyncLock();
        const { cert, key } = await getCert(targetHost);

        let httpsServer = mitmServers[targetHost];
        if (!httpsServer) {
            httpsServer = mitmServers[targetHost] = https.createServer({
                cert,
                key,
                SNICallback: async (hostname, done) => {
                    console.log(`SNICallback ${hostname}`)
                    const { cert, key } = await getCert(hostname);
                    done(null, tls.createSecureContext({
                        key,
                        cert
                    }))
                }
            }, program.context.proxyCallback);
        }
        if (!httpsServer.listening) {
            listening.lock();
            httpsServer.listen(0, () => {
                listening.unlock();
            });
        }
        await listening.pending;
        // If port is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using server.address().port after the 'listening' event has been emitted.
        const port = httpsServer.address().port;
        const client = connect(port, '127.0.0.1', () => {
            console.log(`connect ${req.url}`)
            client.write(head);
            socket.write(
                'HTTP/1.1 200 Connection Established\r\n\r\n' +
                "Proxy-agent: dalao-proxy/forward\r\n" +
                "\r\n"
            );
            socket.pipe(client).pipe(socket);
        });
        handleClose(socket, client);
    });

}

module.exports = {
    createProxyServer
};
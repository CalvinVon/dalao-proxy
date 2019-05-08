const Koa = require('koa');
const static = require('koa-static');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = new Koa();

const monitorHandler = require('./monitor');

const port = 40001;

app.use(static(path.join(__dirname, '/web/')));

const server = app.server = http.createServer(app.callback());

function attachServer(port, callback) {

    server.on('listening', function () {
        app.ws = new WebSocket.Server({
            server,
            path: '/ws'
        });
        console.log('  [monitor] attached at http://localhost:' + port);
        callback(app.ws);
    });

    server.on('error', function (err) {
        server.close();
        if (/EADDRINUSE/i.test(err.message)) {
            console.log(`  [monitor] Port ${port} already in use, change port to ${port}`);
            port++;
            server.listen(port);
        }
        else {
            console.error(err);
        }
    });

    server.listen(port);
}

exports.launchMonitor = function () {
    attachServer(port, ws => {
        ws.on('connection', (socket, req) => {
            socket.on('message', data => {
    
            });
        });
    });

    return app;
};
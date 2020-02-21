const Koa = require('koa');
const static = require('koa-static');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const port = 20001;

let server;

/**
 * Launch server
 * @param {Object} runtimeContext
 * @param {(port: number) => null} cb
 */
module.exports = function (runtimeContext, cb) {
    const app = new Koa();
    app.use(static(path.join(__dirname, '/web/dist/')));
    server = app.server = http.createServer(app.callback());

    attachServer(port, (ws, realPort) => {
        app.ws = ws;
        require('./index')(app, runtimeContext);
        cb(realPort);
    });
    return app;
};

function attachServer(port, callback) {
    server.on('listening', function () {
        const ws = new WebSocket.Server({
            server,
            path: '/ws'
        });
        
        callback(ws, port);
    });

    server.on('error', function (err) {
        server.close();
        if (/EADDRINUSE/i.test(err.message)) {
            console.log(`[ui] Port ${port} already in use, change port to ${port}`);
            port++;
            server.listen(port);
        }
        else {
            console.error(err);
        }
    });

    server.listen(port);
}
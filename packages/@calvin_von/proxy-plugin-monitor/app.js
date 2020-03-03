const Koa = require('koa');
const static = require('koa-static');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const port = 40001;
let server;
let app;

exports.launchMonitor = function (config, cb) {
    if (server) {
        server.close();
        app.ws.clients.forEach(client => client.terminate());
        app.ws.close();

        server.removeAllListeners();
        app.removeAllListeners();
        app.ws.removeAllListeners();
    }
    app = new Koa();
    app.use(static(path.join(__dirname, '/web/dist/')));
    server = app.server = http.createServer(app.callback());

    attachServer(port, (ws, realPort) => {
        app.ws = ws;
        require('./monitor')(app, config);
        cb(realPort);
    });

    return app;

    function attachServer(port, callback) {

        server.on('listening', function () {
            const ws = new WebSocket.Server({
                server,
                path: '/ws'
            });

            // add broadcast method
            ws.broadcast = function broadcast(data) {
                ws.clients.forEach(client => {
                    if (
                        client.readyState === WebSocket.OPEN &&
                        server.listening
                    ) {
                        client.send(JSON.stringify(data));
                    }
                });
            };
            callback(ws, port);
        });

        server.on('error', function (err) {
            server.close();
            if (/EADDRINUSE/i.test(err.message)) {
                console.log(`  [monitor] Port ${port} already in use, change port to ${++port}`);
                server.listen(port);
            }
            else {
                console.error(err);
            }
        });

        server.listen(port);
    }
};
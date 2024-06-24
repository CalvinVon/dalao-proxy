const chalk = require('chalk');
const WebSocket = require('ws');
const { format: prettyFormat } = require('pretty-format')
const RemoteDebug = module.exports;
let _client;

RemoteDebug.attachWsServer = function (server) {
    const ws = new WebSocket.Server({
        server,
        path: '/__plugin_inject__/remote-console'
    });


    ws.on('connection', client => {
        _client = client;

        console.log(chalk.green('\n [Plugin inject] remote debug server connected'));

        client.send(JSON.stringify({
            type: 'connect',
            data: '[Plugin inject] remote debug server connected'
        }));

        client.on('close', (code, reason) => {
            console.warn('\n [Plugin inject] remote debug disconnected');
            console.warn(code, reason);
        });

        client.on('message', onClientMessage);
    })
};

RemoteDebug.executeScript = function (data) {
    _client.send(JSON.stringify({
        type: 'code',
        data
    }));
}


function onClientMessage(rawData) {
    const { type, data } = JSON.parse(rawData);

    switch (type) {
        case 'result':
            console.log(chalk.blue(prettyFormat(data, {
                highlight: true,
            })));
            break;

        default:
            break;
    }
}
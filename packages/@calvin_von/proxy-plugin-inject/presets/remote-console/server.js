const EventType = {
    CONNECT: 'CONNECT',
    /** 服务输入的代码 */
    SERVER_CODE_IPT: 'SERVER_CODE_IPT',
    /** 客户端执行结果 */
    CLIENT_RUN_RESULT: 'CLIENT_RUN_RESULT',
}

const chalk = require('chalk');
const WebSocket = require('ws');
const { format: prettyFormat } = require('pretty-format');
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
            type: EventType.CONNECT,
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
        type: EventType.SERVER_CODE_IPT,
        data
    }));
}


function onClientMessage(rawData) {
    const { type, data } = JSON.parse(rawData);

    switch (type) {
        case EventType.CLIENT_RUN_RESULT:
            console.log(chalk.blue(prettyFormat(data, {
                highlight: true,
            })));
            break;

        default:
            break;
    }
}
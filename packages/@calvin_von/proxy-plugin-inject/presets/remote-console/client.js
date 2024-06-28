const EventType = {
    CONNECT: 'CONNECT',
    /** 服务输入的代码 */
    SERVER_CODE_IPT: 'SERVER_CODE_IPT',
    /** 客户端执行结果 */
    CLIENT_RUN_RESULT: 'CLIENT_RUN_RESULT',
}

const originLog = window.console.log.bind(window.console);


window.addEventListener('load', function () {
    const socketUrl = "ws://" + window.location.host + "/__plugin_inject__/remote-console";
    const ws = new WebSocket(socketUrl);
    ws.onopen = () => {
        originLog('[Plugin inject] remote debug client connected');
    };
    ws.onclose = ev => {
        originLog('[Plugin inject] remote debug client connected');
    };
    ws.onmessage = ev => {
        onMessageReceive(ws, ev.data);
    };

    // hijack console.log
    window.console.log = window.log = (...args) => {
        ws.send(JSON.stringify({
            type: EventType.CLIENT_RUN_RESULT,
            data: args
        }, null, 2));
        return originLog.call(null, ...args);
    }
});


function onMessageReceive(ws, rawData) {
    const { type, data } = JSON.parse(rawData);

    switch (type) {
        case EventType.CONNECT:
            originLog(data);
            break;

        case EventType.SERVER_CODE_IPT:
            runCommand(ws, data);

        default:
            break;
    }
}


function runCommand(ws, cmd) {
    originLog('[Plugin inject] remote console');
    originLog(cmd);
    const result = eval(cmd);
    originLog(result);
    ws.send(JSON.stringify({
        type: EventType.CLIENT_RUN_RESULT,
        data: result
    }));
    return result;
}
window.addEventListener('load', function () {
    const socketUrl = "ws://" + window.location.host + "/__plugin_inject__/remote-console";
    const ws = new WebSocket(socketUrl);
    ws.onopen = () => {
        console.log('[Plugin inject] remote debug client connected');
    };
    ws.onclose = ev => {
        console.log('[Plugin inject] remote debug client connected');
    };
    ws.onmessage = ev => {
        onMessageReceive(ws, ev.data);
    };
});


function onMessageReceive(ws, rawData) {
    const { type, data } = JSON.parse(rawData);

    switch (type) {
        case 'connect':
            console.log(data);
            break;

        case 'code':
            runCommand(ws, data);
        default:
            break;
    }
}


function runCommand(ws, cmd) {
    console.log('[Plugin inject] remote console');
    console.log(cmd);
    const result = eval(cmd);
    console.log(result);
    ws.send(JSON.stringify({
        type: 'result',
        data: result
    }));
    return result;
}
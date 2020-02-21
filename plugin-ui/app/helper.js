
function useSendObject(client) {
    const _send = client.send;
    client.send = function (data) {
        return _send.call(client, JSON.stringify(data));
    };
}

function useResponseHandler(client) {
    /**
     * Reply the client request
     * @param {any} data
     */
    client.response = function (data) {
        return {
            to: function (request) {
                client.send({
                    id: request.id,
                    error: null,
                    type: 'response',
                    data
                });
            }
        }
    };
}

function useInitiateRequest(client) {
    /**
     * Initiate a server request to client
     */
    client.request = function (data) {
        const id = Math.random().toString(16).substr(2) + Date.now();
        client.send({
            id,
            type: 'server-request',
            data
        });
    }
}

function broadcast(app, data) {
    app.ws.clients.forEach(client => {
        useSendObject(client);
        if (
            client.readyState === WebSocket.OPEN &&
            server.listening
        ) {
            client.send(data);
        }
    });
};

module.exports = {
    useInitiateRequest,
    useResponseHandler,
    useSendObject,
    broadcast
}
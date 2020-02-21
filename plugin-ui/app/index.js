const { useInitiateRequest, useResponseHandler, useSendObject } = require('./helper');

function clientController(app, runtimeContext) {
    

    app.ws.on('connection', client => {
        useSendObject(client);
        useInitiateRequest(client);
        useResponseHandler(client);


        client.send({
            type: 'program',
            data: null
        });

        client.on('message', message => {
            const request = JSON.parse(message);
            const { type, data } = request;

        });
    });
    app.ws.on('close', () => {
        console.log('[ui] Disconnected!');
    });
};



module.exports = clientController;

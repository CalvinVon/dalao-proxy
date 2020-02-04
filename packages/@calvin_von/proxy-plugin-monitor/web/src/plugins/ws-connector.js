import Vue from 'vue';
import { notification } from 'ant-design-vue';
const env = process.env.NODE_ENV;

class WsConnector {
    ws;
    ws_connected;
    eventEmitter;

    onMessageListeners;
    onCloseListeners;
    onOpenListeners;

    constructor() {
        this.eventEmitter = new Vue();
    }

    connect() {
        this.ws_connected = "Connecting";
        if (this.ws) {
            this.ws.close();
        }

        let socketUrl = "ws://" + window.location.host + "/ws";
        if (env !== "production") {
            socketUrl = "ws://localhost:40001/ws";
        }
        const ws = (this.ws = new WebSocket(socketUrl));
        ws.onopen = () => {
            this.ws_connected = "Connected";
            this.eventEmitter.$emit('onOpen');
        };
        ws.onclose = ev => {
            this.ws_connected = "Disconnected";
            this.eventEmitter.$emit('onClose');
            notification.open({
                key: "onclose",
                message: "Connection closed.",
                description:
                    "The connection to the server has been disconnected, check if dalao-proxy still running",
                onClick: () => {
                    notification.close("onclose");
                }
            });
        };
        ws.onmessage = ev => {
            this.eventEmitter.$emit('onMessage', ev.data);
        };
    }

    listen(type, listener, scope, once) {
        if (scope && scope instanceof Vue) {
            const destroy = scope.$destroy;
            scope.$destroy = function () {
                this.eventEmitter.$off(type, listener);
                destroy.call(this);
            };
        }
        this.eventEmitter[once ? '$once' : '$on'](type, listener);
    }

    send(data) {
        const uuid = Math.random().toString(16).substr(2) + Date.now();
        data.id = uuid;
        this.ws.send(JSON.stringify(data));

        return new Promise(resolve => {
            const respListener = respData => {
                const responseData = JSON.parse(respData);
                const { type: respType, id: respId } = responseData;
                if (respType === 'response' && respId === uuid) {
                    resolve(responseData);
                    this.eventEmitter.$off('onMessage', respListener);
                }
            };
            this.listen('onMessage', respListener);
        });
    }
}

export default new WsConnector();
export {
    WsConnector
}
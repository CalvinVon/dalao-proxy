const RequestMonitor = require('./app');
const open = require('open');
let app;

module.exports = {
    beforeCreate({ config }) {
        app = RequestMonitor.launchMonitor(port => {
            open(`http://localhost:${port}`);
        });
        app.proxyService = {
            config
        };
    },
    onRequest(context, next) {
        context.monitor = {
            times: {
                start: Date.now()
            }
        };
        next();
    },
    beforeProxy(context, next) {
        app.emit('proxy:beforeProxy', context);
        next();
    },
    afterProxy(context) {
        context.monitor.times.end = Date.now();
        app.emit('proxy:afterProxy', context);
    }
}
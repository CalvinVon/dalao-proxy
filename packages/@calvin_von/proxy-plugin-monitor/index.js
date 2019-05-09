const RequestMonitor = require('./app');
const open = require('open');
let app;

module.exports = {
    beforeCreate() {
        app = RequestMonitor.launchMonitor(port => {
            // open(`http://localhost:${port}`);
        });
    },
    beforeProxy(context, next) {
        app.emit('proxy:beforeProxy', context);
        context.monitor = {
            times: {
                start: Date.now()
            }
        };
        next();
    },
    afterProxy(context) {
        context.monitor.times.end = Date.now();
        app.emit('proxy:afterProxy', context);
    }
}
const RequestMonitor = require('./app');
const { syncConfig, cleanMonitor } = require('./monitor');
const open = require('open');
let app;

module.exports = {
    beforeCreate({ config }) {
        // Disable logger on request
        config.info = false;

        const {
            open: openOnStart = true,
            cleanOnRestart = false
        } = config.monitor || {};


        if (app) {
            app.monitorService.config = config;
            syncConfig(app);
            if (cleanOnRestart) {
                cleanMonitor(app);
            }
        }
        else {
            // Launch monitor server
            app = RequestMonitor.launchMonitor(port => {
                if (openOnStart) {
                    open(`http://localhost:${port}`);
                }
            })
        }

        app.monitorService = {
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
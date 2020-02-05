const concat = require('concat-stream');
const open = require('open');
const RequestMonitor = require('./app');
const { syncConfig, cleanMonitor } = require('./monitor');
const FileStorage = require('./formdata-files.storage');
let app;

module.exports = {
    beforeCreate({ config }) {
        const {
            open: openOnStart = true,
            cleanOnRestart = false,
            disableLogger
        } = this.config;

        // Disable logger on request
        config.logger = !disableLogger;
        FileStorage.init(this.config);


        if (app) {
            app.monitorService.config = config;
            syncConfig(app);
            if (cleanOnRestart) {
                cleanMonitor(app);
            }
        }
        else {
            // Launch monitor server
            app = RequestMonitor.launchMonitor(this.config, port => {
                if (openOnStart) {
                    open(`http://localhost:${port}`);
                }

                this.register.on('context:server', () => {
                    console.log('  [monitor] attached at http://localhost:' + port);
                });
            });
        }

        app.monitorService = {
            config
        };
    },
    onRequest(context, next) {
        context.monitor = {
            times: {
                request_start: Date.now(),
                proxy_start: null,
                proxy_end: null,
                request_end: null,
            }
        };
        next();
    },
    beforeProxy(context, next) {
        app.emit('proxy:beforeProxy', context);
        next();
    },
    onProxySetup(context) {
        context.monitor.times.proxy_start = Date.now();
    },
    onProxyRespond(context, next) {
        context.monitor.times.proxy_end = Date.now();

        app.emit('proxy:onProxyRespond', context);
        next();
    },
    afterProxy(context) {
        context.monitor.times.request_end = Date.now();
        app.emit('proxy:afterProxy', context);
    }
}
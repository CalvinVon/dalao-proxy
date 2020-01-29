const open = require('open');
const concat = require('concat-stream');
const querystring = require('querystring');
const RequestMonitor = require('./app');
const { syncConfig, cleanMonitor } = require('./monitor');
let app;

module.exports = {
    beforeCreate({ config }) {
        const {
            open: openOnStart = true,
            cleanOnRestart = false,
            disableLogger
        } = this.config;

        // Disable logger on request
        config.info = !disableLogger;


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
                request_start: Date.now(),
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
        const { requestStream } = context.proxy;
        requestStream.pipe(concat(buf => {
            const { type, query } = context.data.request;
            const proxyRequestData = {
                query,
                rawBuffer: buf,
                rawBody: buf.toString(),
                type,
                body: null,
            };
            try {
                if (type) {
                    if (/application\/x-www-form-urlencoded/.test(type)) {
                        proxyRequestData.body = querystring.parse(proxyRequestData.rawBody);
                    } else if (/application\/json/.test(type)) {
                        proxyRequestData.body = JSON.parse(proxyRequestData.rawBody);
                    } else if (/multipart\/form-data/.test(type)) {
                        proxyRequestData.body = proxyRequestData.rawBody;
                    }
                }
            } catch (error) {
                info && console.log(' > Error: can\'t parse requset body. ' + error.message);
            }
            context.proxy.data = {
                request: proxyRequestData
            };
        }));
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
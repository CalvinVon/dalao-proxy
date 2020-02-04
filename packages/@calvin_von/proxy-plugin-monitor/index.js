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
        context.proxy.data = {
            request: null,
            response: null
        };

        // collect proxy request data
        requestStream.pipe(concat(buf => {
            const reqContentType = context.data.request.type;
            const data = {
                rawBuffer: buf,
                rawBody: buf.toString(),
                body: null,
                type: reqContentType,
                size: buf.byteLength
            };
            context.proxy.data.request = data;

            data.body = this.context.exports.BodyParser.parse(reqContentType, buf, error => {
                context.config.logger && console.log(' > Error: can\'t parse requset body. ' + error.message);
            });
        }));
    },
    onProxyRespond(context, next) {
        context.monitor.times.proxy_end = Date.now();

        const { originResponseStream, response: proxyResponse } = context.proxy;
        // collect origin response data
        originResponseStream.pipe(concat(buf => {
            const data = {
                rawBuffer: buf,
                rawData: buf.toString(),
                data: '',
                type: null,
                size: buf.byteLength,
            };

            try {
                if (/json/.test(data.type = proxyResponse.headers['content-type'])) {
                    data.data = JSON.parse(this.context.exports.Utils.fixJson(data.rawData));
                }
            } catch (error) {
                console.error(chalk.red(` > An error occurred (${error.message}) while parsing response data.`));
            }

            context.proxy.data.response = data;
            app.emit('proxy:onProxyRespond', context);
        }));

        next();
    },
    afterProxy(context) {
        context.monitor.times.request_end = Date.now();
        app.emit('proxy:afterProxy', context);
    }
}
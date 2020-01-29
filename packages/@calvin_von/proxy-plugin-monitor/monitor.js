const mime = require('mime-types');
const chalk = require('chalk');
const open = require('launch-editor');

const Monitor = module.exports = function (app) {
    const broadcast = app.ws.broadcast;

    app.ws.on('connection', client => {
        client.send(JSON.stringify({
            type: 'config',
            config: app.monitorService.config
        }));
        console.log('  [monitor] Connected!');

        client.on('message', message => {
            const { type, action, value } = JSON.parse(message);
            if (type === 'action') {
                switch (action) {
                    case 'open-file':
                        open(value, 'code', (filename, error) => {
                            console.error(chalk.red('> Open file error: ' + error.message));
                        });
                        break;

                    default:
                        break;
                }
            }
        });
    });
    app.ws.on('close', () => {
        console.log('  [monitor] Disconnected!');
    });



    app.on('proxy:beforeProxy', function (ctx) {
        try {
            const id = ctx.monitor.id =
                ctx.request.url + '__'
                + Date.now() + '-'
                + Math.random().toString(16).substr(2);
            const nameRes = ctx.request.url.match(/\/(?:\S+)?$/)[0];
            const data = {
                id,
                url: ctx.request.url,
                name: {
                    suffix: nameRes,
                    prefix: ctx.request.url.replace(nameRes, '')
                },
                type: 'beforeProxy',
                status: '(Pending)',
                'General': {
                    'Origin URI': ctx.request.url,
                    'Proxy URI': ctx.proxy.uri,
                    'Method': ctx.request.method,
                    'Match Route': ctx.matched.path,
                },
                'Request Headers': ctx.request.headers,
                'Response Headers': null,
                'Proxy': {
                    'Proxy URI': ctx.proxy.uri,
                    'Matched Path': ctx.matched.path,
                    'Matched Target': ctx.matched.route.target,
                    'Change Origin': ctx.matched.route.changeOrigin
                },
                'Proxy Request Headers': null,
                'Proxy Response Headers': null,
                data: {
                    request: {},
                    response: {},
                },
                'Timing': 0
            };

            ctx.monitor.data = data;

            if (ctx.cache) {
                const cacheMeta = {
                    ...ctx.cache
                };
                delete cacheMeta.rawData;
                delete cacheMeta.data;
                data['type'] = 'hitCache';
                data['General']['Status Code'] = '200 Hit Cache';
                data['Response Headers'] = ctx.response.getHeaders();
                const now = ctx.monitor.times.request_end = Date.now();
                data['Timing'] = now - ctx.monitor.times.request_start;
                data['Cache'] = cacheMeta;
                data.data = {
                    response: ctx.cache
                };
                data.status = {
                    code: 200,
                    message: 'OK'
                }
                broadcast(data);
            }
            else {
                broadcast(data);
            }
        } catch (error) {
            console.error('  [monitor] Error: ' + error.message);
        }
    });

    app.on('proxy:onProxyRespond', function (ctx) {
        const { req: proxyRequest, response: proxyResponse } = ctx.proxy;
        const { data, times } = ctx.monitor;
        data.status = '(Proxy responded)';
        data.type = 'onProxyRespond';
        data['Proxy Request Headers'] = proxyRequest.getHeaders();
        data['Proxy Response Headers'] = proxyResponse.headers;
        data['Proxy']['Timing'] = times.proxy_end - times.request_start;

        if (/json/.test(ctx.proxy.data.request.type)) {
            data['Proxy Request Payload'] = ctx.proxy.data.request.body;
        }

        if (ctx.request.URL.query) {
            data['Proxy Query String Parameters'] = ctx.data.request.query;
        }
        broadcast(data);
    });

    app.on('proxy:afterProxy', function (ctx) {

        try {
            const headers = ctx.response.getHeaders();
            const data = {
                id: ctx.monitor.id,
                type: 'afterProxy',
                data: ctx.data,
                'General': {
                    'Status Code': `${ctx.response.statusCode} ${ctx.response.statusMessage}`,
                },
                status: {
                    code: ctx.response.statusCode,
                    message: ctx.response.statusMessage
                },
                'Response Headers': headers,
                'Timing': ctx.monitor.times.request_end - ctx.monitor.times.request_start
            };

            delete data.data.request.rawBuffer;
            data.data.response && delete data.data.response.rawBuffer;

            if (ctx.data.error) {
                data['General']['Status Code'] = `(failed) ${ctx.data.error.code}`;
                data.status = {
                    code: '(failed)',
                    message: ctx.data.error.code
                };
            }

            if (/json/.test(ctx.data.request.type)) {
                data['Request Payload'] = ctx.data.request.body;
            }

            if (ctx.request.URL.query) {
                data['Query String Parameters'] = ctx.data.request.query;
            }

            if (!headers['content-type']) {
                if (ctx.request.url === '/') {
                    headers['content-type'] = 'text/html';
                }
                else if (/\.\w+$/.test(ctx.request.url)) {
                    headers['content-type'] = mime.lookup(ctx.request.url);
                }
            }

            broadcast(Object.assign(ctx.monitor.data, data));
        } catch (error) {
            console.error('  [monitor] Error: ' + error.message);
        }
    });
}

Monitor.syncConfig = function (app) {
    app.ws.broadcast({
        type: 'config',
        config: app.monitorService.config
    });
};

Monitor.cleanMonitor = function (app) {
    app.ws.broadcast({
        type: 'clean'
    });
};
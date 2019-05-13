const mime = require('mime-types');

module.exports = function (app) {
    const broadcast = app.ws.broadcast;

    app.ws.on('connection', () => {
        console.log('  [monitor] Connected!');
    });
    app.ws.on('close', () => {
        console.log('  [monitor] Disconnected!');
    });

    app.on('proxy:beforeProxy', function (ctx) {
        try {
            const id = ctx.monitor.id = ctx.request.url + '__' + Date.now();
            const nameRes = ctx.request.url.match(/\/(?:[^\/]+)?$/)[0];
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
                    'Origin Request URI': ctx.request.url,
                    'Proxy Request URI': ctx.proxy.uri,
                    'Request Method': ctx.request.method,
                    'Match Route': ctx.matched.path,
                },
                'Request Headers': ctx.request.headers,
                data: {
                    request: {},
                    response: {},
                },
                'Timing': 0
            };

            ctx.monitor.data = data;

            if (ctx.cache) {
                data['type'] = 'hitCache';
                data['General']['Status Code'] = '200 Hit Cache';
                data['Response Headers'] = ctx.response.getHeaders();
                const now = ctx.monitor.times.end = Date.now();
                data['Timing'] = now - ctx.monitor.times.start;
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
                'Timing': ctx.monitor.times.end - ctx.monitor.times.start
            };
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

            broadcast(data);
        } catch (error) {
            console.error('  [monitor] Error: ' + error.message);
        }
    });
}
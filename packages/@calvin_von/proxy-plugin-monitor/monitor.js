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
            const proxy_URL = ctx.proxy.URL;
            const data = {
                id: ctx.request.url,
                _type: 'beforeProxy',
                'General': {
                    'Origin Request URI': ctx.request.URL.pathname,
                    'Proxy Request URI': proxy_URL.protocol + '//' + proxy_URL.host + proxy_URL.pathname,
                    'Request Method': ctx.request.method,
                    'Match Route': ctx.matched.path,
                },
                'Request Headers': ctx.request.headers
            };

            if (ctx.cache) {
                data['_type'] = 'hitCache';
                data['General']['Status Code'] = '200 Hit Cache';
                data['Response Headers'] = ctx.response.getHeaders();
                const now = ctx.monitor.times.end = Date.now();
                data['Timing'] = now - ctx.monitor.times.start;
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
            const data = {
                id: ctx.request.url,
                _type: 'afterProxy',
                data: ctx.data,
                'General': {
                    'Status Code': `${ctx.response.statusCode} ${ctx.response.statusMessage}`
                },
                'Response Headers': ctx.response.getHeaders(),
                'Request Headers': ctx.request.headers,
                'Timing': ctx.monitor.times.end - ctx.monitor.times.start
            };
            if (/json/.test(ctx.data.request.type)) {
                data['Request Payload'] = ctx.data.request.body;
            }

            if (ctx.request.URL.query) {
                data['Query String Parameters'] = ctx.data.request.query;
            }

            broadcast(data);
        } catch (error) {
            console.error('  [monitor] Error: ' + error.message);
        }
    });
}
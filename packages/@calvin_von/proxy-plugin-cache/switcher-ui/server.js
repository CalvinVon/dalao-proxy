const fs = require('fs');
const querystring = require('querystring');
const concat = require('concat-stream');
const baseURL = '/__plugin_ui_switcher__';

module.exports = {
    handle(context, next) {
        const { request } = context;
        const { BodyParser } = this.context.exports;

        if (request.url.startsWith(baseURL)) {

            switch (request.url) {
                case baseURL + '/sync-config':
                    bodyParse(sync)
                    // sync();
                    break;

                default:
                    break;
            }
            

            next('plugin ui swicher api');
        }
        else {
            next();
        }


        // Functions -----------

        function bodyParse(cb) {
            const request = context.request;
            request.pipe(concat(buffer => {
                const contentType = request.headers['content-type'];
                const data = {
                    body: null,
                    query: querystring.parse(request.URL.query),
                    type: contentType
                };
                data.body = BodyParser.parse(contentType, buffer, {
                    noRawFileData: true
                });
                cb(context, data);
            }));
        }
    }
};



function sync(context, data) {
    respond(context.response, context.config.cache);
}

function respond(response, data) {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(data));
}
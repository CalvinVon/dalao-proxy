const fs = require('fs');
const querystring = require('querystring');
const concat = require('concat-stream');
const { cleanCache } = require('../subcommands/clean.command/clean');
const { store: storeFiles } = require('../subcommands/store.command/store');
const baseURL = '/__plugin_ui_switcher__';

module.exports = {
    handle(context, next) {
        const { request } = context;
        const { BodyParser } = this.context.exports;

        if (request.url.startsWith(baseURL)) {

            switch (request.url) {
                case baseURL + '/sync-config':
                    sync.call(this, context);
                    break;

                case baseURL + '/reload-server':
                    reload.call(this, context);
                    break;

                case baseURL + '/upload-config':
                    bodyParse.call(this, updateConfig);
                    break;

                case baseURL + '/clean':
                    bodyParse.call(this, clean);
                    break;

                case baseURL + '/store':
                    bodyParse.call(this, store);
                    break;

                default:
                    respond(context.response, 'No handler found')
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
                cb.call(this, context, data);
            }));
        }
    }
};



function sync(context) {
    respond(context.response, context.config);
}

function updateConfig(context, data) {
    const { rawConfig, configPath } = this.context;

    const newRawConfig = Object.assign({}, rawConfig, data.body);
    const fileContent = 'module.exports = ' + JSON.stringify(newRawConfig, null, 4);
    fs.writeFile(configPath, fileContent, err => {
        err && console.warn('[Plugin Cache] ui-switcher update config failed: ', err);
        respond(context.response, 'update OK');
    })

}

function reload(context) {
    respond(context.response, 'command OK');
    context.response.on('finish', () => {
        this.context.program.reload();
    });
}

function clean(context, data) {
    const { target, options } = data.body;
    cleanCache({
        options: options || {},
        config: this.config[target]
    });
    respond(context.response, 'command OK');
}

function store(context, data) {
    const { target, name } = data.body;
    storeFiles(name, this.config[target])
    respond(context.response, 'command OK');
}

function respond(response, data) {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({
        code: 200,
        data
    }));
}
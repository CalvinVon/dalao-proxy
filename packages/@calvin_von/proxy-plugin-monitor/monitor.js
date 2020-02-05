const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const chalk = require('chalk');
const open = require('launch-editor');
const FileStorage = require('./formdata-files.storage');

class WsSendData {
    constructor(error, value) {
        this.type = null;
        this.action = null;
        this.error = error instanceof Error ? error.message : error;
        this.value = value;
    }

    setId(id) {
        this.id = id;
        return this;
    }

    setAction(type) {
        this.action = type;
        return this;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setResposeOf(request) {
        this.setType('response');
        this.setId(request.id);
        this.setAction(request.type);
        return this;
    }

    stringify() {
        return JSON.stringify(this);
    }
}

const Monitor = module.exports = function (app, config) {
    const broadcast = app.ws.broadcast;

    app.ws.on('connection', client => {
        client.send(
            new WsSendData(null, app.monitorService.config)
                .setType('config')
                .stringify()
        );
        console.log('  [monitor] Connected!');

        client.on('message', message => {
            const request = JSON.parse(message);
            const { type, action, value } = request;
            if (type === 'action') {
                switch (action) {
                    case 'clean':
                        FileStorage.clean();
                        break;

                    case 'open-file':
                        open(value, config.editor, (filename, error) => {
                            console.error(chalk.red('> Open file error: ' + error.message));
                        });
                        break;

                    case 'download-file':
                        (() => {
                            const { field, savePath, id: recordId } = value;
                            const record = FileStorage.getRecord(recordId);
                            if (record) {
                                const fileData = record.files[field];
                                const filePath = path.join(savePath, fileData.name);
                                fs.writeFile(filePath, fileData.buffer, err => {
                                    if (!err) {
                                        open(filePath, config.editor, err => {
                                            client.send(new WsSendData(err)
                                                .setResposeOf(request)
                                                .stringify())
                                        });
                                    }
                                    else {
                                        client.send(new WsSendData(err)
                                            .setResposeOf(request)
                                            .stringify())
                                    }
                                });
                            }
                            else {
                                client.send(new WsSendData('no file cache found!')
                                    .setResposeOf(request)
                                    .stringify())
                            }
                        })();
                        break;

                    default:
                        break;
                }
            }
            else if (type === 'file-system') {
                (() => {
                    const {
                        path: currentPath,
                        isForward,
                        forwardDirname
                    } = value;
                    let dirPath = currentPath || process.cwd();
                    if (isForward) {
                        dirPath = path.join(dirPath, forwardDirname);
                    }
                    else if (isForward === false) {
                        dirPath = path.resolve(dirPath, '../');
                    }
                    const fileList = fs.readdirSync(dirPath, { withFileTypes: true }).map(it => ({ name: it.name, isDir: it.isDirectory() }));
                    client.send(
                        new WsSendData(null, {
                            path: dirPath,
                            list: fileList
                        })
                            .setResposeOf(request)
                            .stringify()
                    );
                })();
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
                    response: { ...ctx.cache }
                };
                delete data.data.response.rawBuffer;
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
        data.data.request = { ...ctx.data.request };
        delete data.data.request.rawBuffer;
        data.status = '(Proxy responded)';
        data.type = 'onProxyRespond';
        data['Proxy Request Headers'] = proxyRequest.getHeaders();
        data['Proxy Response Headers'] = proxyResponse.headers;
        data['Timing'] = times.proxy_end - times.request_start;
        data['Proxy']['Timing'] = times.proxy_end - times.proxy_start;

        // send request data
        if (ctx.data.request && ctx.data.request.body) {
            const reqBodyType = ctx.data.request.type;
            const originBody = ctx.data.request.body;
            const proxyBody = ctx.proxy.data.request.body;
            if (/json/.test(reqBodyType)) {
                data['Request Payload'] = JSON.stringify(originBody, null, 4);
                data['Request Payload[parsed]'] = originBody;
                data['Proxy Request Payload'] = JSON.stringify(proxyBody, null, 4);
                data['Proxy Request Payload[parsed]'] = proxyBody;
            }
            else if (/form-data/.test(reqBodyType)) {
                const rawOriginBody = originBody._raw;
                const rawProxyBody = proxyBody._raw;
                delete originBody._raw;
                delete proxyBody._raw;
                data['Form Data'] = transformRawFormData(reqBodyType, rawOriginBody, originBody);
                data['Form Data[parsed]'] = transformFormData(rawOriginBody, originBody);
                data['Proxy Form Data'] = transformRawFormData(reqBodyType, rawProxyBody, proxyBody);
                data['Proxy Form Data[parsed]'] = transformFormData(rawProxyBody, proxyBody);

                const filesData = attachDownloadableFile(rawOriginBody, originBody);
                FileStorage.storeRecord({ id: data.id, files: filesData });
            }
            else if (/x-www-form-urlencoded/.test(reqBodyType)) {
                data['Form Data'] = JSON.stringify(originBody, null, 4);
                data['Form Data[parsed]'] = originBody;
                data['Proxy Form Data'] = JSON.stringify(proxyBody, null, 4);
                data['Proxy Form Data[parsed]'] = proxyBody;
            }
        }

        // send request query data
        if (ctx.request.URL.query) {
            data['Query String Parameters'] = JSON.stringify(ctx.data.request.query, null, 4);
            data['Query String Parameters[parsed]'] = ctx.data.request.query;
            data['Proxy Query String Parameters'] = JSON.stringify(ctx.data.request.query, null, 4);
            data['Proxy Query String Parameters[parsed]'] = ctx.data.request.query;
        }
        broadcast(data);
    });

    app.on('proxy:afterProxy', function (ctx) {

        try {
            const headers = ctx.response.getHeaders();
            const data = {
                id: ctx.monitor.id,
                type: 'afterProxy',
                data: {
                    request: {
                        ...ctx.data.request
                    },
                    response: {
                        ...ctx.data.response
                    }
                },
                'General': {
                    'Status Code': `${ctx.response.statusCode} ${ctx.response.statusMessage}`,
                },
                status: {
                    code: ctx.response.statusCode,
                    message: ctx.response.statusMessage
                },
                'Proxy Response': {
                    ...ctx.proxy.data.response,
                    rawBuffer: null
                },
                'Response Headers': headers,
                'Timing': ctx.monitor.times.request_end - ctx.monitor.times.request_start
            };

            delete data.data.request.rawBuffer;
            delete data.data.response.rawBuffer;

            if (ctx.data.error) {
                data['General']['Status Code'] = `(failed) ${ctx.data.error.code}`;
                data.status = {
                    code: '(failed)',
                    message: ctx.data.error.code
                };
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
    app.ws.broadcast(
        new WsSendData(null, app.monitorService.config)
            .setType('config')
            .stringify()
    );
};

Monitor.cleanMonitor = function (app) {
    app.ws.broadcast(
        new WsSendData(null)
            .setType('clean')
            .stringify()
    );
};


function attachDownloadableFile(rawBody, body) {
    const files = {};
    Object.keys(rawBody).forEach(field => {
        if (rawBody[field].isFile) {
            files[field] = {
                buffer: rawBody[field].body,
                name: body[field].name
            };
        }
    });
    return files;
}

function transformFormData(rawBody, body) {
    const formData = {};
    for (const field in body) {
        if (rawBody[field].isFile) {
            formData[field] = `<File: ${body[field].name}>`;
        }
        else {
            formData[field] = body[field];
        }
    }
    return formData;
}

/**
 * replace file content of form data
 * @param {String} type request's Content-Type
 * @param {String} rawBody raw request body
 */
function transformRawFormData(contentType, rawBody, body) {
    const boundary = '--' + contentType.match(/boundary=(\S+)/)[1];
    let content = '';
    Object.keys(rawBody).forEach(field => {
        const fieldHead = rawBody[field].head.toString();
        let fieldBody;
        if (rawBody[field].isFile) {
            fieldBody = `<File: ${body[field].name}>`;
        }
        else {
            fieldBody = body[field];
        }
        const fieldValue = boundary + '\n' + fieldHead + '\n\n' + fieldBody + '\n';
        content += fieldValue;
    });
    return content + boundary + '--';
}
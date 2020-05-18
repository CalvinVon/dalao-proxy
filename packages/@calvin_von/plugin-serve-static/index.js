const chalk = require('chalk');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

function beforeCreate() {
    const { route, root } = this.config;

    this.register.once('context:server', server => {
        const url = server.address.local.origin + route;
        console.log(`> Serving [${chalk.blue(root)}]`);
        console.log(`> Static server ready, available on [ ${chalk.blue(url)} ]\n`);
    });
}

function onRequest(context, next) {
    const { request, response } = context;
    const url = request.url;
    const { route, root, serveOptions } = this.config;

    try {
        const serve = serveStatic(root, serveOptions);
        if (url.startsWith(route)) {
            const staticUrl = url.replace(route, '');
            const staticPath = require('path').join(root, url.replace(route, ''));
            console.log(chalk.blue(`> Serve [${url}] >>>> [${staticPath}]`));
            request.url = staticUrl || '/';
            serve(request, response, finalhandler(request, response));
            next('serve static');
        }
        else {
            next(null);
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    beforeCreate,
    onRequest,
};

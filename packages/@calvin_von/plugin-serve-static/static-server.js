const chalk = require('chalk');
const finalhandler = require('finalhandler');
const http = require('http');
const serveStatic = require('serve-static');

module.exports = function launchServer(plugin, cmdArgs) {
    const coreUtils = plugin.context.exports.Utils;
    const root = cmdArgs.root || plugin.config.root;
    const port = cmdArgs.port || plugin.config.port;
    const host = cmdArgs.host || plugin.config.host;
    const serveOptions = plugin.config.serveOptions;

    // Serve up public/ftp folder
    const serve = serveStatic(root, serveOptions);

    // Create server
    const server = http.createServer(function onRequest(req, res) {
        serve(req, res, finalhandler(req, res));
    });

    // Listen
    server.listen(port, host, () => {
        const networkIp = coreUtils.getIPv4Address();

        const localAddress = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
        const networkAddress = networkIp ? `http://${networkIp}:${port}` : 'unavailable';

        console.log(`Serving [${chalk.blue(root)}]`);
        console.log(`Static server ready, available on:`);
        console.log('- Local:    ' + chalk.green(localAddress));
        console.log('- Network:  ' + chalk.green(networkAddress));
        console.log();
    });
};

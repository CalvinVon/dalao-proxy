const LaunchServer = require('./static-server');

module.exports = function (program) {
    const plugin = this;
    program
        .command('serve [folder]')
        .description('launch a static files server')
        .option('-P, --port <port>', 'server port', 4200)
        .option('-H, --host <host>', 'server port', '0.0.0.0')
        .action(function (folder) {
            LaunchServer(plugin, {
                root: folder,
                port: this.context.options.port,
                host: this.context.options.host,
            });
        });
};

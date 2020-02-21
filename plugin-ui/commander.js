const chalk = require('chalk');
const launchServer = require('./app/server');
const IpcController = require('./controller');

module.exports = function (program, register) {
    const uiCommand = program
        .command('ui')
        .description('launch a web UI console')
        .action(function () {
            console.log('Launching server...');
            launchServer(program.context, port => {
                console.log(chalk.green(`🚀  Web UI console is ready on http://localhost:${port}`));
            });
        });

    program
        .command('dev-suggestion')
        .description('automatically detect development environment and generate recommended configuration')
        .action(function () {
            require('./app/dev-suggestion')((err, suggestions) => {
                console.log(err);
                console.log(JSON.stringify(suggestions, null, 2));
            });
            process.exit();
        });

    register.on('context:config', () => {
        IpcController.call(this, uiCommand);
    });
}
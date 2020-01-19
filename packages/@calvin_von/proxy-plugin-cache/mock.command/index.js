const { MockFileGenerator } = require('./mock');

module.exports = function MockCommand(program, register, config) {
    program
        .command('mock <method>')
        .description('create a mock file in json format')
        .option('--js', 'use javascript file')
        .option('-C, --config <filepath>', 'use custom config file')
        .option('-d, --dir <cacheDirname>', 'use custom cache dirname')
        .action(function (method) {
            if (!/^(GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD)$/i.test(method)) {
                console.error(chalk.red(method) + ' is NOT a valid HTTP method');
                process.exit(-1);
            }
            MockFileGenerator(method, this.context.options, config);
        });
}
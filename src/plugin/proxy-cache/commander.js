module.exports = function (program, emitter) {
    program
        .command('mock <method>')
        .description('create a mock file in json format')
        .option('--js', 'use javascript file')
        .option('-C, --config <filepath>', 'use custom config file')
        .option('-d, --dir <cacheDirname>', 'use custom cache dirname')
        .action(function (method) {
            // only one stdin listener allowed to be attached at same time

            if (!/^(GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD)$/i.test(method)) {
                console.error(method.red + ' is NOT a valid HTTP method');
                process.exit(-1);
                return;
            }
            MockFileGenerator(program, method, this.context.config);
        });

    program
        .command('clean')
        .description('clean cache files'.green)
        .option('-C, --config <filepath>', 'use custom config file')
        .action(function () {
            // only one stdin listener allowed to be attached at same time

            CleanCache(require(program.config || path.join(process.cwd(), baseConfig.configFilename)));
        });


};
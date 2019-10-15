const path = require('path');
const rm = require('rimraf');
const MockFileGenerator = require('./generate-mock');

module.exports = function (program, register) {
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
            MockFileGenerator(program, method, program.context.config);
        });

    program
        .command('clean')
        .description('clean cache files'.green)
        .option('-C, --config <filepath>', 'use custom config file')
        .action(function () {
            // only one stdin listener allowed to be attached at same time

            CleanCache(program.context.config);
        });


    // register.on('command:start', function () {
    //     console.log('plugin-cache.commander', program.context)
    // });

    // register.on('input', console.log);
    register.configure('config', (config, callback) => {
        config.hhh = 1;
        console.log(config);
        callback(null, []);
    });
};

function CleanCache(config) {
    const cacheDir = path.join(process.cwd(), config.cacheDirname || '.dalao-cache', './*.js**');
    rm(cacheDir, err => {
        if (err) {
            console.log('  [error] something wrong happened during clean cache'.red, err);
        }
        else {
            console.log('  [info] dalao cache has been cleaned!'.green);
        }
    })
};
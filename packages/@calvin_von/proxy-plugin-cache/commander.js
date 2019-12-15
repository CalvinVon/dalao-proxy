const chalk = require('chalk');
const path = require('path');
const rm = require('rimraf');
const MockFileGenerator = require('./generate-mock');

module.exports = function (program, register, config) {
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

    program
        .command('clean')
        .description('clean cache files')
        .action(function () {
            cleanCache(config, () => {
                process.exit(0);
            });
        });


    register.on('input', input => {
        if (/\b(cacheclr|clean|cacheclean)\b/.test(input)) {
            cleanCache(config);
        }
    });
};

function cleanCache(config, callback) {
    const cacheDir = path.join(process.cwd(), config.dirname, './*.js**');
    rm(cacheDir, err => {
        if (err) {
            console.log(chalk.red('  [error] something wrong happened during clean cache'), err);
        }
        else {
            console.log(chalk.green('  [plugin-cache] dalao cache has been cleaned!'));
        }
        callback && callback(err);
    })
};
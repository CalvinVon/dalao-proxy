const chalk = require('chalk');
const path = require('path');
const rm = require('rimraf');

module.exports = function CleanCommand(program) {
    program
        .command('clean')
        .description('clean cache files')
        .action(function () {
            cleanCache(config, () => {
                process.exit(0);
            });
        });
}

exports.cleanCache = function cleanCache(config, callback) {
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

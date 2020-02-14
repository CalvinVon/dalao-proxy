const chalk = require('chalk');
const { cleanCache } = require('./clean');

module.exports = function CleanCommand(program, register, config, parentName) {
    program
        .command('clean [storeName]')
        .description('clear cache files, but user mock files will not be cleaned by default')
        .option('-a, --all', 'clean the whole cache folder, including cache store folders', false)
        .option('-m, --mock', 'clean the user mock files', false)
        .option('-e, --ext <extension>', 'clean the files include the specific extension', collectExtensions, [])
        .option('-r, --reg <regularExpression>', 'clean the files match the specific regular expression including user mock files', collectExtensions, [])
        .action(function (storeName) {
            cleanCache({
                config: config[parentName],
                options: {
                    storeName,
                    ...this.context.options
                }
            });
            console.log('Cache files has been cleaned.');
            process.exit(0);
        });

    register.on('input', input => {
        let matched;
        if (matched = input.match(/\b(cacheclr|clean|cacheclean)\b(?:\s(\S+))?/)) {
            const storeName = matched[2];
            cleanCache({
                config: config[parentName],
                options: {
                    storeName
                }
            });
            console.log(chalk.green('  [plugin-cache] dalao cache has been cleaned!'));
        }
    });
}

function collectExtensions(value, previous) {
    return previous.concat([value]);
}
const ConfigGenerator = require('./generate-config');

module.exports = function registerInitCommand(program) {
    program
        .command('init')
        .description('create a config file in current folder')
        .option('-f, --force', 'Skip options and force generate default config file', false)
        .action(function () {
            ConfigGenerator(program);
        })
}
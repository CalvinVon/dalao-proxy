const AddPlugin = require('./add-plugin');

module.exports = function (program) {
    program
        .command('add-plugin <pluginName>')
        .description('add plugin globally')
        .option('-d, --delete', 'delete plugin globally')
        .action(function (pluginName) {
            AddPlugin(program, pluginName);
        });
}

const { store } = require('./store');

module.exports = function cacheStoreCommand(pluginCommand, register, config) {
    pluginCommand
        .command('store [storeName]')
        .description('store the cached files')
        .action(function (storeName) {
            store(storeName, config);
        });

};
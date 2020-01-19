const chalk = require('chalk');
const moment = require('moment');
const { store, restore, list } = require('./store');

module.exports = function cacheStoreCommand(pluginCommand, register, config) {
    pluginCommand
        .command('store [storeName]')
        .description('store the cache files')
        .action(function (name) {
            const storeName = store(name, config);
            if (storeName) {
                console.log(chalk.green('Stored successfully by name: ') + storeName);
            }
            else {
                console.log('No cache or mock file found, exit.');
            }
            process.exit(0);
        });

    pluginCommand
        .command('restore <storeName>')
        .description('store the current cache files')
        .action(function (name) {
            const success = restore(name, config);
            if (success) {
                console.log(chalk.green('Restored successfully by name: ') + name);
            }
            else {
                console.log('No cache store found, exit.');
            }
            process.exit(0);
        });

    pluginCommand
        .command('list')
        .description('list the cache stores')
        .action(function () {
            const storeList = list(config);

            if (!storeList.length) {
                console.log('No cache store found.');
                process.exit(0);
            }

            console.log('Cache store list:\n');
            storeList.forEach(store => {
                console.log(
                    '  - Name: ' + chalk.yellow(store.name)
                    + '\n'
                    + (
                        store.ts ?
                            '    Created: ' + chalk.grey(moment(+store.ts).format('MM/DD HH:mm')) + '\n'
                            : ''
                    )
                    + '    Folder: ' + chalk.grey(store.dir)
                    + '\n'
                );
            });

            process.exit(0);
        });

};
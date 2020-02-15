const chalk = require('chalk');
const moment = require('moment');
const { store, restore, list } = require('./store');

module.exports = function storeCommand(command, register, config, parentName) {
    command
        .command('store [storeName]')
        .description(`store the ${parentName} files`)
        .action(function (name) {
            handleStore(name);
            process.exit(0);
        });

    command
        .command('restore <storeName>')
        .description(`store the current ${parentName} files`)
        .action(function (name) {
            handleRestore(name);
            process.exit(0);
        });

    command
        .command('list')
        .description(`list the ${parentName} stores`)
        .action(function () {
            handleListStore(() => {
                process.exit(0);
            });
        });


    register.on('input', input => {
        let matched;
        if (matched = input.match(/\b(?:cache\s+((?:re)?store|list))\b(?:\s+(\S+))?/)) {
            const cmd = matched[1];
            const storeName = matched[2];

            const handlers = {
                store: name => handleStore.call(null, name),
                restore: name => handleRestore.call(null, name),
                list: () => handleListStore.call()
            }[cmd];

            handlers.call(null, storeName);
        }
    });


    function handleStore(name) {
        const storeName = store(name, config, parentName);
        if (storeName) {
            console.log(chalk.green('Stored successfully by name: ') + storeName);
        }
        else {
            console.log('No cache or mock file found, exit.');
        }
    }

    function handleRestore(name) {
        const success = restore(name, config, parentName);
        if (success) {
            console.log(chalk.green('Restored successfully by name: ') + name);
        }
        else {
            console.log(`No ${parentName} store found, exit.`);
        }
    }

    function handleListStore(cb) {
        const storeList = list(config, parentName);

        if (!storeList.length) {
            console.log(`No ${parentName} store found.`);
            cb && cb();
        }

        console.log(parentName + ' store list:\n');
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

        cb && cb();
    }

};
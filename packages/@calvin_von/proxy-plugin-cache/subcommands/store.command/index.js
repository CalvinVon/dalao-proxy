const chalk = require('chalk');
const moment = require('moment');
const { store, restore, list } = require('./store');

var storeCommand = module.exports = function (command, register, config, parentName) {
    command
        .command('store [storeName]')
        .description(`store the ${parentName} files`)
        .action(function (name) {
            argsWrapper(handleStore)(name);
            process.exit(0);
        });

    command
        .command('restore <storeName>')
        .option('-d, --delete', 'delete the store when restore it', false)
        .description(`store the current ${parentName} files`)
        .action(function (name) {
            argsWrapper(handleRestore)(name);
            process.exit(0);
        });

    command
        .command('list')
        .description(`list the ${parentName} stores`)
        .action(function () {
            argsWrapper(handleListStore)(() => {
                process.exit(0);
            }, config, parentName);
        });

    function argsWrapper(fn) {
        return function (...args) {
            fn.call(null, ...args, config, parentName, command.context.options);
        }
    }
};


var handleStore = storeCommand.handleStore = function (name, config, parentName, options) {
    const storeName = store(name, config[parentName], options);
    if (storeName) {
        console.log(chalk.green('Stored successfully by name: ') + storeName);
    }
    else {
        console.log('No cache or mock file found, exit.');
    }
}

var handleRestore = storeCommand.handleRestore = function (name, config, parentName, options) {
    const success = restore(name, config[parentName], options);
    if (success) {
        console.log(chalk.green('Restored successfully by name: ') + name);
    }
    else {
        console.log(`No ${parentName} store found, exit.`);
    }
}

var handleListStore = storeCommand.handleListStore = function (cb, config, parentName, options) {
    const storeList = list(config[parentName], options);

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
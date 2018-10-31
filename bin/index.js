#!/usr/bin/env node

const program = require('commander');
const colors = require('colors');
const baseConfig = require('../config');

const Startup = require('../src');

program
    .version(baseConfig.version)
    .option('-C, --config [filepath]', 'use custom config file', baseConfig.configFilename)
    .option('-w, --watch', 'reload when config file changes', baseConfig.watch)
    .option('-p, --port [port]', 'custom proxy port', baseConfig.port)
    .option('-h, --host [hostname]', 'dynamic add host link to your server address')
    .option('-c, --cache', 'enable request cache. ', baseConfig.cache)
    .option('-i, --info', 'enable log. ', baseConfig.info)

program
    .on('--help', function () {
        console.log('')
        console.log('Examples:');
        console.log('  $ dalao-proxy -C ./my-config.json'.gray);
        console.log('  $ dalao-proxy -p 9090 -h test.dalao-proxy.com -c'.gray);
        console.log('  $ dalao-proxy --port=9090 --host=test.dalao-proxy.com --cache=true'.gray);
    })
    .parse(process.argv)
    .action(function () {

        // start up application
        // Startup(program);

    })


console.log('> dalao is working on it...'.green);
Startup(program);

process.on('uncaughtException', function (err) {
    console.log('\n> Oh no, dalao is getting tired...'.red);
    console.error(err);
    process.exit(1);
})
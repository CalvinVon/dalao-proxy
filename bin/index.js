#!/usr/bin/env node

const program = require('commander');
const colors = require('colors');
const baseConfig = require('../config');

const Startup = require('../src');

program
    .version(baseConfig.version)
    .option('-C, --config [filepath]', 'use custom config file')
    .option('-w, --watch', 'reload when config file changes', baseConfig.watch)
    .option('-p, --port [port]', 'custom proxy port', baseConfig.port)
    .option('-h, --host [hostname]', 'dynamic add host linked to your server address')
    .option('-t, --target [proxyTarget]', 'target server to proxy')
    .option('-r, --rewrite', 'globle config for rewrite path', baseConfig.rewrite)
    .option('-c, --cache', 'enable request cache', baseConfig.cache)
    .option('-i, --info', 'enable log print', baseConfig.info)
    .command('start')
    .action(function () {
        console.log('> dalao is working on it...'.green);
        Startup(program);
    })

program
    .command('init')
    .description('create an init config file on current dir')
    .action(function () {
        console.log('I gona create file')
    })

program
    .on('--help', function () {
        console.log('')
        console.log('Examples:');
        console.log('  $ dalao-proxy -C ./my-config.json'.gray);
        console.log('  $ dalao-proxy -p 9090 -h test.dalao-proxy.com -c'.gray);
        console.log('  $ dalao-proxy --port=9090 --host=test.dalao-proxy.com --cache=true'.gray);
    })
    .parse(process.argv)

program
    .on('*', program.outputHelp)

process.on('uncaughtException', function (err) {
    console.log('\n> Oh no, dalao is getting tired...'.red);
    console.error(err);
    process.exit(1);
})
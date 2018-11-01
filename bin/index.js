#!/usr/bin/env node

const program = require('commander');
const colors = require('colors');
const baseConfig = require('../config');

const { Startup, Init, printWelcome } = require('../src');

let input_command;

printWelcome();

program
    .version(baseConfig.version)
    .command('start')
    .description('auto detect config & start proxy server'.green)
    .option('-C, --config [filepath]', 'use custom config file')
    .option('-w, --watch', 'reload when config file changes', baseConfig.watch)
    .option('-p, --port [port]', 'custom proxy port', baseConfig.port)
    .option('-h, --host [hostname]', 'dynamic add host linked to your server address')
    .option('-t, --target [proxyTarget]', 'target server to proxy')
    .option('-r, --rewrite', 'globle config for rewrite path', baseConfig.rewrite)
    .option('-c, --cache', 'enable request cache', baseConfig.cache)
    .option('-i, --info', 'enable log print', baseConfig.info)
    .action(function () {
        console.log('> 😤  dalao is working on it...'.green);
        Startup(this);
        input_command = true;
    })

program
    .command('init')
    .description('create an init config file in current dir')
    .option('-f, --force', 'Skip options and force generate default config file', false)
    .action(function () {
        Init(this);
        input_command = true;
    })

program
    .on('command:*', function () {
        program.outputHelp();
    })
    .on('--help', function () {
        console.log('')
        console.log('Examples:');
        console.log('  $ dalao-proxy init'.gray);
        console.log('  $ dalao-proxy start -C ./my-config.json -p 1234'.gray);
        console.log('  $ dalao-proxy start -p 9090 -h test.dalao-proxy.com -cw'.gray);
        console.log('  $ dalao-proxy start --port=9090 --host=test.dalao-proxy.com --cache=true'.gray);
    })
    .parse(process.argv)
    
if (!input_command) {
    program.outputHelp();
    process.exit(1);
}


process.on('uncaughtException', function (err) {
    console.log('\n> 😫  Oh no, dalao is getting tired...'.red);
    console.error(err);
    process.exit(1);
})
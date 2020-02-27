
const { spawn } = require('child_process');
const path = require('path');

exports.run = function run(program, register, config) {
    const startCmd = program.findCommand('start');
    startCmd.overwriteAction(function () {
        // const rl = require('readline').createInterface({
        //     input: process.stdin,
        //     output: process.stdout,
        //     completer
        // });
        // rl.prompt();
        // rl.on('close', () => {
        //     process.exit(0);
        // })
        const worker = spawnWorkerProcess(startCmd);

        worker.on('message', message => {
            console.log('[master] receive worker: ', message);
            if (message === 'I am ready') {
                worker.send('Hello, spawned proxy!');
                worker.stdin.write('rs\n');
            }
        });

        worker.stdout.pipe(process.stdout);
    })
};


function spawnWorkerProcess(command) {
    const binPath = path.resolve(__dirname, '../../bin/dalao-proxy');
    const options = resolveOptions(command);

    return spawn(
        binPath,
        [
            'start',
            ...options
        ],
        {
            cwd: process.cwd(),
            env: {
                ...process.env,
                DALAO_ENV: command.constructor.DALAO_ENV.worker
            },
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        });
}


function resolveOptions(command) {
    const optionsArgs = [];
    const userOptions = command.context.options;
    command.options.forEach(option => {
        const optionName = option.attributeName();
        if (userOptions[optionName] !== undefined) {
            optionsArgs.push(option.long, userOptions[optionName]);
        }
    });

    return optionsArgs;
}

function completer(line) {
    const completions = '.help .error .exit .quit .q'.split(' ');
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
}
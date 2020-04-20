
const { spawn } = require('child_process');
const chalk = require('chalk');
const throught = require('through2');
const split = require('split');

const Menu = require('./menu');
const Renderer = require('./render');

const Controller = module.exports;
let Command;
let proxyWorker;
let processNumber = 0;

Controller.startWorkerProcess = function startWorkerProcess(program, register, config) {
    Command = program.context.exports.Command;
    const startCmd = program.findCommand('start');
    if (!startCmd) return;

    // overwrite start command
    startCmd.overwriteAction(function () {
        proxyWorker = spawnProxyProcess(startCmd);

        const menuList = createMenu(startCmd, config);
        Renderer.setOptions(config);
        Renderer.setMenu(menuList);
        Renderer.run({
            onMenuSelect(item, replacer) {
                if (item.children.length) {
                    replacer(item.children);
                }
                else {
                    item.action();
                }
            },
            onMenuBack(item, replacer) {
                if (item.parent && item.parent.label) {
                    if (item.parent.parent) {
                        replacer(item.parent.parent.children);
                    }
                    else {
                        replacer([item.parent]);
                    }
                }
            }
        });
    })
};



function spawnProcess(cmd) {
    ++processNumber;
    const worker = spawn(
        cmd,
        {
            cwd: process.cwd(),
            env: process.env,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

    worker.stdout
        .pipe(split())
        .pipe(throught((line, enc, next) => {
            const colorIndex = processNumber % Renderer.colors.length;
            const prefix = Renderer.colors[colorIndex](`[${cmd}]  `);
            const output = line.toString();
            Renderer.render(prefix + output);
            next();
        }));

    process.on('exit', () => {
        worker.kill('SIGKILL');
    });

    return worker;
}

function spawnProxyProcess(program) {
    const binPath = program.context.exports.bin;
    const options = resolveOptions(program);

    const worker = spawn(
        process.execPath,
        [
            binPath,
            'start',
            ...options,
        ],
        {
            cwd: process.cwd(),
            env: {
                ...process.env,
                DALAO_WORKER: Command.DALAO_WORKER.worker,
                // chalk color
                FORCE_COLOR: 1
            },
            stdio: ['pipe', 'pipe', 'pipe'],
        });

    worker.stdout
        .pipe(split())
        .pipe(throught((line, enc, next) => {
            const output = line.toString();
            if (output.match(/Type commands|You can enter/)) {
                return next();
            }
            const prefix = Renderer.colors[0]('[proxy]  ');
            Renderer.render(prefix + output);
            next();
        }));

    return worker;
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


function createMenu(startCmd, config) {
    const menuList = new Menu();
    const proxyMenu = new Menu('dalao-proxy')
        .addChild('reload server', () => {
            if (proxyWorker && !proxyWorker.killed) {
                proxyWorker.stdin.write('reload\n');
            }
            else {
                Renderer.render(chalk.red('[control] Server process is already stoped.'));
            }
        })
        .addStartChild(() => {
            proxyWorker = startProcessWrapper('Server process', proxyWorker, () => spawnProxyProcess(startCmd));
        })
        .addStopChild(() => {
            stopProcessWrapper('Server process', proxyWorker)
        });


    menuList.addChild(proxyMenu);

    config.commands.forEach(command => {
        // let worker = spawnProcess(command);
        // addExitListener(command, worker, () => worker = null);
        let worker;
        const menu = new Menu(command)
            .addStartChild(() => {
                startProcessWrapper(command, worker, () => {
                    worker = spawnProcess(command);
                    addExitListener(command, worker, () => worker = null);
                });
            })
            .addStopChild(() => {
                stopProcessWrapper(command, worker);
                worker = null;
            });

        menuList.addChild(menu);
    });

    return menuList.children;


    function startProcessWrapper(cmd, worker, processGenerator) {
        if (worker && !worker.killed) {
            Renderer.render(chalk.red(`[control] ${cmd} is already running.`));
        }
        else {
            const newWorker = processGenerator();
            Renderer.render(chalk.red(`[control] ${cmd} started.`));
            return newWorker;
        }
    }

    function stopProcessWrapper(cmd, worker) {
        if (!worker || worker.killed) {
            Renderer.render(chalk.red(`[control] ${cmd} is already stoped.`));
        }
        else {
            worker.kill();
            Renderer.render(chalk.red(`[control] ${cmd} stoped.`));
        }
    }

    function addExitListener(cmd, worker, cb) {
        worker.on('exit', (code, reason) => {
            cb(code, reason);
            Renderer.render(chalk.red(`[control] ${cmd} exited with code ${code ? (code + ': ' + reason) : code}`));
        });
    }
}
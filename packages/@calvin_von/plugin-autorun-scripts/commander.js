const { spawn } = require('child_process');
const path = require('path');
const cwd = process.cwd();


module.exports = function (program, register) {
    let childStdTimer;

    try {
        const pluginConfig = this.config;
        const packageJson = require(path.join(cwd, 'package.json'));
        const packageScripts = packageJson.scripts;

        register.on('command:start', () => {
            pluginConfig.scripts.forEach(script => {
                const isExsit = packageScripts[script];

                if (isExsit) {
                    runCommand(script);
                }
                else {
                    console.error('[plugin:autorun-script]: no command found');
                }
            })
        });

    } catch (error) {
        console.error('[plugin:autorun-script]: cannot find package.json file in your project');
    }


    function runCommand(cmd) {
        const child = spawn(
            'npm',
            [
                'run',
                cmd
            ],
            {
                env: process.env,
                cwd,
                shell: true,
                stdio: ["inherit", "pipe", "inherit"]
            }
        );

        child.stdout.pipe(process.stdout);

        child.stdout.on('data', () => {
            if (childStdTimer) {
                clearTimeout(childStdTimer);
            }

            childStdTimer = setTimeout(() => {
                program.context.server.emit('listening');
            }, 1000);
        });
    }
};

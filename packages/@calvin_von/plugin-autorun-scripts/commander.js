const { spawn } = require('child_process');
const path = require('path');
const cwd = process.cwd();

module.exports = function (program, register) {
    const pluginConfig = this.config;
    register.on('command:start', () => {
        try {
            const packageJson = require(path.join(cwd, 'package.json'));
            pluginConfig.scripts.forEach(script => {
                const isExsit = packageJson.scripts[script];

                if (isExsit) {
                    runCommand(script);
                }
                else {
                    console.error('[plugin:autorun-script]: no command found');
                }
            })

        } catch (error) {
            console.error('[plugin:autorun-script]: cannot find package.json file');
        }
    });
};


function runCommand(cmd) {
    spawn(
        'npm',
        [
            'run',
            cmd
        ],
        {
            env: process.env,
            cwd,
            shell: true,
            stdio: "inherit"
        }
    );
}
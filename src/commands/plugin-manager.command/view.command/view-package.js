const { spawn } = require('child_process');

function viewPackage(packageName) {
    let data = '', errorData = '';
    const cmd = spawn(
        'npm',
        [
            'view',
            packageName,
        ],
        {
            stdio: 'pipe',
            shell: true,
            env: process.env
        }
    );

    cmd.stdout.on('data', d => data += d);
    cmd.stdout.on('end', () => {
        console.log(data);
    })

    cmd.stderr.on('data', d => errorData += d);
    cmd.stderr.on('end', () => {
        cmd.kill();
    });
};


function installTempPackage(packageName) {
    let data = '', errorData = '';
    const cmd = spawn(
        'npm',
        [
            'install',
            packageName,
            '-D',
            '--no-package-lock',
            '--ignore-scripts',
            '--no-bin-links',
            '--no-optional',
            '--no-audit'
        ],
        {
            stdio: 'pipe',
            shell: true,
            env: process.env,
            cwd: process.cwd()
        }
    );

    cmd.stdout.on('data', d => data += d);
    cmd.stdout.on('end', () => {
        console.log(data);
    })

    cmd.stderr.on('data', d => errorData += d);
    cmd.stderr.on('end', () => {
        cmd.kill();
    });
}

module.exports = {
    viewPackage,
};
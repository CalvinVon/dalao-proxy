module.exports = function () {
    console.log('I am UI process');

    const { spawn } = require('child_process');

    const child = spawn('dalao-proxy', ['start'], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            isChildProcess: true
        },
        shell: true,
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });


    child.on('message', message => {
        console.log('[ui] receive message from dalao: ', message);
        if (message === 'I am ready') {
            child.send('Hello, spawned proxy!');
        }
    });
    
};

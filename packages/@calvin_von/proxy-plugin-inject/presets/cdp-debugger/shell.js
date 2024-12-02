const { DEBUGGER_PORT } = require('../../consts');
const { spawn } = require('child_process');
const path = require('path');
const chiiPath = path.join(__dirname, '..', '..', 'node_modules', 'chii', 'bin', 'chii.js');

/** @type {import('child_process').ChildProcess | undefined} */
let chiiProcess;
module.exports = {
    start() {
        if (chiiProcess) return;

        chiiProcess = spawn(chiiPath, [`start -p ${DEBUGGER_PORT}`], {
            stdio: 'inherit',
            shell: true
        });
        chiiProcess.on('spawn', () => {
            console.log('[CDP Debugger] cdp debugger server spawned');
        })
    },
    stop() {
        chiiProcess.kill();
    }
}

process.on('exit', () => {
    if (chiiProcess) {
        chiiProcess.kill();
        console.log('[CDP Debugger] cdp debugger server exited');
    }
})
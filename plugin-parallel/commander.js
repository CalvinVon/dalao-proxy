const { master, worker } = require('./controller');

module.exports = function (program, register, config) {

    console.log('process');
    if (program.isWorker()) {
        // worker process, keep orignal start command
        worker.run(program, register, config);
    }
    else {
        // master process, control worker processes
        master.run(program, register, config);
    }
};

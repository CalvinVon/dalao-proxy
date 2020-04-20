const Controller = require('./controller');

module.exports = function (program, register, config) {

    if (!program.isWorker()) {
        // master process, control worker processes
        // Controller.setMenu(menu);
        Controller.startWorkerProcess(program, register, config);

    }
};

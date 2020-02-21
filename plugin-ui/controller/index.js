const { ChildProcess } = require('child_process');

module.exports = function (uiCommand) {
    const currentCmd = this.context.command;
    const startCmd = this.context.program.findCommand('start');


    if (currentCmd === uiCommand) {
        require('./ui.control').call(this);
    }
    else if (currentCmd === startCmd) {
        require('./main.control').call(this);
    }
};

const { Command } = require('commander');
const { Register } = require('../../plugin');

module.exports = function findExtendedCommand(loadFunc) {
    const testProgram = new Command();
    const testRegister = new Register();

    testProgram
        .use(function () {
            loadFunc(this, testRegister, {});
        });

    return {
        commands: testProgram.commands.map(cmd => cmd.name()),
        configure: Object.keys(testRegister.registerMapper),
        on: Object.keys(testRegister._events),
    };
}

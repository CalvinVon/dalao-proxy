const { installRootCA } = require("../../cert");

module.exports = function startCommand(program, register) {
    
    program
        .command('ca')
        .description('Install system trusted certificate')
        .action(async function (command) {
            await installRootCA();
            
            process.exit(0);
        });
};
const { installCA } = require("../../cert");

module.exports = function startCommand(program, register) {
    
    program
        .command('ca')
        .description('Install system trusted certificate')
        .option('-s, --system', 'install to system key chain', false)
        .action(async function () {
            const { system } = this.context.options;
            await installCA(system);
            
            process.exit(0);
        });
};
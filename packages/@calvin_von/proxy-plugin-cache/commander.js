const mockCommand = require('./mock.command');
const cacheCommand = require('./cache.command');
const cleanCommand = require('./clean.command');

module.exports = function (program, register, config) {
    mockCommand(program, register, config);
    cacheCommand(program, register, config);
    cleanCommand(program, register, config);


    register.on('input', input => {
        if (/\b(cacheclr|clean|cacheclean)\b/.test(input)) {
            cleanCommand.cleanCache(config);
        }
    });
};


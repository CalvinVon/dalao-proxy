const mockCommand = require('./mock.command');
const cacheCommand = require('./cache.command');

module.exports = function (program, register, config) {
    mockCommand(program, register, config);
    cacheCommand(program, register, config);

    program.enableCollectData();
};


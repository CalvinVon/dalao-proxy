const mockCommand = require('./mock.command');
const cacheCommand = require('./cache.command');

module.exports = function (program, register, config) {
    mockCommand.call(this, program, register, config);
    cacheCommand.call(this, program, register, config);

    program.enableCollectData();
};


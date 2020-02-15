const changeMockFile = require('./change');

module.exports = function changeCommand(command, register, config, parentName) {
    const plugin = this;
    command
        .command('change <file> [method] [url]')
        .description('change the given file into specific mock files')
        .option('-s, --json', 'chage into json extension')
        .option('-p, --program', 'change into programable javascript file')
        .option('-t, --time <delayTime>', 'change network transfer delay time')
        .option('-f, --function', 'change into js file which exports function')
        .option('-d, --dir <dirname>', 'use custom mock dirname')
        .action(function (file, method, url) {
            const options = this.context.options;
            const { dir, time, function: useFunction } = options;
            if (dir) {
                config[parentName].dirname = dir;
            }

            if (time || useFunction) {
                options.program = true;
                options.json = false;
            }

            options.json = !options.program;

            Object.assign(options, {
                method,
                url
            });
            changeMockFile.call(plugin, file, options, config, parentName);
        });
};

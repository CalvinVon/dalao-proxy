exports.run = function run(program, register, config) {
    console.log('I am UI process');

    setTimeout(() => {
        process.send('I am ready');
    }, 1000);
};

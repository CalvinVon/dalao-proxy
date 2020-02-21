module.exports = function () {
    console.log('[main] isChildProcess: ', process.env.isChildProcess);

    process.on('message', message => {
        console.log('[dalao] receive message from ui: ', message);
        process.send({
            config: this.context.config
        })
    });

    process.send('I am ready');
};

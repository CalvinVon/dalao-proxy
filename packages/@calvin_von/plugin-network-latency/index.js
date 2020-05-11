const chalk = require('chalk');

function work(context, config, callback) {
    const {
        test: testRegExp,
        include,
        exclude,
        time
    } = config;
    const url = context.request.url;
    console.log('url: ', url);
    

    if (!time) {
        callback();
        return;
    }

    if (
        (
            url.match(new RegExp(testRegExp))
            ||
            (include || []).some(it => url.match(new RegExp(it)))
        )
        && (exclude || []).every(it => !url.match(new RegExp(it)))
    ) {
        console.log(chalk.yellow(`> Simulate network latency for [${url}] by [${time}] ms`));
        setTimeout(callback, time);
    }
    else {
        callback();
    }
}


function onPipeRequest(context, next) {
    const { request } = this.config;
    if (request) {
        work(context, this.config, () => {
            next(null, context.chunk);
        });
    }
    else {
        next(null, context.chunk);
    }
}
function onPipeResponse(context, next) {
    const { response } = this.config;
    if (response) {
        work(context, this.config, () => {
            next(null, context.chunk);
        });
    }
    else {
        next(null, context.chunk);
    }
}

module.exports = {
    onPipeRequest,
    onPipeResponse
};

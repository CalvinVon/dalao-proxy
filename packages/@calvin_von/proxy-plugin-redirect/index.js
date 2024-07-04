const chalk = require('chalk');

module.exports = {
    beforeCreate() {
        const { rules = [] } = this.config;

        if (Array.isArray(rules)) {
            parse(rules);
        }
        else {
            throw new Error(chalk.red('[plugin-redirect] config.rules should be an array.'));
        }
    },
    onRouteMatch(context, next) {
        const { rules = [] } = this.config;
        const { request } = context;
        const { url, headers, socket } = request;
        const protocal = socket.encrypted ? 'https:' : 'http:';
        // const forwardUrl = protocal + '//' + headers.host + url;
        const forwardUrl = url;

        // const isToRedirectUrl = url => /^(https?:\/\/)?(([a-z\u00a1-\uffff0-9%_-]+\.)+[a-z\u00a1-\uffff0-9%_-]+|localhost)(\:\d+)?/.test(url);

        // if (isToRedirectUrl(forwardUrl)) {
        // Modify notFound parameter
        context.matched.forward = true;
        context.matched.notFound = false;
        context.matched.path = '[forward]';
        context.matched.redirect = true;
        context.matched.route = null;
        const redirectMeta = context.matched.redirectMeta = {
            target: forwardUrl
        };

        let mostAccurateMatch,
            matchingResult,
            matchingLength = forwardUrl.length;

        rules.forEach(it => {
            const matchReg = new RegExp(it.from);
            let result;
            if (result = forwardUrl.match(matchReg)) {
                const currentLenth = forwardUrl.length - result[0].length;
                if (currentLenth < matchingLength) {
                    matchingLength = currentLenth;
                    mostAccurateMatch = it;
                    matchingResult = result;
                }
            }
        });

        if (mostAccurateMatch) {
            // redirectMeta.matched = true;
            redirectMeta.target = mostAccurateMatch.to.replace(/\$(\d+)/g, (placeholder, holderNumber) => {
                return matchingResult[holderNumber];
            });
        }
        else {
            redirectMeta.target = forwardUrl;
        }
        // }
        next();
    },
    beforeProxy(context, next) {
        // Override proxy route
        if (context.matched.redirect) {
            context.proxy.uri = context.matched.redirectMeta.target;
            console.log(` Forward ${context.proxy.uri}`);
            context.proxy.forward = true;
        }
        next();
    }
};

function parse(redirect) {
    const Table = require('cli-table3');
    const outputTable = new Table({
        head: [chalk.yellow('From'), chalk.yellow('To')]
    });

    redirect.forEach(it => {
        outputTable.push([it.from, it.to]);
    });

    if (redirect.length) {
        console.log('\nRedirect config table: ');
        console.log(chalk.green(outputTable.toString()));
    }
}

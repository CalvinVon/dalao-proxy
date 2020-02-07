const chalk = require('chalk');

module.exports = {
    beforeCreate() {
        const { redirect = [] } = this.config;

        if (Array.isArray(redirect)) {
            parse(redirect);
        }
        else {
            throw new Error(chalk.red('[plugin-redirect] config.redirect should be an array.'));
        }
    },
    onRouteMatch(context, next) {

        const { request, config: { redirect } } = context;
        const { url } = request;

        const isToRedirectUrl = url => /^(https?:\/\/)?(([a-z\u00a1-\uffff0-9%_-]+\.)+[a-z\u00a1-\uffff0-9%_-]+|localhost)(\:\d+)?/.test(url);

        if (isToRedirectUrl(url)) {
            // Modify notFound parameter
            context.matched.notFound = false;
            context.matched.path = '[redirect]';
            context.matched.redirect = true;
            context.matched.route = {};
            const redirectMeta = context.matched.redirectMeta = {
                target: url
            };

            let mostAccurateMatch,
                matchingResult,
                matchingLength = url.length;

            redirect.forEach(it => {
                const matchReg = new RegExp(it.from);
                let result;
                if (result = url.match(matchReg)) {
                    const currentLenth = url.length - result[0].length;
                    if (currentLenth < matchingLength) {
                        matchingLength = currentLenth;
                        mostAccurateMatch = it;
                        matchingResult = result;
                    }
                }
            });

            if (mostAccurateMatch) {
                redirectMeta.matched = true;
                redirectMeta.target = mostAccurateMatch.to.replace(/\$(\d+)/g, (placeholder, holderNumber) => {
                    return matchingResult[holderNumber];
                });
            }
            else {
                redirectMeta.target = url;
            }
        }
        next();
    },
    beforeProxy(context, next) {
        // Override proxy route
        if (context.matched.redirect) {
            context.proxy.uri = context.matched.redirectMeta.target;
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

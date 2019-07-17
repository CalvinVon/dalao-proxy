module.exports = {
    beforeCreate({ config }) {
        const { redirect = [] } = config;

        if (Array.isArray(redirect)) {
            parse(redirect);
        }
        else {
            throw new Error('[plugin-redirect] config.redirect should be an array.'.red);
        }
    },
    onRouteMatch(context, next) {

        const { request, config: { redirect } } = context;
        const { url } = request;

        const isToRedirectUrl = url => /^(https?:\/\/)?(([\w-_]+\.)+[\w-_]+|localhost)(\:\d+)?/.test(url);

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
    const Table = require('cli-table');
    const outputTable = new Table({
        head: ['From'.yellow, 'To'.yellow]
    });

    redirect.forEach(it => {
        outputTable.push([it.from, it.to]);
    });

    if (redirect.length) {
        console.log('\nRedirect config table: ');
        console.log(outputTable.toString().green);
    }
}

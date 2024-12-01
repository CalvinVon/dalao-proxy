const { PROXY_PREFIX, DEBUGGER_PORT } = require('../../consts');

const chiiRule = PROXY_PREFIX + '/cdp';

module.exports = {
    rules: {
        test: "(/|(.html))",
        proxy: {
            [chiiRule]: {
                target: `127.0.0.1:${DEBUGGER_PORT}`,
                pathRewrite: {
                    [`^${chiiRule}`]: ''
                }
            }
        },
        template: `
                  <script src="{{cdp/target.js}}" defer></script>
              `,
        insert: "head",
    },
};

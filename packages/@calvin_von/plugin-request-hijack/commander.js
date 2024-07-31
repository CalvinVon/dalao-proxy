const path = require("path");
const { version } = require("./package.json");

RegExp.prototype.toJSON = function () {
    return this.toString();
};

/**
 * @param {import('./type').HijackOptions} pluginConfig
 */
module.exports = function (program, register, pluginConfig) {
    if (pluginConfig.enable) {
        register.setChildPlugin(
            /** child plugin name */
            "@calvin_von/proxy-plugin-inject",
            /** child plugin field */
            "hijack__inject",
            /** child plugin config */
            config => ({
                rules: [
                    {
                        test: config.requestHijack.page,
                        serves: {
                            "request-hijack": path.join(
                                __dirname,
                                "libs",
                                "request-hijack.js"
                            ),
                        },
                        template: `\n<script>window.__hijackConfig = ${JSON.stringify(
                            {
                                version,
                                host: config.host,
                                proxyTable: config.proxyTable,
                                hijack: config.requestHijack,
                            },
                            null,
                            2
                        )}</script>
                            <script src="{{request-hijack}}"></script>\n`,
                        insert: "head",
                    },
                ],
            })
        );
    }
};

const path = require('path');
const { version } = require('./package.json');

module.exports = function (program, register, pluginConfig) {
  if (pluginConfig && pluginConfig.enable) {
    register.configure('config', (config, callback) => {
      config.plugins.push([
        '@calvin_von/proxy-plugin-inject',
        {
          defaultEnable: true,
          optionsField: 'hijack__inject'
        }
      ]);

      config['hijack__inject'] = {
        rules: [
          {
            test: /^\/$|.html?$/,
            serves: {
              'request-hijack': path.join(__dirname, 'libs', 'request-hijack.js'),
            },
            template: `
              <script>window.__hijackConfig = ${(JSON.stringify({
              version,
              host: config.host,
              proxyTable: config.proxyTable,
              hijack: config.requestHijack,
            }, null, 2))}</script>
              <script src="{{request-hijack}}"></script>
            `,
            insert: 'head'
          }
        ]
      };

      callback(null, config);
    });
  }
};

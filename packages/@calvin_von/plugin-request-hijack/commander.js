const path = require('path');
const { version } = require('./package.json');

/**
 * @param {import('./type').HijackOptions} pluginConfig 
 */
module.exports = function (program, register, pluginConfig) {
  const Plugin = program.context.exports.Plugin;

  if (pluginConfig.enable) {
    register.configure('config', (config, callback) => {
      let childPluginConfig = config.plugins.find(pluginConfig => {
        const { name, setting } = Plugin.resolvePluginSettingFromConfig(pluginConfig);
        return name === '@calvin_von/proxy-plugin-inject' && setting.optionsField === 'hijack__inject';
      });

      if (!childPluginConfig) {
        config.plugins.push([
          '@calvin_von/proxy-plugin-inject',
          {
            defaultEnable: true,
            optionsField: 'hijack__inject'
          }
        ]);
      }

      config['hijack__inject'] = {
        rules: [
          {
            test: config.requestHijack.page,
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

const CheckVersion = require('./check-version');

module.exports = function (program) {
  program
    .command('check')
    .description('check update infomations of cli and plugins')
    .action(function () {
      const plugins = this.context.plugins;
      CheckVersion.checkCoreUpdate(() => {
        CheckVersion.checkAllPluginsUpdate(plugins, () => {
          process.exit(0);
        });
      });
    })

};


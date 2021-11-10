const SSO = require('./content/sso');
const Util = require('./content/util');

module.exports = function (program) {
  program.enableCollectProxyData();
  program
    .command('cookie')
    .description('get/refresh SSO cookie immediately')
    .forwardSubcommands(async function () {
      await SSO.authSSO();
      process.exit(0);
    })
    .command('set')
    .description('set SSO config')
    .action(async function () {
      try {
        const user = await Util.SSO.queryUser();
        Util.SSO.writeUser(user);
        Util.log('SSO config set success');
        process.exit(0);
      } catch (error) { }
    })
};


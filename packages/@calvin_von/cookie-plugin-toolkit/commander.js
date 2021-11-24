const Auth = require('./content/auth');
const Util = require('./content/util');

module.exports = function (program, r, config) {
  program.enableCollectProxyData();

  const cookieCmd = program
    .command('cookie')
    .description('get/refresh cookie immediately')
    .forwardSubcommands(async function () {
      try {
        Auth.setPlatform(config.platform);
        await Auth.requestCookie();
      } catch (error) {
        console.error(error);
      }
      process.exit(0);
    });

  cookieCmd
    .command('set')
    .description('set user info for fetch cookies')
    .action(async function () {
      try {
        Auth.setPlatform(config.platform, false);
        const user = await Util.queryUserInput();
        Util.Auth.writeUser(user, Auth.getUserType());
        Util.log('User config set success');
        process.exit(0);
      } catch (error) {
        console.error(error);
      }
    })

  cookieCmd
    .command('list [platform]')
    .description('list all cookies')
    .action(async function (platform) {
      try {
        const cookies = Util.Cookie.get(platform);
        console.log(cookies);
        process.exit(0);
      } catch (error) {
        console.error(error);
      }
    })

  cookieCmd
    .command('user [userType]')
    .description('list all register user info')
    .action(async function (userType) {
      try {
        if (userType) {
          /**
           * @type {import('./types').User}
           */
          const user = Util.Auth.getUser(userType);
          console.log(user.username);
        }
        else {
          /**
           * @type {Record<string, import('./types').User>}
           */
          const users = Util.Auth.getUser(userType) || {};
          Object
            .keys(users)
            .map(type => `${type}: ${users[type].username}`)
            .forEach(s => console.log(s));
        }

        process.exit(0);
      } catch (error) {
        console.error(error);
      }
    })
};


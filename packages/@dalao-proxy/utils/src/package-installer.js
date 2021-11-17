const { spawn } = require('child_process');
const { getProcessUserInfo } = require('./process-related');

/**
 * @param {string} pluginNames
 * @param {{
 *  isAdd: boolean;
 *  isLocally: boolean;
 *  callback: (error?, options) => void
 * }} [options] 
 */
function installPlugins(pluginNames, options) {
  const {
    isAdd = true,
    isLocally = false,
    callback = () => null,
  } = options || {};

  const { root, user } = getProcessUserInfo();
  const needSudo = !isLocally && user && !root;
  const displayPluginNames = displayNames(pluginNames);
  console.log(`> ${isAdd ? 'Installing' : 'Uninstall'} ${displayPluginNames} package(s) ${isLocally ? '' : 'globally'}...`);

  const args = [
    isAdd ? 'install' : 'uninstall',
    isLocally ? '-D' : '-g',
    ...pluginNames
  ];

  if (needSudo) {
    args.unshift('npm');
  }

  try {
    const installCmd = spawn(
      needSudo ? 'sudo' : 'npm',
      args,
      {
        stdio: 'inherit',
        shell: true,
        env: process.env,
        cwd: process.cwd(),
      }
    );

    installCmd.on('exit', code => {
      if (code) {
        console.log(`\n> ${displayPluginNames} package(s) ${isAdd ? '' : 'un'}install failed with code ${code}`);
      }
      else {
        console.log(`\n> ${displayPluginNames} package(s) ${isAdd ? '' : 'un'}install completed`);
        console.log(`🎉  Plugin ${displayPluginNames} ${isAdd ? '' : 'un'}installed successfully!\n`);
      }
      
      callback(null, options);
      installCmd.kill();
    });
    installCmd.on('error', (code, signal) => {
      console.log(code, signal)
      console.log(`> ${displayPluginNames} ${isAdd ? '' : 'un'}install failed with code ${code}`);
      callback(code, options);
      installCmd.kill(code);
    });
  } catch (error) {
    callback(code, options);
  }
}

/**
 * @param {string[]} names
 * @returns string
 */
function displayNames(names) {
  if (names.length > 3) {
    return '[' + names.slice(0, 3).join('], [') + ']' + ` and ${names.length - 3} more plugin`;
  }
  else {
    return '[' + names.join('], [') + '] plugin';
  }
}


module.exports = {
  /**
 * @param {string} pluginNames
 * @param {{
   *  isLocally: boolean;
   *  callback: (error?, options) => void
   * }} [options] 
   */
  install: function (pluginNames, options) {
    installPlugins(pluginNames, { isAdd: true, ...options });
  },

  /**
 * @param {string} pluginNames
 * @param {{
   *  isLocally: boolean;
   *  callback: (error?, options) => void
   * }} [options] 
   */
  uninstall: function (pluginNames, options) {
    installPlugins(pluginNames, { isAdd: false, ...options });
  },
}
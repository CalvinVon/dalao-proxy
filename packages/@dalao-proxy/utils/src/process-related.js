const os = require('os');


/**
 * Determine the scripts is running with global argument
 * 
 * Support `process.argv` and run under *npm hooks* (npm under v6)
 * @returns {boolean}
 */
function hasGlobalArgs() {
  const includeGlobalArgs = argvs => argvs.some(arg => /^-g$|^--global$/.test(arg));
  const processArgs = process.argv;
  // npm under v6
  const npmHooksArgs = JSON.parse(process.env.npm_config_argv || '{}').original || [];
  // npm 7+
  const sudoGlobal = !!(process.env.SUDO_COMMAND || '').match(/-g|--global/);

  const processGlobal = includeGlobalArgs(processArgs);
  const npmHooksGlobal = includeGlobalArgs(npmHooksArgs);
  return processGlobal || npmHooksGlobal || sudoGlobal;
}

/**
 * Append original user's info to the `os.userInfo()`
 * @returns {{
 * origin: os.UserInfo;
 * user: boolean;
 * sudo: boolean;
 * root: boolean;
 * } & os.UserInfo}
 */
function getProcessUserInfo() {
  const userInfo = os.userInfo();
  const { SUDO_UID, SUDO_GID, SUDO_USER } = process.env;

  userInfo.origin = {
    uid: parseInt(SUDO_UID) || userInfo.uid,
    gid: parseInt(SUDO_GID) || userInfo.gid,
    username: SUDO_USER || userInfo.username,
  };
  userInfo.sudo = userInfo.uid !== userInfo.origin.uid;
  userInfo.root = userInfo.uid === 0 && userInfo.gid === 0;
  userInfo.user = userInfo.uid === userInfo.origin.uid && userInfo.gid === userInfo.origin.gid;
  return userInfo;
}

function setProcessUser(uid) {
  if (os.platform() !== 'win32') {
    process.setuid(uid);
  }
}

/**
 * Set process user to the original user
 */
function setAsOriginalUser() {
  const userInfo = getProcessUserInfo();
  setProcessUser(userInfo.origin.uid);
}


/**
 * Set process user to the current effective user
 */
function restoreProcessUser() {
  const userInfo = getProcessUserInfo();
  setProcessUser(userInfo.uid);
}

module.exports = {
  hasGlobalArgs,
  getProcessUserInfo,
  setProcessUser,
  setAsOriginalUser,
  restoreProcessUser,
};

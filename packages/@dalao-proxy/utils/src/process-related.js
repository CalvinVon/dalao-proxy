const os = require('os');


/**
 * Determine the scripts is running with global argument
 * 
 * Support `process.argv` and run under *npm hooks*
 * @returns {boolean}
 */
function hasGlobalArgs() {
  const includeGlobalArgs = argvs => argvs.some(arg => /^-g$|^--global$/.test(arg));
  const processArgs = process.argv;
  const npmHooksArgs = JSON.parse(process.env.npm_config_argv || '{}').original || [];
  console.log({ processArgs, npmHooksArgs });

  const processGlobal = includeGlobalArgs(processArgs);
  const npmHooksGlobal = includeGlobalArgs(npmHooksArgs);
  console.log({ npmHooksGlobal, processGlobal });
  return processGlobal || npmHooksGlobal;
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

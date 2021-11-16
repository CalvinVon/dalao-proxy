const os = require('os');

/**
 * Append original user's info to the `os.userInfo()`
 * @returns {{ origin: os.UserInfo } & os.UserInfo}
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
  getProcessUserInfo,
  setProcessUser,
  setAsOriginalUser,
  restoreProcessUser,
};

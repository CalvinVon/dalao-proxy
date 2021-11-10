const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { version } = require('../package.json');
const Util = module.exports = {};
const Cookie = Util.Cookie = {};
const SSO = Util.SSO = {};

const basePath = path.join(
  process.cwd(),
  'node_modules',
  '.sso-cookie',
);

Cookie.filePath = path.join(
  basePath,
  'cookie.json'
);

Cookie.write = (cookies) => {
  fs.ensureFileSync(Cookie.filePath);
  fs.writeJsonSync(Cookie.filePath, { default: cookies });
}

Cookie.get = (route = 'default') => {
  fs.ensureFileSync(Cookie.filePath);
  const json = fs.readJsonSync(Cookie.filePath) || {};
  return json[route];
}

SSO.filePath = path.join(
  basePath,
  'user.json'
);

/**
 * Get user sso data
 * @returns {Promise<{ username: string; password: string; }>} user
 */
SSO.queryUser = async () => {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: '请输入用户名',
      },
      {
        type: 'password',
        name: 'password',
        message: '请输入密码',
      },
    ]);
    return answer;
  } catch (error) {
    console.log('[plugin-sso-cookie] user interrupted')
  }
}


/**
 * Write user sso data
 * @param {{ username: string; password: string; }} user
 */
SSO.writeUser = (user) => {
  fs.ensureFileSync(SSO.filePath);
  const protectStr = `plugin-sso-cookie:${version}=${JSON.stringify(user)}`;
  fs.writeFileSync(SSO.filePath, Buffer.from(protectStr).toString('base64'));
}

/**
 * Get user sso data
 * @returns {{ username: string; password: string; } | null} user
 */
SSO.getUser = () => {
  try {
    fs.ensureFileSync(SSO.filePath);
    const protectStr = fs.readFileSync(SSO.filePath).toString();
    const user = Buffer.from(protectStr, 'base64').toString();
    const [, userStr] = user.split('=');
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
}

Util.log = (...message) => {
  console.log('[plugin-sso-cookie] ', ...message);
}
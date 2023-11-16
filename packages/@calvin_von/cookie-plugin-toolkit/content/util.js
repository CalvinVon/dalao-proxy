const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { version } = require('../package.json');
const Util = module.exports = {};
const Cookie = Util.Cookie = {};
const Auth = Util.Auth = {};

let packageName = '@calvin_von/cookie-plugin-toolkit';

const basePath = path.join(
  require('os').homedir(),
  '.dalao-cookie',
);

Cookie.filePath = path.join(
  basePath,
  'cookie.json'
);

Cookie.write = (cookies, platform) => {
  const content = Cookie.get();
  fs.writeJsonSync(Cookie.filePath, {
    ...content,
    [platform]: cookies,
  });
}

/**
 * 
 * @param {string} [platform] 
 */
Cookie.get = platform => {
  try {
    fs.ensureFileSync(Cookie.filePath);
    const json = fs.readJsonSync(Cookie.filePath) || {};

    if (platform) {
      return json[platform];
    }
    return json;
  } catch (error) {
    return null;
  }
}

/**
 * 
 * @param {string} [platform] 
 */
Cookie.watch = (callback) => {
  fs.ensureFile(Cookie.filePath, (err) => {
    if (err) return;

    fs.unwatchFile(Cookie.filePath, callback);
    fs.watchFile(Cookie.filePath, callback);
  });
}

Auth.filePath = path.join(
  basePath,
  'user.json'
);

/**
 * Get user auth data
 * @returns {Promise<{ username: string; password: string; }>} user
 */
Util.queryUserInput = async () => {
  try {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Please input username',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Please input password',
      },
    ]);
    return answer;
  } catch (error) {
    Util.log('user interrupted')
  }
}


/**
 * Write user auth data
 * @param {{ username: string; password: string; }} user
 * @param {string} type
 */
Auth.writeUser = (user, type) => {
  const content = Auth.getUser();
  const protectStr = `cookie-plugin-toolkit:${version}=${JSON.stringify({
    ...content,
    [type]: user
  })}`;
  fs.writeFileSync(Auth.filePath, Buffer.from(protectStr).toString('base64'));
}

/**
 * Get user auth data
 * @param {string} [type]
 * @returns {{ username: string; password: string; } | null} user
 */
Auth.getUser = (type) => {
  try {
    fs.ensureFileSync(Auth.filePath);
    const protectStr = fs.readFileSync(Auth.filePath).toString();
    const user = Buffer.from(protectStr, 'base64').toString();
    const [, userStr] = user.split('=');
    const content = JSON.parse(userStr) || {};

    if (type) {
      return content[type] || {};
    }
    return content;
  } catch (error) {
    return null;
  }
}

Util.log = (...message) => {
  console.log(`[${packageName}] `, ...message);
}

Util.setPackageName = (name) => {
  packageName = name;
}
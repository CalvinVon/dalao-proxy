const Auth = module.exports;
const axios = require('axios');
const Util = require('./util');
const Adapter = require('./adapter');

let platform,
  /**
   * @type {import('../types').Adapter}
   */
  adapter,
  /**
   * @type {import('../types').User}
   */
  user,
  noWorking;

const request = axios.default.create({
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 303;
  },
});

request.interceptors.request.use(config => {
  Util.log(`${config.method} ${config.url}`);
  return config;
});
request.interceptors.response.use(
  res => {
    Util.log(`${res.config.method} ${res.config.url} ${res.status}`);
    if (res.status === 200 || res.status === 302) return res;
    if (res.data?.errno === 0) {
      return res;
    }
    return Promise.reject(res);
  },
  err => {
    Util.log(`${err.config.method} ${err.config.url} ${err.status}`);
    return Promise.reject(err.data);
  }
);

/**
 * @param {string} platform
 * @param {boolean} [logUser] 是否提示用户
 */
Auth.setPlatform = (_platform, logUser = true) => {
  platform = _platform;
  adapter = Adapter(platform);
  
  if (!adapter) {
    Util.log('[[ platform NOT SUPPORTED, given platform not found in buildin platforms ]]\n');
    noWorking = true;
    return;
  }
  
  user = Util.Auth.getUser(adapter.userType);
  if (!user || !Object.keys(user).length) {
    logUser && Util.log('[[ YOU SHOULD RUN COMMAND `dalao-proxy cookie set` FIRST TO ENABLE THIS PLUGIN ]]\n');
    noWorking = true;
  }
  
}

Auth.getAdapter = () => adapter;
Auth.getUser = () => user;
Auth.getUserType = () => adapter && adapter.userType;
Auth.isWorking = () => !noWorking;

Auth.requestCookie = async () => {
  if (noWorking) {
    return;
  }

  try {
    const cookie = await adapter.auth(request, user, adapter);

    Util.log('writing cookie...');
    Util.Cookie.write(cookie, platform);
    Util.log('Cookie refresh SUCCEED!');
    return cookie;
  } catch (error) {
    Util.log('Cookie request failed');
    throw error;
  }
}


/**
 * @param {any} response
 * @returns {boolean} should pass
 */
Auth.interceptResponse = (response) => {
  if (noWorking) {
    return;
  }

  return adapter.intercept(response);
}
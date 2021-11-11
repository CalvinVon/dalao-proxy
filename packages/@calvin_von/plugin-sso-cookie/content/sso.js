const SSOAuth = module.exports;
const axios = require('axios');
const url = require('url');
const Util = require('./util');

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
    if (res.status === 302) return res;
    if (res.data.code === 0 && res.data.errno === 0) {
      return res;
    }
    return Promise.reject(res);
  },
  err => {
    Util.log(`${err.config.method} ${err.config.url} ${err.status}`);
    return Promise.reject(err.data);
  }
);

SSOAuth.authSSO = async () => {
  try {
    const user = Util.SSO.getUser();
    if (!user) {
      Util.log('[[ YOU SHOULD RUN COMMAND `dalao-proxy cookie set` FIRST TO ENABLE THIS PLUGIN ]]');
      return;
    }

    const params = new url.URLSearchParams({
      "username": user.username,
      "password": user.password,
      // "redirect_uri": "https://mis-test.diditaxi.com.cn/auth?app_id=1842&version=1.0&jumpto=http://boss-test.intra.xiaojukeji.com&callback_index=0",
      // "redirect_uri": "https://mis-test.diditaxi.com.cn/auth?app_id=1842&version=1.0&jumpto=http://boss-test.intra.xiaojukeji.com&callback_index=0",
      // redirect_uri: "http://passport.qatest.didichuxing.com/passport/login/v5/signInByPassword"
    });

    // const { data: loginData } = await request('https://me-test.xiaojukeji.com/user_login', {
    const { data: loginData } = await request('http://passport.qatest.didichuxing.com/passport/login/v5/signInByPassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: params.toString()
    });

    const callbackUrl = loginData.redirect;
    const { headers: { location, 'set-cookie': _cookie } } = await request(callbackUrl);

    const { headers: { 'set-cookie': cookie } } = await request(location, {
      headers: { cookie: _cookie }
    });
    Util.log('writing cookie...');
    Util.Cookie.write(cookie);
    Util.log('Cookie refresh SUCCEED!');

  } catch (error) {
    Util.log('SSO auth failed');
    throw error;
  }
}


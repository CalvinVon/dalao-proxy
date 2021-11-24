const Auth = require('./content/auth');
const Util = require('./content/util');


let pluginConfig, hasUserInfo, runningLocker;


function beforeCreate() {
    pluginConfig = this.config;
    hasUserInfo = !!Util.Auth.getUser(Auth.getUserType());
    Auth.setPlatform(pluginConfig.platform);

    if (!hasUserInfo) {
        Util.log('[[ YOU SHOULD RUN COMMAND `dalao-proxy cookie set` FIRST TO ENABLE THIS PLUGIN ]]');
        return;
    }
    if (pluginConfig.refreshOnStart) {
        Auth.requestCookie();
    }
}


function onProxySetup(context) {
    if (isGivenRoute(context)) {
        const { proxy } = context;
        const { request } = proxy;
        try {
            const cookies = Util.Cookie.get(pluginConfig.platform);
            request.setHeader('cookie', cookies);
        } catch (error) {
            Util.log('no cookies found, hold page and try to send another request.');
        }
    }
}

async function onProxyRespond(context, next) {
    if (isGivenRoute(context)) {
        try {
            if (!context.proxy.data.response) {
                return next(null);
            }
            const res = context.proxy.data.response.data;
            const shouldRefresh = Auth.interceptResponse(res);
            if (shouldRefresh) {
                Util.log('login failed status detected, start to refresh cookies');
                await requestCookie();
            }
        } catch (error) {
            console.error(error);
        }
    }
    next(null);
}


module.exports = {
    beforeCreate,
    onProxySetup,
    onProxyRespond,
};


async function requestCookie() {
    if (runningLocker) {
        return;
    }

    runningLocker = true;
    await Auth.requestCookie();
    runningLocker = false;
}

function isGivenRoute(context) {
    return hasUserInfo && pluginConfig.routes.includes(context.matched.path);
}
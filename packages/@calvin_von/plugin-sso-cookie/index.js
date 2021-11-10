const SSO = require('./content/sso');
const Util = require('./content/util');

const hasUserInfo = !!Util.SSO.getUser();

let pluginConfig;
let firstRequest,
    runningLocker,
    unlockFollowingReqs,
    followingReqsPending = Promise.resolve();

const lockFollowingReqs = () => {
    followingReqsPending = new Promise(resolve => {
        unlockFollowingReqs = () => {
            followingReqsPending._resolved = true
            resolve();
        };
    });
}


function beforeCreate({ config }) {
    if (!hasUserInfo) {
        Util.log('[[ YOU SHOULD RUN COMMAND `dalao-proxy cookie set` FIRST TO ENABLE THIS PLUGIN ]]');
        return;
    }
    pluginConfig = config;
    firstRequest = true;
    // setLocker(SSO.authSSO);
}
function onRouteMatch(context, next) {
    if (firstRequest && isGivenRoute(context)) {
        lockFollowingReqs();
        firstRequest = false;
        next(null);
    }
    else {
        followingReqsPending.then(() => {
            next(null);
        });
    }
}

function onProxySetup(context) {
    const { proxy } = context;
    const { request } = proxy;
    try {
        const cookies = Util.Cookie.get();
        request.setHeader('cookie', cookies);
    } catch (error) {
        console.warn('[plugin-sso-cookie] no cookies found, hold page and try to send another request.');
    }
}

async function onProxyRespond(context, next) {
    if (isGivenRoute(context)) {
        try {
            const res = context.proxy.data.response.data;
            if (res.code === '300' || res.msg === '登录信息失效') {
                console.warn('[plugin-sso-cookie] login failed status detected, start to refresh cookies');
                if (followingReqsPending._resolved) {
                    lockFollowingReqs();
                }
                await authSSO();
            }
        } catch (error) {
            // console.error(error);
        }
        unlockFollowingReqs();
    }
    next(null);
}


module.exports = {
    beforeCreate,
    onRouteMatch,
    onProxySetup,
    onProxyRespond,
};


async function authSSO() {
    if (runningLocker) {
        return;
    }

    runningLocker = true;
    await SSO.authSSO();
    runningLocker = false;
}

function isGivenRoute(context) {
    return hasUserInfo && pluginConfig.ssoCookie.routes.includes(context.matched.path);
}
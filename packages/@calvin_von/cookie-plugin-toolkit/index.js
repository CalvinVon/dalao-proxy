const Auth = require('./content/auth');
const Util = require('./content/util');
const querystring = require('querystring');
const { lockify } = require('fn.locky');
let BodyParser;

let hasUserInfo, cookie;
let pluginConfig, attachAt, attachField;
const requestCookie = lockify(Auth.requestCookie);


function beforeCreate() {
    BodyParser = this.context.exports.BodyParser;

    pluginConfig = this.config;
    cookie = Util.Cookie.get(pluginConfig.platform);
    attachField = pluginConfig.attachField || 'cookie'
    if (Array.isArray(pluginConfig.attachAt)) {
        attachAt = pluginConfig.attachAt || [];
    }
    else {
        attachAt = ['header'];
    }

    hasUserInfo = !!Util.Auth.getUser(Auth.getUserType());
    Auth.setPlatform(pluginConfig.platform);

    if (!hasUserInfo) {
        Util.log('[[ YOU SHOULD RUN COMMAND `dalao-proxy cookie set` FIRST TO ENABLE THIS PLUGIN ]]');
        return;
    }
    if (pluginConfig.refreshOnStart) {
        requestCookie();
    }
}

function beforeProxy(context, next) {
    if (attachAt.includes('query') && isGivenRoute(context)) {
        const newUrl = new URL(context.proxy.uri);
        newUrl.searchParams.set(attachField, cookie);
        context.proxy.URL = newUrl;
        context.proxy.uri = newUrl.toString();
        next();
    }
    else {
        next();
    }
}


function onProxySetup(context) {
    if (isGivenRoute(context)) {
        const { proxy } = context;
        const { request } = proxy;
        try {
            if (attachAt.includes('header')) {
                request.setHeader(attachField, cookie);
            }
        } catch (error) {
            Util.log('no cookies found, hold page and try to send another request.');
        }
    }
}

function onPipeRequest(context, next) {
    const enable = attachAt.includes('body') && isGivenRoute(context);
    if (!enable) {
        next(null, context.chunk);
        return;
    }

    const contentType = context.request.headers['content-type'];
    if (context.isLastChunk) {
        const content = BodyParser.parse(contentType, context.chunk);

        if (/json/.test(contentType)) {
            content[attachField] = cookie;
            next(null, Buffer.from(JSON.stringify(content)));
        }
        else if (/application\/x-www-form-urlencoded/.test(contentType)) {
            content[attachField] = cookie;
            const buffer = querystring.stringify(content);
            next(null, Buffer.from(buffer));
        }
        else {
            next(null, context.chunk);
        }
    }
    else {
        next(null, context.chunk);
    }
}

async function onProxyDataRespond(context, next) {
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
                cookie = Util.Cookie.get(pluginConfig.platform);
            }
        } catch (error) {
            console.error(error);
        }
    }
    next(null);
}


module.exports = {
    beforeCreate,
    beforeProxy,
    onProxySetup,
    onProxyDataRespond,
    onPipeRequest
};



function isGivenRoute(context) {
    return hasUserInfo && pluginConfig.routes.includes(context.matched.path);
}
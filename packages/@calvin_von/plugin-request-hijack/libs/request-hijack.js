const { hijack, version } = window.__hijackConfig || {};

const { rewrite, smartInfer, prefix, excludes, logger } = hijack;

const hmrRewrite = [
    { from: '(^manifest.*hot-update\.json)', to: location.host + '/$1' },
]


const HTTP_PROTOCOL_REG = new RegExp(/^(https?:)?\/\//);
const WS_PROTOCOL_REG = new RegExp(/^(wss?:)?\/\//);

const isSecure = location.protocol === 'https:';

function addHttpProtocol(urlFragment) {
    if (HTTP_PROTOCOL_REG.test(urlFragment)) {
        return urlFragment.startsWith('//') ? location.protocol + urlFragment : urlFragment;
    }
    return urlFragment.startsWith('/')
        ? location.origin + urlFragment
        : location.protocol + '//' + urlFragment;
}

function addWsProtocol(urlFragment) {
    const wsProtocol = `ws${isSecure ? 's' : ''}:`;
    if (WS_PROTOCOL_REG.test(urlFragment)) {
        return urlFragment.startsWith('//') ? wsProtocol + urlFragment.slice(2) : urlFragment;
    }
    return urlFragment.startsWith('/')
        ? location.origin.replace(/^http/, 'ws') + urlFragment
        : wsProtocol + '//' + urlFragment;
}


function splitTargetAndPath(url) {
    const urlObject = new URL(url);
    const target = urlObject.origin;
    return {
        target,
        path: urlObject.href.replace(target, '')
    };
}


function shouldExclude(url) {
    if (url.startsWith('blob:')) return true;

    if (Array.isArray(excludes)) {
        return excludes.some(it => new RegExp(it).test(url));
    }
    else if (typeof excludes === 'string' || excludes instanceof RegExp) {
        return new RegExp(excludes).test(url);
    }
    return false;
}

function rewriteUrl(url, isWS = false) {
    let newUrl = url;
    let matched = false;

    const rules = hmrRewrite;
    // 使用 rewrite 规则匹配重写
    if (Array.isArray(rewrite) && rewrite.length) {
        rules.push(...rewrite);
    }
    rules.forEach(({ from, to }) => {
        const reg = new RegExp(from);
        if (reg.test(newUrl)) {
            matched = true;
            newUrl = newUrl.replace(reg, to);
        }
    });

    newUrl = isWS ? addWsProtocol(newUrl) : addHttpProtocol(newUrl);
    
    if (!matched) {
        const parsedUrl = new URL(newUrl, location.origin); // 使用 location.origin 作为基础
        newUrl = parsedUrl.pathname + parsedUrl.search;

        if (prefix) {
            const hasProtocol = isWS
                ? WS_PROTOCOL_REG.test(newUrl)
                : HTTP_PROTOCOL_REG.test(newUrl);

            if (!hasProtocol) {
                newUrl = prefix + (newUrl.startsWith('/') ? '' : '/') + newUrl;
            }
        }
    }


    return newUrl.replace(/^\/\//, '/');
}

function log(...message) {
    console.log(
        `%c Plugin Request Hijack ${version} %c`,
        'background: #f57c00 ; padding: 1px; border-radius: 3px;  color: #fff',
        'background:transparent',
        ...message
    );
}


function hijackFetch() {
    const originFetch = window.fetch;
    const wrappedFetch = new Proxy(originFetch, {
        apply(target, thisArg, args) {
            const input = args[0];
            if (typeof input === 'string' && !shouldExclude(input)) {
                let url = rewriteUrl(input);

                if (logger) {
                    log(`Request sent to [${input}] by fetch has been rewritten`);
                }
                return Reflect.apply(originFetch, thisArg, [url, args[1]]);
            }
            return Reflect.apply(originFetch, thisArg, args);
        }
    });

    window.fetch = wrappedFetch;
    log('[window.fetch] hijack succeed!');
}

function hijackXHR() {
    const originXMR = window.XMLHttpRequest;

    class HijackedXMLHttpRequest extends XMLHttpRequest {
        open(method, url, ...args) {
            if (shouldExclude(url)) {
                super.open(method, url, ...args);
            }
            else {
                const newUrl = rewriteUrl(url);

                if (logger) {
                    log(`Request sent to [${url}] by XHR has been rewritten`);
                }
                super.open(method, newUrl, ...args);
            }
        }
    }

    const wrappedXMR = new Proxy(originXMR, {
        construct(target, argumentsList) {
            return Reflect.construct(target, argumentsList, HijackedXMLHttpRequest);
        }
    });

    window.XMLHttpRequest = wrappedXMR;
    log('[window.XMLHttpRequest] hijack succeed!');
}

function hijackWebSocket() {
    const originWebSocket = window.WebSocket;

    const wrappedWebSocket = new Proxy(originWebSocket, {
        construct(target, args) {
            let url = args[0];
            if (typeof url === 'string' && !shouldExclude(url)) {
                url = rewriteUrl(url, true);

                if (logger) {
                    log(`WebSocket connection to [${args[0]}] has been rewritten to ${url}`);
                }
                args[0] = url;
            }
            return Reflect.construct(target, args);
        }
    });

    window.WebSocket = wrappedWebSocket;
    log('[window.WebSocket] hijack succeed!');
}

hijackFetch();
hijackXHR();
hijackWebSocket();

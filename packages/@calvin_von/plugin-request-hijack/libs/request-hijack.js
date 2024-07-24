const { hijack, version } = window.__hijackConfig || {};

const { rewrite, smartInfer, prefix, excludes, logger } = hijack;


const HTTP_PROTOCOL_REG = new RegExp(/^(https?:)?\/\//);
const WS_PROTOCOL_REG = new RegExp(/^(wss?:)?\/\//);

const isSecure = location.protocol === 'https:';

// make url complete with http/https
function addHttpProtocol(urlFragment) {
    const result = urlFragment.match(HTTP_PROTOCOL_REG);
    if (!result) {
        if (urlFragment.startsWith('/')) {
            return location.origin + urlFragment;
        }
        return location.protocol + '//' + urlFragment;
    }
    else {
        return (result[1] ? '' : location.protocol) + urlFragment;
    }
}

function addWsProtocol(urlFragment) {
    const result = urlFragment.match(WS_PROTOCOL_REG);
    const wsProtocal = `ws${isSecure ? 's' : ''}:`;
    if (!result) {
        if (urlFragment.startsWith('/')) {
            return location.origin + urlFragment;
        }
        return wsProtocal + '//' + urlFragment;
    }
    else {
        return (result[1] ? '' : wsProtocal) + urlFragment;
    }
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
    if (Array.isArray(excludes)) {
        return excludes.some(it => new RegExp(it).test(url));
    }
    else if (typeof excludes === 'string' || excludes instanceof RegExp) {
        return new RegExp(excludes).test(url);
    }
    return false;
}

function rewriteUrl(url, isWS) {
    let newUrl = isWS ? addWsProtocol(url) : addHttpProtocol(url);
    let matched = false;
    if (Array.isArray(rewrite) && rewrite.length) {
        rewrite.forEach(({ from, to }) => {
            const replaceText = to;
            const reg = new RegExp(from);
            matched = reg.test(newUrl);
            if (matched) {
                newUrl = newUrl.replace(reg, replaceText);
            }
        });
    }

    if (!matched) {
        newUrl = splitTargetAndPath(newUrl).path;
    }


    if (prefix && !HTTP_PROTOCOL_REG.test(newUrl) && !isWS) {
        newUrl = prefix + newUrl;
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
                    log(`WebSocket connection to [${args[0]}] has been rewritten`);
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

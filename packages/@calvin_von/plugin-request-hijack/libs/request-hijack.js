const { proxyTable, hijack } = window.__hijackConfig || {};
if (!proxyTable || !hijack || !hijack.enable) {
  console.warn('[plugin-hijack] initialize failed');
}

const { rewrite: _rewrite, useSmartInfer, prefix } = hijack;
const rewrite = _rewrite || [];

if (useSmartInfer && (!rewrite || !Array.isArray(rewrite) || !rewrite.length)) {
  Object.keys(proxyTable).forEach(key => {
    const { target } = proxyTable[key];
    rewrite.push({
      from: target,
      to: key
    });
  });
}

const originFetch = fetch;

const wrappedFetch = new Proxy(originFetch, {
  apply(target, thisArg, args) {
    console.log('[plugin-hijack] parameters asign to ', target, ' is ', args);
    const input = args[0];
    if (typeof input === 'string') {
      let url = input;

      if (Array.isArray(rewrite) && rewrite.length) {
        rewrite.forEach(({ from, to }) => {
          const replaceText = to;
          const reg = new RegExp(from);
          url = url.replace(reg, replaceText);
        });
      }
      else {
        url = splitTargetAndPath(input).path;
      }


      if (prefix && !HTTP_PROTOCOL_REG.test(url)) {
        url = prefix + url;
      }
      return Reflect.apply(originFetch, thisArg, [url, args[1]]);
    }
    return Reflect.apply(originFetch, thisArg, args);
  }
});

window.fetch = wrappedFetch;
console.log('[plugin-hijack] `window.fetch` has been hijacked');



const HTTP_PROTOCOL_REG = new RegExp(/^(https?:\/\/)/);

// make url complete with http/https
function addHttpProtocol(urlFragment) {
  if (!HTTP_PROTOCOL_REG.test(urlFragment)) {
    return 'http://' + urlFragment;
  }
  else {
    return urlFragment;
  }
}


function splitTargetAndPath(url) {
  const { origin: target } = new URL(addHttpProtocol(url));
  return {
    target,
    path: url.replace(target, '')
  };
}
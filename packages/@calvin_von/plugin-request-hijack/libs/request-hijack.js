const { proxyTable, hijack, version } = window.__hijackConfig || {};
if (!proxyTable || !hijack || !hijack.enable) {
  log('[plugin-hijack] initialize failed');
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


function rewriteUrl(url) {
  let newUrl = url;
  if (Array.isArray(rewrite) && rewrite.length) {
    rewrite.forEach(({ from, to }) => {
      const replaceText = to;
      const reg = new RegExp(from);
      newUrl = newUrl.replace(reg, replaceText);
    });
  }
  else {
    newUrl = splitTargetAndPath(newUrl).path;
  }


  if (prefix && !HTTP_PROTOCOL_REG.test(newUrl)) {
    newUrl = prefix + newUrl;
  }

  return newUrl.replace(/^\/\//, '/');
}

function log(...message) {
  console.log(
    `%c Plugin Request Hijack ${version} %c`,
    'background: #3f51b5 ; padding: 1px; border-radius: 3px;  color: #fff',
    'background:transparent',
    ...message
  );
}


function hijackFetch() {
  const originFetch = window.fetch;
  const wrappedFetch = new Proxy(originFetch, {
    apply(target, thisArg, args) {
      log('parameters asign to ', target, ' is ', args);
      const input = args[0];
      if (typeof input === 'string') {
        let url = rewriteUrl(input);

        return Reflect.apply(originFetch, thisArg, [url, args[1]]);
      }
      return Reflect.apply(originFetch, thisArg, args);
    }
  });

  window.fetch = wrappedFetch;
  log('`window.fetch` has been hijacked');
}

function hijackXHR() {
  const originXMR = window.XMLHttpRequest;

  class HijackedXMLHttpRequest extends XMLHttpRequest {
    open(method, url, ...args) {
      log('parameters asign to ', this, ' is ', [method, url, ...args]);
      super.open(method, rewriteUrl(url), ...args);
    }
  }

  const wrappedXMR = new Proxy(originXMR, {
    construct(target, argumentsList, newTarget) {
      return Reflect.construct(target, argumentsList, HijackedXMLHttpRequest);
    }
  });

  window.XMLHttpRequest = wrappedXMR;
  log('`window.XMLHttpRequest` has been hijacked');

}

hijackFetch();
hijackXHR();

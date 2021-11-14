const { hijack, version } = window.__hijackConfig || {};

const { rewrite, smartInfer, prefix } = hijack;


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
      if (typeof input === 'string') {
        let url = rewriteUrl(input);
        
        log(`Request sent to [${input}] by fetch has been rewritten to [${url}]`);
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
      const newUrl = rewriteUrl(url);
      log(`Request sent to [${url}] by XHR has been rewritten to [${newUrl}]`);
      super.open(method, newUrl, ...args);
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

hijackFetch();
hijackXHR();

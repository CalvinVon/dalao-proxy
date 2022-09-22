/**
 * @type {import('./type').HijackOptions}
 */
const defaultOptions = {
  prefix: '',
  smartInfer: true,
  page: /^\/$|.html?/,
  excludes: [/hot-update/]
};

function setting() {
  return {
    defaultEnable: true,
    optionsField: 'requestHijack',
    dependFields: ['proxyTable', 'target'],
    enableField: 'enable',
  }
}

/**
 * @param {import('./type').HijackOptions} requestHijack
 * @param {import('./type').ProxyTable} proxyTable
 * @param {string} version
 */
function parser(requestHijack, proxyTable, target) {
  const {
    rewrite: _rewrite,
    smartInfer
  } = requestHijack || {};

  const rewrite = _rewrite || [];

  if (smartInfer && (!rewrite || !Array.isArray(rewrite) || !rewrite.length)) {
    Object.keys(proxyTable).forEach(key => {
      const { target: ruleTarget, path } = proxyTable[key];
      rewrite.push({
        from: addHttpProtocol(ruleTarget || target) + path,
        to: key
      });
    });
  }

  return {
    ...defaultOptions,
    ...requestHijack,
    rewrite,
  };
}

module.exports = {
  setting,
  parser
};


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

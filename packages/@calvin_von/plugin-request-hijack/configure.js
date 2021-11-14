/**
 * @type {import('./type').HijackOptions}
 */
const defaultOptions = {
  prefix: '',
  smartInfer: true,
  page: /^\/$|.html?$/,
};

function setting() {
  return {
    defaultEnable: true,
    optionsField: 'requestHijack',
    depsField: ['proxyTable', 'version'],
    enableField: 'enable',
  }
}

/**
 * @param {import('./type').HijackOptions} requestHijack
 * @param {import('./type').ProxyTable} proxyTable
 * @param {string} version
 */
function parser(requestHijack, proxyTable) {
  const {
    rewrite: _rewrite,
    smartInfer
  } = requestHijack;

  const rewrite = _rewrite || [];

  if (smartInfer && (!rewrite || !Array.isArray(rewrite) || !rewrite.length)) {
    Object.keys(proxyTable).forEach(key => {
      const { target } = proxyTable[key];
      rewrite.push({
        from: target,
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


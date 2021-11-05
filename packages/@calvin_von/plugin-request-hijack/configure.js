const defaultOptions = {
  prefix: '',
  /**
   * 从 proxyTable 智能推断为 rewrite
   */
  useSmartInfer: true,
};

function setting() {
  return {
    defaultEnable: true,
    optionsField: 'requestHijack',
    enableField: 'enable',
  }
}

function parser(rawUserConfig) {
  return {
    ...defaultOptions,
    ...rawUserConfig,
  };
}

module.exports = {
  setting,
  parser
};

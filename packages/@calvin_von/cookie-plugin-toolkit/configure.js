const defaultOptions = {
  // groups: false,
  routes: [],
  platform: '',
  refreshOnStart: false,
};

function setting() {
  return {
    defaultEnable: true,
    optionsField: 'cookie',
    enableField: 'enable',
  }
}

function parser(rawUserConfig) {
  return {
    ...defaultOptions,
    ...rawUserConfig
  };
}

module.exports = {
  setting,
  parser
};

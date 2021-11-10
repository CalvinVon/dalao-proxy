const defaultOptions = {
  // groups: false,
  routes: []
};

function setting() {
  return {
    defaultEnable: true,
    optionsField: 'ssoCookie',
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

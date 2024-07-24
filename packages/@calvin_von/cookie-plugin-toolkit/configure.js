const defaultOptions = {
  // groups: false,
  routes: [],
  platform: '',
  refreshOnStart: false,
  attachField: 'cookie',
  /** @type {('header'|'body'|'query')[] } */
  attachAt: ['header'],
  /** @type {import('./types').Adapter} */
  adapter: {},
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

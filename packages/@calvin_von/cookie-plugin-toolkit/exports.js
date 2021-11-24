module.exports = {
  index: require('./index'),
  configure: require('./configure'),
  commander: require('./commander'),
  setAdapters: require('./content/adapter').setAdapters,
  setPackageName: require('./content/util').setPackageName,
};

const NpmRelateds = require('./npm-related');
const ProcessRelateds = require('./process-related');
const pluginResolver = require('./package-resolver');
const packageInstaller = require('./package-installer');

module.exports = {
  ...NpmRelateds,
  ...ProcessRelateds,
  pluginResolver,
  packageInstaller,
};

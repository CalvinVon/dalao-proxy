const { getGlobalPackagePath } = require('./npm-related');
const path = require('path');

/**
 * @param {string} packageName
 * @param {string[]} [paths]
 * @returns {string}
 */
function pluginResolver(packageName, paths) {
  return path.join(
    require.resolve(packageName, {
      paths: [
        process.cwd(),
        getGlobalPackagePath(),
        ...(paths || []),
      ]
    }),
    // remove `index.js` string
    '..'
  );
}

module.exports = pluginResolver;

const path = require('path');
const { execSync } = require('child_process');

let _prefix;

function getNpmConfigPrefixPath() {
  const prefix = _prefix || (_prefix = execSync('npm config get prefix'));
  return prefix.toString().replace(/\n/g, '');
}

function getGlobalPackagePath() {
  return path.join(getNpmConfigPrefixPath(), 'lib', 'node_modules', '/');
}


module.exports = {
  getNpmConfigPrefixPath,
  getGlobalPackagePath,
};

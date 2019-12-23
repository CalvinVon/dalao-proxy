const os = require('os');
const path = require('path');
/**
 * @example .dalaorc
 * {
 *  "plugins": [
 *      "plugin-a",
 *      "plugin-b",
 *  ]
 * }
 */
const RC_FILE_NAME = '.dalaorc';
const RC_FILE_PATH = path.resolve(os.homedir(), RC_FILE_NAME);

/**
 * Preset plugins
 */
const presetPlugins = [
    "@calvin_von/proxy-plugin-cache",
];

module.exports = {
    RC_FILE_NAME,
    RC_FILE_PATH,
    presetPlugins
};
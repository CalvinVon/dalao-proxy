
/**
 * @type {import('../types').Adapter[]}
 */
let adapters = [];
/**
 * @param {string} platform
 */
const AdapterManager = function (platform) {
  return adapters.find(item => item.platform === platform);
}


/**
* @param {import('../types').Adapter[]} _adapters
* @returns {void}
*/
AdapterManager.setAdapters = (_adapters) => {
  adapters = _adapters;
}

module.exports = AdapterManager;

const spawnSync = require('child_process').spawnSync;
const path = require('path')

require('../src/config-parser').configParser(path.resolve(__dirname, './test.config.json'));
// spawnSync('node', [
//     path.resolve(__dirname, '../bin/index'),
//     '--help'
// ], {
//     stdio: 'inherit'
// });

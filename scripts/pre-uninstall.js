const fs = require('fs');
const { RC_FILE_PATH } = require('../config/plugins');
const { plugins } = require('../config');

const fileContent = JSON.stringify(plugins);

fs.writeFile(RC_FILE_PATH, fileContent, { mode: '777' }, (err) => {
    if (err) {
        console.error('writeFile error', err)
        process.exit(-1);
    }
    process.exit(0);
});

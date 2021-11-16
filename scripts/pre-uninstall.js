const fs = require('fs');
const { RC_FILE_PATH } = require('../config/script');
const { plugins } = require('../config');

const fileContent = JSON.stringify(
    {
        plugins
    },
    null,
    4
);

fs.writeFile(RC_FILE_PATH, fileContent, { mode: '777' }, (err) => {
    if (err) {
        console.error('writeFile error', err)
        process.exit(-1);
    }
    process.exit(0);
});

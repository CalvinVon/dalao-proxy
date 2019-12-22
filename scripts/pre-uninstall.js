#!/usr/bin/env node

const fs = require('fs');
const { RC_FILE_PATH } = require('./scripts-config');
const { plugins } = require('../config');

const fileContent = JSON.stringify(
    {
        plugins
    },
    null,
    4
);

fs.writeFile(RC_FILE_PATH, fileContent, (err) => {
    if (err) {
        console.error(err)
        process.exit(-1);
    }
    process.exit(0);
});

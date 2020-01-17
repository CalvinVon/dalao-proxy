const fs = require("fs");
const path = require("path");
const { checkAndCreateCacheFolder } = require('../../utils');

exports.store = function (storeName, config) {
    const pwd = process.cwd();
    const dirname = config.dirname;
    checkAndCreateCacheFolder(dirname);
    const subdirname = generateStoreName(storeName);
    fs.mkdirSync(path.join(pwd, dirname, subdirname));

    const fileList = fs.readdirSync(dirname, { withFileTypes: true });
    fileList.forEach(file => {
        if (!file.isDirectory()) {
            const oldPath = path.join(pwd, dirname, file.name);
            const newPath = path.join(pwd, dirname, subdirname, file.name);
            try {
                fs.renameSync(oldPath, newPath);
            } catch (error) {
                console.error(error.message);
            }
        }
    });
    process.exit(0);
}


function generateStoreName(name) {
    const prefix = '.store-';
    if (name) {
        return prefix + name;
    }
    else {
        return prefix + Date.now() + '-' + Math.random().toString(16).substr(2);
    }
}
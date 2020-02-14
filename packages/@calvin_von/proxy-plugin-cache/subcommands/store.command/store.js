const fs = require("fs");
const path = require("path");
const { checkAndCreateFolder } = require('../../utils');

const pwd = process.cwd();
const STORE_NAME_PREFIX = '.store-';

const CacheStore = module.exports;

CacheStore.store = function (storeName, config, parentName) {
    const dirname = config[parentName].dirname;
    checkAndCreateFolder(dirname);

    const fileList = fs.readdirSync(dirname, { withFileTypes: true }).filter(file => !file.isDirectory());
    if (!fileList.length) return;

    const subdirname = CacheStore.resolveStoreName(storeName);
    const subdirPath = path.join(pwd, dirname, subdirname);
    fs.mkdirSync(subdirPath);

    fileList.forEach(file => {
        const oldPath = path.join(pwd, dirname, file.name);
        const newPath = path.join(subdirPath, file.name);
        try {
            fs.renameSync(oldPath, newPath);
        } catch (error) {
            console.error(error.message);
        }
    });
    return subdirname.replace(STORE_NAME_PREFIX, '');
};

CacheStore.restore = function (storeName, config, parentName) {
    const dirname = config[parentName].dirname;
    checkAndCreateFolder(dirname);

    const subdirname = CacheStore.resolveStoreName(storeName);
    const subdirPath = path.join(pwd, dirname, subdirname);

    if (fs.existsSync(subdirPath)) {
        const fileList = fs.readdirSync(subdirPath, { withFileTypes: true });
        fileList.forEach(file => {
            if (file.isDirectory()) return;

            const oldPath = path.join(subdirPath, file.name);
            const newPath = path.join(pwd, dirname, file.name);
            try {
                fs.renameSync(oldPath, newPath);
            } catch (error) {
                console.error(error.message);
            }
        });

        try {
            fs.unlinkSync(subdirPath);
        } catch (error) {
            console.error(error.message);
        }
        return true;
    }
    else {
        return false;
    }
};

CacheStore.list = function (config, parentName) {
    const dirname = config[parentName].dirname;
    checkAndCreateFolder(dirname);

    const fileList = fs.readdirSync(dirname, { withFileTypes: true });
    const storeList = [];
    fileList.forEach(file => {
        let matched;
        if (file.isDirectory() && (matched = file.name.match(CacheStore.STORE_NAME_REGEXP))) {
            storeList.push({
                dir: file.name,
                name: matched[1],
                ts: matched[2]
            });
        }
    });

    return storeList;
};


CacheStore.resolveStoreName = function resolveStoreName(name) {
    if (name) {
        return STORE_NAME_PREFIX + name;
    }
    else {
        return STORE_NAME_PREFIX + Date.now() + '-' + Math.random().toString(16).substr(2);
    }
};

CacheStore.STORE_NAME_REGEXP = new RegExp(`^${STORE_NAME_PREFIX}((?:(\\d{13})-\\w{13})|\\S+)$`);
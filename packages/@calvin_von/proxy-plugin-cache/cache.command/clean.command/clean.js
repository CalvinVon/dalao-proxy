const path = require('path');
const fs = require('fs');
const { resolveStoreName } = require('../store.command/store');
const { MOCK_FIELD_TEXT } = require('../../mock.command/mock');

/**
 * Clean cached files
 * @param {Object} opt
 * @param {Object} opt.options command options
 * @param {String} opt.options.storeName
 * @param {String} opt.options.all should clean all files
 * @param {String} opt.options.mock should clean user mock files
 * @param {String} opt.options.ext specific extensions of cache file to clean
 * @param {String} opt.config plugin config
 */
exports.cleanCache = function cleanCache({ options, config }) {
    const DEFAULT_EXTENSIONS = ['js', 'json'];
    const {
        storeName,
        all: shouldCleanAll,
        mock: shouldCleanMockFile,
        ext: userExtensions = [],
        reg: regularExpressions = []
    } = options || {};

    const extensions = [...DEFAULT_EXTENSIONS, ...userExtensions];

    const cacheDir = path.join(process.cwd(), config.dirname);
    let targetDir = cacheDir;
    if (storeName) {
        targetDir = path.join(cacheDir, resolveStoreName(storeName));
    }

    if (fs.existsSync(targetDir)) {
        const fileList = fs.readdirSync(targetDir, { withFileTypes: true });
        fileList.forEach(file => {
            const filePath = path.join(targetDir, file.name);
            if (shouldCleanAll) {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.error(error.message);
                }
                return;
            }

            if (file.isDirectory()) return;

            const fileExtension = path.extname(file.name).replace('.', '');
            if (isMeetCleanCondition()) {

                if (fileExtension === 'json') {
                    if (shouldCleanMockFile) {
                        fs.unlinkSync(filePath);
                    }
                    // judge if user mock file
                    // should in js or json format
                    // contains `[[mock]]` field and the value is `true`
                    else {
                        try {
                            if (!require(filePath)[MOCK_FIELD_TEXT]) {
                                fs.unlinkSync(filePath);
                            }
                            // remove cache
                            delete require.cache[filePath];
                        } catch (error) {
                            fs.unlinkSync(filePath);
                        }
                    }
                }
                else if (fileExtension === 'js') {
                    if (shouldCleanMockFile) {
                        fs.unlinkSync(filePath);
                    }
                }
                else {
                    fs.unlinkSync(filePath);
                }
            }


            function isMeetCleanCondition() {
                return extensions.some(ext => ext === fileExtension) || regularExpressions.some(reg => new RegExp(reg).test(file.name));
            }
        });
    }
};

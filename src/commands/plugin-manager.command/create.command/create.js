const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ejs = require('ejs');
const { Plugin } = require('../../../plugin');

const pwd = process.cwd();

const templates = {
    index: './templates/index.ejs',
    package: './templates/package.ejs',
    commander: './templates/commander.ejs',
    configure: './templates/configure.ejs',
};


module.exports = function createPlugin(opt) {
    const {
        pluginName,
        distDir = '',
        configure,
        configureOnly,
        commander,
        commanderOnly,
        complete,
        simple,
        force
    } = opt || {};

    const isCustomMode = configure && commander && (!complete);

    const pluginDir = path.join(pwd, distDir, pluginName);
    checkAndCreateDir(pluginDir);

    const createTemplate = (template, filename) => {
        const source = path.join(__dirname, template);
        const dest = path.join(pluginDir, filename);

        if (!force) {
            if (fs.existsSync(dest)) {
                console.error(chalk.red('File already exists: ' + dest));
                return;
            }
        }

        ejs.renderFile(
            source,
            {
                pluginName,
                Plugin
            },
            (err, string) => {
                if (err) {
                    console.error(chalk.red('File generate error: ' + err.message));
                    return;
                }

                fs.writeFileSync(dest, string);
                console.log(chalk.green(dest + ' generated.'));
            }
        );
    };


    if (configureOnly) {
        createTemplate(templates.configure, Plugin.FILES.CONFIGURE);
        return;
    }

    if (commanderOnly) {
        createTemplate(templates.commander, Plugin.FILES.COMMANDER);
        return;
    }


    createTemplate(templates.index, Plugin.FILES.INDEX);
    createTemplate(templates.package, Plugin.FILES.PACKAGE);

    if (isCustomMode) {
        if (configure) {
            createTemplate(templates.configure, Plugin.FILES.CONFIGURE);
        }
        if (commander) {
            createTemplate(templates.commander, Plugin.FILES.COMMANDER);
        }
        return;
    }
    else {
        if (simple) return;
        createTemplate(templates.configure, Plugin.FILES.CONFIGURE);
        createTemplate(templates.commander, Plugin.FILES.COMMANDER);
    }
};

function checkAndCreateDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
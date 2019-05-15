const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const baseConfigFilePath = path.join(__dirname, '../../config/index.js');

function addPlugin(pluginName, isAdd) {

    const config = require(baseConfigFilePath)
    if (isAdd) {
        config.plugins.push(pluginName)
        config.plugins = [...new Set(config.plugins)];
    }
    else {
        config.plugins = config.plugins.filter(it => it === pluginName);
    }

    const tpl = `const config = ${JSON.stringify(config, null, 4)}; module.exports = config;`;

    fs.writeFileSync(baseConfigFilePath, tpl, { encoding: 'utf8' });

    console.log(`\n 🎉   Plugin ${pluginName} ${isAdd ? '' : 'un'}installed successfully!`);
}

function installPlugin(pluginName, isAdd, callback) {
    console.log(`>  ${isAdd ? 'Installing' : 'Uninstall'} ${pluginName} package...\n`);
    const installCmd = spawn(
        'npm',
        [isAdd ? 'install' : 'uninstall', '-g', pluginName],
        {
            stdio: 'inherit',
            shell: true,
            env: process.env
        }
    );

    installCmd.on('exit', code => {
        if (code) {
            console.log(`\n>  ${pluginName} package ${isAdd ? '' : 'un'}install failed with code ${code}`);
        }
        else {
            console.log(`\n>  ${pluginName} package ${isAdd ? '' : 'un'}install completed`);
            callback();
        }
        installCmd.kill();
    });
    installCmd.on('error', (code, signal) => {
        console.log(code, signal)
        console.log(`>  ${pluginName} ${isAdd ? '' : 'un'}install failed with code ${code}`);
        installCmd.kill();
    });
}

module.exports = function (program, pluginName) {
    const isAdd = !program.delete;
    installPlugin(pluginName, isAdd, () => {
        addPlugin(pluginName, isAdd);
    });
};
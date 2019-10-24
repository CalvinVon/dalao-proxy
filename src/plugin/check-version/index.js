const chalk = require('chalk');
const { spawn } = require('child_process');
const { version } = require('../../../config')

const REG_VERSION = /^(\d+)\.(\d+)\.(\d+)/;

function checkVersion() {
    const versionCmd = spawn('npm', ['view', 'dalao-proxy', 'version', 'time', '--json'], {
        stdio: 'pipe',
        shell: true,
        env: process.env
    });

    versionCmd.stdout.on('data', data => {
        const { version: latestVersion, time } = JSON.parse(data);

        const latestVer = latestVersion.match(REG_VERSION) || [];
        const currentVer = version.match(REG_VERSION) || [];

        const latestMajor = latestVer[1];
        const latestMinor = latestVer[2];
        const latestFix = latestVer[3];
        const currentMajor = currentVer[1];
        const currentMinor = currentVer[2];
        const currentFix = currentVer[3];

        const needUpdate =
            10000 * latestMajor + 100 * latestMinor + 1 * latestFix
            > 10000 * currentMajor + 100 * currentMinor + 1 * currentFix;

        let whatUpdate;
        if (Number(latestMajor) > Number(currentMajor)) {
            whatUpdate = 'major';
        }
        else if (Number(latestMinor) > Number(currentMinor)) {
            if (whatUpdate) return;
            whatUpdate = 'minor';
        }
        else if (Number(latestFix) > Number(currentFix)) {
            if (whatUpdate) return;
            whatUpdate = 'bug-fixing';
        }

        if (needUpdate) {
            const updateTime = time[latestVer].replace(/T.+$/, '');
            console.log(chalk.yellow(`
> 🎉  A new ${whatUpdate} version (${latestVer}) of dalao-proxy has published at ${updateTime}!
  Type \`npm i -g dalao-proxy@${latestVer}\` to update.`))
            console.log(chalk.grey(`  See https://github.com/CalvinVon/dalao-proxy/blob/master/CHANGELOG.md#${latestMajor}${latestMinor}${latestFix}-${updateTime} to get latest infomation of version ${latestVer} \n\n`));
        }
        versionCmd.kill();
    });

    versionCmd.stderr.on('data', data => {
        console.log('Can\'t get version info with error');
        console.error(data);
        versionCmd.kill();
    });

    versionCmd.stdin.end('npm show dalao-proxy time --json');
}

module.exports = {
    beforeCreate() {
        checkVersion();
    }
}
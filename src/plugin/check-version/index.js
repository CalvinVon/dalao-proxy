require('colors')
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

        const latestVersion = latestVersion.match(REG_VERSION) || [];
        const currentVersion = version.match(REG_VERSION) || [];

        const latestMajor = latestVersion[1];
        const latestMinor = latestVersion[2];
        const latestFix = latestVersion[3];
        const currentMajor = currentVersion[1];
        const currentMinor = currentVersion[2];
        const currentFix = currentVersion[3];

        const needUpdate =
            100 * latestMajor + 10 * latestMinor + 1 * latestFix
            > 100 * currentMajor + 10 * currentMinor + 1 * currentFix;

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
            const updateTime = time[latestVersion].replace(/T.+$/, '');
            console.log(`
> 🎉  A new ${whatUpdate} version (${latestVersion}) of dalao-proxy has published at ${updateTime}!
  Type \`npm i -g dalao-proxy@${latestVersion}\` to update.`.yellow)
            console.log(`  See https://github.com/CalvinVon/dalao-proxy/blob/master/CHANGELOG.md#${latestMajor}${latestMinor}${latestFix}-${updateTime} to get latest infomation of version ${latestVersion} \n\n`.grey);
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
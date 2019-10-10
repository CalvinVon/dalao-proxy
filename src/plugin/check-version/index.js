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

        const _latest_version = latestVersion.match(REG_VERSION) || [];
        const _current_version = version.match(REG_VERSION) || [];
        const latest_MajorVer = _latest_version[1];
        const latest_MinorVer = _latest_version[2];
        const latest_FixVer = _latest_version[3];
        const cur_MajorVer = _current_version[1];
        const cur_MinorVer = _current_version[2];
        const cur_FixVer = _current_version[3];

        let whatUpdate;
        if (Number(latest_MajorVer) > Number(cur_MajorVer)) {
            whatUpdate = 'major';
        }
        else if (Number(latest_MinorVer) > Number(cur_MinorVer)) {
            whatUpdate = 'minor';
        }
        else if (Number(latest_FixVer) > Number(cur_FixVer)) {
            whatUpdate = 'bug-fixing';
        }

        if (whatUpdate) {
            const updateTime = time[latestVersion].replace(/T.+$/, '');
            console.log(`
> 🎉  A new ${whatUpdate} version (${latestVersion}) of dalao-proxy has published at ${updateTime}!
  Type \`npm i -g dalao-proxy@${latestVersion}\` to update.`.yellow)
            console.log(`  See https://github.com/CalvinVon/dalao-proxy/blob/master/CHANGELOG.md#${latest_MajorVer}${latest_MinorVer}${latest_FixVer}-${updateTime} to get latest infomation of version ${latestVersion} \n\n`.grey);
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
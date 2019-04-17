require('colors')
const { spawn } = require('child_process');
const { version } = require('../../config')
let versions;

const REG_VERSION = /^(\d+)\.(\d+)\.(\d+)/;

function checkVersion() {
    const versionCmd = spawn('npm', ['show', 'dalao-proxy', 'time', '--json'], {
        stdio: 'pipe',
        shell: true,
        env: process.env
    });

    versionCmd.stdout.on('data', data => {
        versions = JSON.parse(data);
        
        const versionList = Object.keys(versions).sort().filter(version => REG_VERSION.test(version));
        const latestVersion = versionList[versionList.length - 1];

        if (latestVersion > version) {
            const _latest_version = latestVersion.match(REG_VERSION) || [];
            const _current_version = version.match(REG_VERSION) || [];
            const latest_MajorVer = _latest_version[1];
            const latest_MinorVer = _latest_version[2];
            const latest_FixVer = _latest_version[3];
            const cur_MajorVer = _current_version[1];
            const cur_MinorVer = _current_version[2];
            const cur_FixVer = _current_version[3];

            let whatUpdate;

            if (latest_MajorVer > cur_MajorVer) {
                whatUpdate = 'major';
            }
            else if (latest_MinorVer > cur_MinorVer) {
                whatUpdate = 'minor';
            }
            else if (latest_FixVer > cur_FixVer) {
                whatUpdate = 'bug-fixing';
            }
            console.log(`\n\n> 🎉  A new ${whatUpdate} version (${latestVersion}) of dalao-proxy has published! Type \`npm i dalao-proxy@${latestVersion}\` to update.`.yellow)
            console.log(`   See https://github.com/CalvinVon/dalao-proxy to get latest infomation of version ${latestVersion} \n\n`.grey);
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
    checkVersion,
}
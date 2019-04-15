require('colors')
const { spawn } = require('child_process');
const { version } = require('../config')
let versions;

const REG_VERSION = /^(\d+)\.(\d+)\.(\d+)/;

function checkVersion() {
    const versionCmd = spawn('npm', ['show', 'dalao-proxy', 'time', '--json']);

    versionCmd.stdout.on('data', data => {
        versions = JSON.parse(data);
        
        const versionList = Object.keys(versions).sort().filter(version => REG_VERSION.test(version));
        const latestVersion = versionList[versionList.length - 1];

        if (latestVersion > version) {
            const latest_MajorVer = latestVersion.match(REG_VERSION)[1];
            const latest_MinorVer = latestVersion.match(REG_VERSION)[2];
            const latest_FixVer = latestVersion.match(REG_VERSION)[3];
            const cur_MajorVer = version.match(REG_VERSION)[1];
            const cur_MinorVer = version.match(REG_VERSION)[2];
            const cur_FixVer = version.match(REG_VERSION)[3];

            let whatUpdate;

            if (latest_MajorVer > cur_MajorVer) {
                whatUpdate = 'Major';
            }
            else if (latest_MinorVer > cur_MinorVer) {
                whatUpdate = 'Minor';
            }
            else if (latest_FixVer > cur_FixVer) {
                whatUpdate = 'Bug-fixing';
            }
            console.log(`\n\n > 🎉  A new ${whatUpdate} version (${latestVersion}) of dalao-proxy has published! Type \`npm i dalao-proxy@${latestVersion}\` to update.`.yellow)
            console.log(`   See https://github.com/CalvinVon/dalao-proxy to get latest infomation of version ${latestVersion} \n\n`.grey);
        }
        versionCmd.kill();
    });

    versionCmd.stderr.on('data', data => {
        console.log('Can\'t get version info with error');
        console.error(data);
        versionCmd.kill();
    });
}

module.exports = {
    checkVersion,
}
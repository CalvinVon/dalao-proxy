const { spawn } = require('child_process');
const concat = require('concat-stream');
const Table = require('cli-table3');
const chalk = require('chalk');
const { version } = require('../../../config')

const REG_VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/;
const CheckVersion = module.exports;

/**
 * Check package update
 * @param {String} package npm package
 * @param {String} currentVersion package current version
 * @param {(ifNeedUpdate, versionMeta) => void} callback call on package has new version
 */
CheckVersion.checkUpdate = function checkUpdate(package, currentVersion, callback) {
    if (!currentVersion) return;
    const versionCmd = spawn('npm', ['view', package, 'version', 'time', '--json'], {
        stdio: 'pipe',
        shell: true,
        env: process.env
    });

    versionCmd.stdout.pipe(concat(data => {
        const { error, version: latestVersion, time } = JSON.parse(data);

        if (error) return callback(error);

        let isMajor = false,
            isMinor = false,
            isPatch = false;

        const latestVer = latestVersion.match(REG_VERSION) || [];
        const currentVer = currentVersion.match(REG_VERSION) || [];

        const latestMajor = latestVer[1];
        const latestMinor = latestVer[2];
        const latestPatch = latestVer[3];
        const latestMay = latestVer[4];
        const currentMajor = currentVer[1];
        const currentMinor = currentVer[2];
        const currentPatch = currentVer[3];

        const needUpdate =
            10000 * latestMajor + 100 * latestMinor + 1 * latestPatch
            > 10000 * currentMajor + 100 * currentMinor + 1 * currentPatch;

        let whatUpdate;
        if (Number(latestMajor) > Number(currentMajor)) {
            isMajor = true;
            whatUpdate = 'major';
        }
        else if (Number(latestMinor) > Number(currentMinor)) {
            if (whatUpdate) return;

            isMinor = true;
            whatUpdate = 'minor';
        }
        else if (Number(latestPatch) > Number(currentPatch)) {
            if (whatUpdate) return;

            isPatch = true;
            whatUpdate = 'bug-fixing';
        }

        callback(
            null,
            needUpdate,
            {
                latestVersion,
                currentVersion,
                versions: Object.keys(time).filter(v => REG_VERSION.test(v)),
                times: time,
                whatUpdate,
                latest: {
                    major: latestMajor,
                    minor: latestMinor,
                    patch: latestPatch,
                    may: latestMay
                },
                updateInfo: {
                    major: isMajor,
                    minor: isMinor,
                    patch: isPatch
                }
            }
        );
        versionCmd.kill();
    }));

    versionCmd.stderr.on('end', () => {
        versionCmd.kill();
    });
};

CheckVersion.checkCoreUpdate = function checkCoreUpdate() {
    CheckVersion.checkUpdate('dalao-proxy', version, (err, needUpdate, updateData) => {
        if (err || !needUpdate) return;

        const { latestVersion, times, whatUpdate, latest } = updateData;
        const { major, minor, patch } = latest;

        const updateTime = times[latestVersion].replace(/T.+$/, '');
        console.log(chalk.yellow(`
> 🎉  A new ${whatUpdate} version (${latestVersion}) of dalao-proxy has published at ${updateTime}!
  Type \`npm i -g dalao-proxy@${latestVersion}\` to update.`))
        console.log(chalk.grey(`  See https://github.com/CalvinVon/dalao-proxy/blob/master/CHANGELOG.md#${major}${minor}${patch}-${updateTime} to get latest infomation of version ${latestVersion} \n\n`));
    });
};

CheckVersion.checkAllPluginsUpdate = function checkAllPluginsUpdate(pluginList) {
    const updateTable = new Table({
        head: ['Plugin', 'Current Version', 'Latest Version', 'Release Date', 'Update Type'],
        style: {
            head: []
        }
    });
    const UPDATE_TYPES = {
        major: chalk.red('major update'),
        minor: chalk.yellow('minor update'),
        patch: chalk.green('patch update')
    };

    let index = 0;

    (function run(index) {
        const plugin = pluginList[index];
        checkSinglePlugin(plugin, () => {
            if (index >= pluginList.length - 1) {
                if (updateTable.length) {
                    console.log(chalk.yellow('\n> The latest version of belowing plugins are available'));
                    console.log(updateTable.toString())
                }
            }
            else {
                run(++index);
            }
        });
    })(index);

    function checkSinglePlugin(plugin, next) {
        if (plugin.meta.isBuildIn) return next();

        const pluginVersion = plugin.meta.version;
        CheckVersion.checkUpdate(plugin.id, pluginVersion, (err, needUpdate, versionData) => {
            if (err || !needUpdate) {
                return next();
            }

            const { latestVersion, times, updateInfo } = versionData;
            const { major, minor, patch } = updateInfo;

            updateTable.push([
                plugin.id,
                pluginVersion,
                latestVersion,
                times[latestVersion],
                major ? UPDATE_TYPES.major : minor ? UPDATE_TYPES.minor : patch
            ]);

            next();
        });
    }
};
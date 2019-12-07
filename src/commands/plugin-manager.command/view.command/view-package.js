const { spawn, execSync } = require('child_process');
const { Command } = require('commander');
const Table = require('cli-table');
const chalk = require('chalk');
const Spinner = require('cli-spinner').Spinner;
const request = require('request');
const path = require('path');

const { Plugin } = require('../../../plugin');
const { analysisPlugin } = require('../list.command/list-plugin');
const { isDebugMode } = require('../../../utils');

/**
 * Fetch package infomation though `npm`
 * @param {String} packageName
 * @param {Object} options
 * @param {Function} callback
 */
function fetchPackageInfo(packageName, options, callback) {

    if (isDebugMode()) {
        const { indexPath } = Plugin.resolvePluginPaths(packageName);
        callback(null, require(path.join(indexPath, 'package.json')));
    }
    else {
        const npmOptions = [
            'view',
            packageName,
            'name', 'keywords', 'maintainers', 'versions', 'time', 'dist.unpackedSize',
            '--json',
        ];

        if (options.registry) {
            npmOptions.push('--registry', options.registry);
        }

        runNpmCommand(npmOptions, {
            stdio: 'pipe',
            shell: true,
            env: process.env
        }, (err, data) => {
            if (err) return callback(err);

            const detail = JSON.parse(data);
            if (detail.error) {
                return callback(detail.error);
            }

            const latestVersion = detail.versions.pop();
            const size = detail['dist.unpackedSize'];
            callback(null, {
                id: detail.name,
                keywords: detail.keywords,
                latestVersion,
                latestPublish: detail.time[latestVersion],
                size: size ? Number(size / 1000).toFixed(2) + 'kB' : null,
                maintainers: detail.maintainers
            });
        });
    }
};

/**
 * Install package locally but does not cause changes to the `package.json` or `package-lock.json` files
 * @param {String} packageName
 * @param {Object} options
 * @param {Function} callback
 */
function installPkgTemporarily(packageName, options, callback) {
    const npmOptions = [
        'install',
        packageName,
        '-no-save',
        '--no-package-lock',
        '--ignore-scripts',
        '--no-bin-links',
        '--no-optional',
        '--no-audit'
    ];

    if (options.registry) {
        npmOptions.push('--registry', options.registry);
    }

    runNpmCommand(npmOptions, {
        stdio: 'pipe',
        shell: true,
        env: process.env,
        cwd: process.cwd()
    }, (err) => {
        if (err) return callback(err);

        const plugin = new Plugin(packageName, new Command());
        const pluginDetail = analysisPlugin(plugin);

        callback(null, pluginDetail);
    });
};


function removePkg(packageName) {
    execSync('npm uninstall ' + packageName, {
        cwd: process.cwd(),
        env: process.env
    });
}


/**
 * Run npm command wrapper function
 * @param {Array} args npm command args
 * @param {Object} options child_process options
 * @param {Function} callback
 */
function runNpmCommand(args, options, callback) {
    let data = '', errorData = '';

    const cmd = spawn('npm', args, options);
    cmd.stdout.on('data', d => data += d);
    cmd.stdout.on('end', () => {
        callback(null, data);
    })

    cmd.stderr.on('data', d => errorData += d);
    cmd.stderr.on('end', () => {
        console.error(errorData);
        errorData && callback(errorData);
    });

    cmd.on('exit', () => {
        cmd.kill();
    });
}


/**
 * Request plugin information and ouput in a table in the CLI
 * @param {String} packageName
 * @param {Object} options
 */
function displayViewPlugin(packageName, installedPlugins, options) {
    const isInstalled = installedPlugins.filter(plugin => plugin.id === packageName)[0];
    const spinner = new Spinner('Requesting from the npm package registry ... %s');
    spinner.start();
    fetchPackageInfo(packageName, options, (err, packageDetail) => {
        if (err) return exitProgram(err);
        console.clear();

        fetchPkgMonthlyDownloadCount(packageName, (err, count) => {
            spinner.stop(true);
            packageDetail.lastMonDownload = count;

            if (isInstalled) {
                packageDetail.installed = true;
                packageDetail.currentVersion = isInstalled.meta.version;
            }

            displayDetailTable({
                package: packageDetail,
            });

            spinner.setSpinnerTitle('Analyze basic information for plugin installation ... %s');
            spinner.start();

            if (isInstalled) {
                spinner.stop(true);

                displayDetailTable({
                    plugin: analysisPlugin(isInstalled)
                });
                exitProgram();
            }
            else {
                installPkgTemporarily(packageName, options, (err, pluginDetail) => {
                    spinner.stop(true);
                    if (err) return exitProgram(err);


                    displayDetailTable({
                        plugin: pluginDetail
                    });

                    removePkg(packageName);
                    exitProgram();
                });
            }

        });

    });
}

function exitProgram(err) {
    if (err) {
        console.error(chalk.red(err.summary));
    }
    process.exit(0);
}


// Display
function displayDetailTable({ package, plugin }) {
    const tableStyle = {
        chars: {
            'top': '─'
            , 'top-mid': ''
            , 'top-left': ' '
            , 'top-right': ' '
            , 'bottom': ' '
            , 'bottom-mid': ''
            , 'bottom-left': ' '
            , 'bottom-right': ' '
            , 'left': ' '
            , 'left-mid': ' '
            , 'mid': '─'
            , 'mid-mid': ''
            , 'right': ' '
            , 'right-mid': ' '
            , 'middle': ' '
        },
        style: {
            compact: true,
        }
    }

    Array(
        [package, 'Package Infomation'],
        [plugin, 'Installation Information As A Plugin', value => { delete value.instance; delete value.enabled }]
    ).forEach(([data, header, processor = new Function]) => {
        if (data) {
            processor(data);
            console.log(chalk.red('\n  ' + header));
            const packInfoTable = new Table(tableStyle);

            Object.keys(data).forEach(key => {
                let displayString;
                if (key === 'defaultConfig') {
                    displayString = JSON.stringify(data[key], null, 4) || '-';
                }
                else {
                    displayString = format(data[key]);
                }
                packInfoTable.push({
                    [key]: displayString
                });
            });

            console.log(packInfoTable.toString() + '\n');
        }
    });


    function format(value) {
        if (typeof value === 'string') {
            return value || '';
        }
        else if (Array.isArray(value)) {
            return value.join('\n') || '-';
        }
        else if (typeof value === 'object') {
            return Object.keys(value || {}).join('\n') || '-';
        }
        else {
            return value || '-';
        }
    }
}


/**
 * Fetch monthly download count
 * @param {String} packageName
 * @param {Function} callback
 */
function fetchPkgMonthlyDownloadCount(packageName, callback) {
    request(`https://api.npmjs.org/downloads/point/last-month/${packageName}`, (err, res) => {
        if (err) return callback(err);

        const { error, downloads } = JSON.parse(res.body) || {};
        callback(error, downloads);
    })
}

module.exports = {
    fetchPackageInfo,
    installPkgTemporarily,
    removePkg,
    displayViewPlugin,
};
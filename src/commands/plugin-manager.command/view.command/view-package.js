const { spawn, execSync } = require('child_process');
const { Command } = require('commander');
const Table = require('cli-table');
const chalk = require('chalk');
const Spinner = require('cli-spinner').Spinner;

const { Plugin } = require('../../../plugin');
const { analysisPlugin } = require('../list.command/list-plugin');

function fetchPackageInfo(packageName, options, callback) {

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
};

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
        console.log('exit');
        cmd.kill();
    });
}


function displayViewPlugin(packageName, options) {
    const spinner = new Spinner('Requesting from the npm package registry ... %s');
    spinner.start();
    fetchPackageInfo(packageName, options, (err, packageDetail) => {
        spinner.stop(true);
        if (err) return exitProgram(err);

        displayDetailTable({
            package: packageDetail,
        });

        spinner.setSpinnerTitle('Analyze basic information for plugin installation ... %s');
        spinner.start();
        installPkgTemporarily(packageName, options, (err, pluginDetail) => {
            spinner.stop(true);
            if (err) return exitProgram(err);

            displayDetailTable({
                plugin: pluginDetail
            });

            removePkg(packageName);
            exitProgram();
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
                packInfoTable.push({
                    [key]: format(data[key])
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
            return '-';
        }
    }
}

module.exports = {
    fetchPackageInfo,
    installPkgTemporarily,
    removePkg,
    displayViewPlugin,
};
const { spawn } = require('child_process');
const Spinner = require('cli-spinner').Spinner;
const { Command } = require('commander');
const { Plugin } = require('../../../plugin');
const { analysisPlugin } = require('../list.command/list-plugin');

function viewPackage(packageName, options, callback) {

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
        const latestVersion = detail.versions.pop();
        callback(null, {
            id: detail.name,
            keywords: detail.keywords,
            latestVersion,
            latestPublish: detail.time[latestVersion],
            size: Number(detail['dist.unpackedSize'] / 1000).toFixed(2) + 'kB',
            maintainers: detail.maintainers
        });
    });
};

function installPkgTemporarily(packageName, options, callback) {
    const npmOptions = [
        'install',
        packageName,
        '-D',
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
    }, callback);
};

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

    cmd.on('exit', () => cmd.kill());
}


function viewPlugin(packageName, options) {
    const spinner = new Spinner('Requesting from the npm package registry ... %s');
    spinner.start();
    viewPackage(packageName, options, (err, packageDetail) => {
        spinner.stop();
        if (err) return;
        console.log(packageDetail);

        spinner.setSpinnerTitle('Analyze basic information for plugin installation ... %s');
        spinner.start();
        installPkgTemporarily(packageName, options, err => {
            if (err) return spinner.stop();
            const plugin = new Plugin(packageName, new Command());
            console.log(analysisPlugin(plugin));
            spinner.stop();
            process.exit(0);
        });
    });
}

module.exports = {
    viewPlugin,
    viewPackage,
    installPkgTemporarily,
};
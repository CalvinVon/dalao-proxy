const spawnSync = require('child_process').spawnSync;

function checkSuccess(result) {
    var stderr = result.stderr;
    if (stderr && stderr.length) {
        throw new Error(stderr + '');
    }
}

function isCertInstalledMac(certName) {
    var result = spawnSync('security', ['find-certificate', '-c', certName]);
    return result.status === 0;
}

function isCertInstalledWin(certName) {
    var result = spawnSync('certutil', ['-verifystore', 'Root']);
    checkSuccess(result);
    return (result.stdout + '').includes(certName);
}

function getKeyChain() {
    var result = spawnSync('security', ['default-keychain']);
    checkSuccess(result);
    return (result.stdout + '').split('"')[1];
}

function installMac(certPath) {
    var result = spawnSync('security', ['add-trusted-cert', '-k', getKeyChain(), certPath]);
    checkSuccess(result);
    var msg = result.stdout + '';
    if (/Error:/i.test(msg)) {
        throw new Error(msg);
    }
}


function installWin(certFile) {
    var result = spawnSync('certutil', ['-addstore', '-user', 'Root', certFile]);
    checkSuccess(result);
    if (/ERROR_CANCELLED/i.test(result.stdout + '')) {
        throw new Error('The authorization was canceled by the user.');
    }
}

function install(certFile) {
    const platform = process.platform;
    if (platform === 'darwin') {
        return installMac(certFile);
    }
    if (platform === 'win32') {
        return installWin(certFile);
    }
    throw new Error('Platform ' + platform + ' is unsupported to install root CA for now.');
};

function isCertInstalled(certName) {
    const platform = process.platform;
    if (platform === 'darwin') {
        return isCertInstalledMac(certName);
    }
    if (platform === 'win32') {
        return isCertInstalledWin(certName);
    }
    throw new Error('Platform ' + platform + ' is unsupported to check root CA installation for now.');
}

module.exports = {
    install,
    isCertInstalled,
}

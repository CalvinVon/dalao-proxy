const spawnSync = require('child_process').spawnSync;

function checkSuccess(result) {
    var stderr = result.stderr;
    if (stderr && stderr.length) {
        throw new Error(stderr + '');
    }
}

function isCertInstalledMac(certName) {
    const result = spawnSync('security', ['find-certificate', '-c', certName]);
    return result.status === 0;
}

function isCertInstalledWin(certName) {
    const result = spawnSync('certutil', ['-verifystore', 'Root']);
    checkSuccess(result);
    return (result.stdout + '').includes(certName);
}

function getKeyChain(isSystemKeyChain) {
    const result = spawnSync('security', ['list-keychains', '-d', isSystemKeyChain ? 'system' : 'user']);
    checkSuccess(result);
    return (result.stdout + '').split('"')[1];
}

function installMac(certPath, isSystemKeyChain) {
    const placeholder = '__placeholder__';
    const args = ['security', 'add-trusted-cert', placeholder, '-k', getKeyChain(isSystemKeyChain), certPath]
    if (isSystemKeyChain) {
        args.unshift('sudo');
        const index = args.indexOf(placeholder);
        args.splice(index, 1, '-d', '-r', 'trustRoot')
    }
    else {
        const index = args.indexOf(placeholder);
        args.splice(index, 1);
    }
    const result = spawnSync(args.shift(), args);
    checkSuccess(result);
    const msg = result.stdout + '';
    if (/Error:/i.test(msg)) {
        throw new Error(msg);
    }
}


function installWin(certFile) {
    const result = spawnSync('certutil', ['-addstore', '-user', 'Root', certFile]);
    checkSuccess(result);
    if (/ERROR_CANCELLED/i.test(result.stdout + '')) {
        throw new Error('The authorization was canceled by the user.');
    }
}

/**
 * 
 * @param {string} certFile 
 * @param {boolean} isSystemKeyChain should install to system keychain
 * @returns 
 */
function install(certFile, isSystemKeyChain) {
    const platform = process.platform;
    if (platform === 'darwin') {
        return installMac(certFile, isSystemKeyChain);
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

const { CA_FILE_PATH, CA_KEY_PATH, CA_NAME } = require('../../config/cert');
const { createCA, createCert } = require('./create');
const { install, isCertInstalled } = require('./install');
const fs = require('fs');
const chalk = require('chalk');

let caCert, caKey;
/** @type {Record<string, { cert: string, key: string }>} */
const certMap = {};

const getCA = async () => {
    if (!caCert || !caKey) {
        try {
            fs.accessSync(CA_FILE_PATH);
            caCert = fs.readFileSync(CA_FILE_PATH, { encoding: 'utf8' });
            caKey = fs.readFileSync(CA_KEY_PATH, { encoding: 'utf8' });
        } catch (error) {
            const { ca } = createCA();
            caCert = ca.cert;
            caKey = ca.key;
        }
    }

    return {
        cert: caCert,
        key: caKey,
    }
}

const installCA = async (isSystemKeyChain) => {
    if (isCertInstalled(CA_NAME)) {
        return console.log(chalk.yellow('CA certificate has been installed already!'));
    }
    await getCA();
    install(CA_FILE_PATH, isSystemKeyChain);
    console.log(chalk.green(`CA installed ${isSystemKeyChain ? 'to system keychain' : ''} successfully!`));
};

const getCert = async (serverHost, isLocal) => {
    console.log(`[certMap] ${Object.keys(certMap).join(', ')}`);
    console.log(`[get cert] get cert for ${serverHost}`);
    const certObj = certMap[serverHost];
    if (certObj) {
        return certObj;
    }
    const ca = await getCA();
    const cert = certMap[serverHost] = await createCert(ca, serverHost, isLocal);

    return cert;
}

module.exports = {
    installCA,
    getCA,
    getCert,
}
const { CA_FILE_PATH, CA_KEY_PATH, getCertFilePath, CA_NAME } = require('../../config/cert');
const { createCA, createCert } = require('./create');
const { install, isCertInstalled } = require('./install');
const fsPromises = require('fs/promises');
const chalk = require('chalk');

const getRootCA = async () => {
    try {
        await fsPromises.access(CA_FILE_PATH)
    } catch (error) {
        await createCA();
    }
    return {
        cert: await fsPromises.readFile(CA_FILE_PATH, { encoding: 'utf8' }),
        key: await fsPromises.readFile(CA_KEY_PATH, { encoding: 'utf8' }),
    }
}

const installRootCA = async () => {
    if (isCertInstalled(CA_NAME)) {
        return console.log(chalk.yellow('CA certificate has been installed already!'));
    }
    await getRootCA();
    install(CA_FILE_PATH);
    console.log(chalk.green('CA certificate installed successfully!'));
};

const getCert = async (serverHost) => {
    const ca = await getRootCA();
    const { CERT_FILE_PATH, CERT_KEY_PATH } = getCertFilePath(serverHost);

    try {
        await fsPromises.access(CERT_FILE_PATH)
    } catch (error) {
        await createCert(ca, serverHost);
    }

    return {
        cert: await fsPromises.readFile(CERT_FILE_PATH, { encoding: 'utf8' }),
        key: await fsPromises.readFile(CERT_KEY_PATH, { encoding: 'utf8' }),
    }
}

module.exports = {
    installRootCA,
    getRootCA,
    getCert,
}
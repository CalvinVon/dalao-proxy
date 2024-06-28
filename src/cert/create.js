const mkcert = require("mkcert");
const fsPromises = require("fs/promises");
const { ensureFolder } = require("../utils");
const { GL_CA_FOLDER_PATH, CA_FILE_PATH, CA_KEY_PATH, getCertFilePath, CA_NAME } = require("../../config/cert");



async function createCA() {
    await ensureFolder(GL_CA_FOLDER_PATH);

    const ca = await mkcert.createCA({
        organization: CA_NAME,
        countryCode: "CN",
        state: "Zhejiang",
        locality: "Hangzhou",
        validity: 365
    });

    await fsPromises.writeFile(CA_FILE_PATH, ca.cert);
    await fsPromises.writeFile(CA_KEY_PATH, ca.key);
    return {
        ca,
        CA_FILE_PATH,
        CA_KEY_PATH,
    };
}

/**
 * 
 * @param {import('mkcert').Certificate} ca 
 * @param {string} serverHost 
 * @returns 
 */
async function createCert(ca, serverHost) {
    const cert = await mkcert.createCert({
        ca: { key: ca.key, cert: ca.cert },
        domains: ['localhost', '127.0.0.1', serverHost],
        validity: 365
    });

    const { CERT_FILE_PATH, CERT_KEY_PATH, CERT_FOLDER } = getCertFilePath(serverHost);
    await ensureFolder(CERT_FOLDER);

    await fsPromises.writeFile(CERT_FILE_PATH, cert.cert);
    await fsPromises.writeFile(CERT_KEY_PATH, cert.key);

    return {
        cert,
        CERT_FILE_PATH,
        CERT_KEY_PATH,
    }
}

module.exports = {
    createCA,
    createCert,
};

const os = require('os');
const path = require('path');

const GL_CA_FOLDER_NAME = '.dalao-cert';
const GL_CA_FOLDER_PATH = path.resolve(os.homedir(), GL_CA_FOLDER_NAME);

const CA_NAME = 'dalao-proxy';
const CA_FILE_NAME = 'ca.crt';
const CA_KEY_NAME = 'ca.key';

const CA_FILE_PATH = path.join(GL_CA_FOLDER_PATH, CA_FILE_NAME);
const CA_KEY_PATH = path.join(GL_CA_FOLDER_PATH, CA_KEY_NAME);

const CERT_FILE_NAME = 'cert.crt';
const CERT_KEY_NAME = 'cert.key';

const getCertFilePath = (serverHost) => {
    const certDirname = serverHost.replace(/\//g, ';');
    const CERT_FOLDER = path.join(GL_CA_FOLDER_PATH, certDirname);

    const CERT_FILE_PATH = path.join(CERT_FOLDER, CERT_FILE_NAME);
    const CERT_KEY_PATH = path.join(CERT_FOLDER, CERT_KEY_NAME);

    return {
        CERT_FOLDER,
        CERT_FILE_PATH,
        CERT_KEY_PATH
    }
};


module.exports = {
    CA_NAME,
    
    GL_CA_FOLDER_NAME,
    GL_CA_FOLDER_PATH,

    CA_FILE_NAME,
    CA_FILE_PATH,
    CA_KEY_NAME,
    CA_KEY_PATH,

    getCertFilePath
}

const os = require('os');
const path = require('path');

const GL_CA_FOLDER_NAME = '.dalao-ca';
const GL_CA_FOLDER_PATH = path.resolve(os.homedir(), GL_CA_FOLDER_NAME);

const CA_NAME = 'DALAO PROXY CA';
const CA_FILE_NAME = 'ca.crt';
const CA_KEY_NAME = 'ca.key.pem';

const CA_FILE_PATH = path.join(GL_CA_FOLDER_PATH, CA_FILE_NAME);
const CA_KEY_PATH = path.join(GL_CA_FOLDER_PATH, CA_KEY_NAME);

module.exports = {
    CA_NAME,
    
    GL_CA_FOLDER_NAME,
    GL_CA_FOLDER_PATH,

    CA_FILE_NAME,
    CA_FILE_PATH,
    CA_KEY_NAME,
    CA_KEY_PATH,

}

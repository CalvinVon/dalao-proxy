import { writeFileSync } from "fs";
import { createCA, createCert } from "mkcert";

async function createSelfCA() {
    const ca = await createCA({
        organization: "dalao-proxy",
        validity: 365
    });

    writeFileSync()
    
    return {
        ca
    }
}

/**
 * 
 * @param {import('mkcert').Certificate} ca 
 * @param {string} serverHost 
 * @param {string} serverIp 
 * @returns 
 */
async function createSelfCert(ca, serverHost, serverIp) {
    const cert = await createCert({
        ca: { key: ca.key, cert: ca.cert },
        domains: ['localhost', '127.0.0.1', serverHost, serverIp],
        validity: 365
    });

    writeFileSync()
    
    return {
        cert
    }
}

module.exports = {
    createSelfCA,
    createSelfCert,
};

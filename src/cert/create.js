const fs = require("fs");
const forge = require('node-forge');
const pki = forge.pki;
const { ensureFolder } = require("../utils");
const { GL_CA_FOLDER_PATH, CA_FILE_PATH, CA_KEY_PATH, CA_NAME } = require("../../config/cert");

// from node-mitmproxy
function generateCA(commonName) {
    const keys = pki.rsa.generateKeyPair(2046);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = (new Date()).getTime() + '';
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);
    const attrs = [{
        name: 'commonName',
        value: commonName
    }, {
        name: 'countryName',
        value: 'CN'
    }, {
        shortName: 'ST',
        value: 'Zhejiang'
    }, {
        name: 'localityName',
        value: 'Hangzhou'
    }, {
        name: 'organizationName',
        value: 'dalao-proxy CA'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: true
    }, {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true
    }, {
        name: 'subjectKeyIdentifier'
    }]);

    // self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    }
}

function covertNodeCertToForgeCert(originCertificate) {
    const obj = forge.asn1.fromDer(originCertificate.raw.toString('binary'));
    return forge.pki.certificateFromAsn1(obj);
}

function generateCertByOriginCA(ca, originCertificate) {
    const caKey = ca.key;
    const caCert = ca.cert;
    const certificate = covertNodeCertToForgeCert(originCertificate);

    const keys = pki.rsa.generateKeyPair(2046);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = certificate.serialNumber;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    cert.setSubject(certificate.subject.attributes);
    cert.setIssuer(caCert.subject.attributes);

    certificate.subjectaltname && (cert.subjectaltname = certificate.subjectaltname);

    const subjectAltName = _.find(certificate.extensions, { name: 'subjectAltName' });
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: false
    },
    {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true
    },
    {
        name: 'subjectAltName',
        altNames: subjectAltName.altNames
    },
    {
        name: 'subjectKeyIdentifier'
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    },
    {
        name: 'authorityKeyIdentifier'
    }]);
    cert.sign(caKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    };
}

function generateCertByDomain(ca, domain) {
    const caKey = ca.key;
    const caCert = ca.cert;
    const keys = pki.rsa.generateKeyPair(2046);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = (new Date()).getTime() + '';
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
    const attrs = [{
        name: 'commonName',
        value: domain
    }, {
        name: 'countryName',
        value: 'CN'
    }, {
        shortName: 'ST',
        value: 'Zhejiang'
    }, {
        name: 'localityName',
        value: 'Hangzhou'
    }, {
        name: 'organizationName',
        value: 'dalao-proxy'
    }];

    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(attrs);

    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: false
    },
    {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true
    },
    {
        name: 'subjectAltName',
        altNames: [{
            type: 2,
            value: domain
        }]
    },
    {
        name: 'subjectKeyIdentifier'
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    },
    {
        name: 'authorityKeyIdentifier'
    }]);
    cert.sign(caKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    };
}


function createCA() {
    ensureFolder(GL_CA_FOLDER_PATH);

    const ca = generateCA(CA_NAME);

    const cb = () => null;
    fs.writeFile(CA_FILE_PATH, pki.(ca.cert), cb);
    fs.writeFile(CA_KEY_PATH, ca.key, cb);
    return {
        ca,
        CA_FILE_PATH,
        CA_KEY_PATH,
    };
}

/**
 * 
 * @param {import('mkcert').Certificate} ca 
 * @param {string} domain 
 * @returns 
 */
function createCert(ca, domain, isLocal) {
    const domains = [domain];
    if (isLocal) {
        domains.push('127.0.0.1', 'localhost');
    }
    const cert = generateCertByDomain(ca, domain);

    return cert;
}

module.exports = {
    createCA,
    createCert,
};

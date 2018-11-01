const transformPath = require('../src/http-server').transformPath;

const rewritedUrl = transformPath(
    '/adsd',
    'www.host.com:3421',
    '/',
    '/adsd/main/sub/path',
    true
);

console.log(rewritedUrl)
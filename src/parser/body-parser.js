const BodyParser = module.exports;

const { isDebugMode } = require('../utils');
const querystring = require('querystring');

/**
 * Parse raw request body
 * @param {String} contentType request content type
 * @param {String} rawBuffer request raw body
 * @param {Function} [errorHandler] parse error handler
 */
BodyParser.parse = function parse(contentType, rawBuffer, errorHandler) {
    if (!rawBuffer.length || !contentType) return;
    let body = {};

    try {
        if (/application\/x-www-form-urlencoded/.test(contentType)) {
            body = querystring.parse(rawBuffer.toString());
        } else if (/application\/json/.test(contentType)) {
            body = JSON.parse(rawBuffer.toString());
        } else if (/multipart\/form-data/.test(contentType)) {
            body = parseFormData(contentType, rawBuffer);
        }
    } catch (error) {
        if (isDebugMode) {
            console.error(error);
        }
        errorHandler && errorHandler(error);
    }
    return body;
};


function parseFormData(contentType, rawBuffer) {
    const boundary = Buffer.from('--' + contentType.match(/boundary=(\S+)$/)[1]);

    const parts = [];
    let index = 0,
        lastSameIndex = 0;

    // split
    while (index <= rawBuffer.length - boundary.length - 2) {
        const isSame = boundary.compare(rawBuffer, index, index + boundary.length) === 0;
        if (isSame) {
            if (index) {
                const part = rawBuffer.slice(lastSameIndex + boundary.length + 1, index);
                parts.push(part);
            }
            lastSameIndex = index;
            index += boundary.length;
        }
        else {
            index++;
        }
    }

    const body = {};
    const rawBody = {};
    parts.forEach(part => {
        const {
            head,
            rawHeadBuffer,
            rawBodyBuffer
        } = splitHeadAndBody(part);

        const field = getHeadFieldValue(head, "name");
        let value, rawValue;

        if (getHeadFieldValue(head, "filename")) {
            // is file
            const fileName = getHeadFieldValue(head, "filename");
            const contentType = getContentType(head);
            value = {
                name: fileName,
                type: contentType,
                size: Buffer.byteLength(rawBodyBuffer),
                rawBuffer: rawBodyBuffer
            };
            rawValue = {
                head: rawHeadBuffer,
                body: rawBodyBuffer,
                isFile: true
            };
        }
        else {
            // is plain text
            value = rawBodyBuffer.toString();
            rawValue = {
                head: rawHeadBuffer,
                body: rawBodyBuffer,
                isFile: false
            };
        }
        body[field] = value;
        rawBody[field] = rawValue;
    });
    body._raw = rawBody;
    return body;


    function splitHeadAndBody(part) {
        let isCRLF = true;
        let seperator = part.indexOf('\r\n\r\n');
        if (seperator === -1) {
            seperator = part.indexOf('\n\n');
            isCRLF = false;
        }

        if (seperator === -1) {
            throw new Error('Parsing form data error: can\'t split head and body');
        }

        const head = part.slice(1, seperator);
        const body = part.slice(seperator + (isCRLF ? 4 : 2), part.length - (isCRLF ? 2 : 1));
        return {
            head: head.toString(),
            rawHeadBuffer: head,
            rawBodyBuffer: body
        };
    }



    function getHeadFieldValue(head, field) {
        const regExp = new RegExp(`\\b${field}="(.+?)"`);
        return _getMatchedValue(head, regExp);
    }

    function getContentType(head) {
        return _getMatchedValue(head, new RegExp("Content-Type:\\s?(\\S+)"));
    }


    /**
     * @param {String} head
     * @param {RegExp} regExp
     */
    function _getMatchedValue(head, regExp) {
        let matched, value;
        if (matched = head.match(regExp)) {
            value = matched[1];
        }
        return value;
    }
}
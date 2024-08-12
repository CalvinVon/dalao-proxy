const path = require('path');
const fs = require('fs');
const { parse } = require('url');
const queryString = require('query-string');
const mime = require('mime-types');
const { defaultFilenameTpl } = require('./configure');

const HTTP_METHODS = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'];

async function checkAndCreateFolder(dirname) {
    const pwd = process.cwd();
    const fullDirname = path.resolve(pwd, dirname);
    try {
        await fs.promises.access(fullDirname);
    } catch (error) {
        await fs.promises.mkdir(fullDirname, { recursive: true });
    }
}

/**
 * @param {string[]} paths
 * @param {string[]} [extnames]
 * @returns {{ path: string; isMockFile: boolean; }[]}
 */
function resolveSearchPaths(searchPath, config, extnames = ['']) {
    const {
        cache: { dirname: cacheDirname },
        mock: { enable: mockEnable, dirname: mockDirname }
    } = config;

    const resolvedPaths = [];
    const baseDirs = [cacheDirname];
    if (mockEnable) {
        baseDirs.push(mockDirname);
    }

    baseDirs.forEach(dir => {
        extnames.forEach(extname => {
            const pwd = process.cwd();
            const base = path.join(pwd, dir, searchPath + extname);
            resolvedPaths.push({
                path: base,
                isMockFile: dir === mockDirname
            });
        })
    });

    return resolvedPaths;
}

/**
 * @param {{ path: string; isMockFile: boolean; }[]} pathObjects
 * @returns {Promise<{ found: boolean; extname: string; path: string; isMockFile: boolean; }[]>}
 */
function tryResolveFiles(pathObjects) {
    return Promise.all(pathObjects.map(async pathObject => {
        const fullPath = pathObject.path;
        const result = {
            found: false,
            isFile: false,
            extname: path.extname(fullPath),
            path: fullPath,
            isMockFile: pathObject.isMockFile
        }
        try {
            const stat = await fs.promises.stat(fullPath);
            if (stat.isFile()) {
                result.found = true;
                result.isFile = true;
            }
        } catch (error) {

        }

        return result;
    }))
}

/**
 * @param {string} searchString starts with '?'
 * @param {null|Record<string, boolean>} queryFilter
 */
function filterParams(searchString, queryFilter) {
    let keys;
    if (queryFilter && (keys = Object.keys(queryFilter)) && keys.length) {
        const query = queryString.parse(searchString);
        const whitelist = keys.filter(k => queryFilter[k]);
        let resultString;

        if (whitelist.length) {
            const resultQuery = {};
            whitelist.forEach(k => {
                resultQuery[k] = query[k];
            });
            resultString = queryString.stringify(resultQuery);
        }
        else {
            keys.forEach(k => {
                delete query[k];
            });
            resultString = queryString.stringify(query);
        }
        return resultString ? `?${resultString}` : '';
    }
    return searchString;
}

// transfer url to (cache) filename
// @default '{method}_{basename}{jsonExt}{htmlAppend}{query}'
function urlMapFS(url, method, contentType, cacheConfig) {
    const { filenameTpl, queryFilter } = cacheConfig;
    const { pathname, search } = parse(url || '/');
    const dirname = path.dirname(pathname);
    const basename = path.basename(pathname);

    const filename = (filenameTpl || defaultFilenameTpl)
        .replace(/\{method\}/g, method.toUpperCase())
        .replace(/\{basename\}/g, basename)
        .replace(/\{query\}/g, filterParams(search, queryFilter) || '')
        .replace(/\{jsonExt\}/g, mime.extension(contentType) === 'json' ? '.json' : '')
        .replace(/\{htmlAppend\}/g, mime.extension(contentType) === 'html' ? '/index.html' : '')
        .replace(/\/$/, '');

    const fullPath = path.join(dirname, filename);
    return {
        fullPath,
        dirname,
        filename,
    }

}

/**
 * @param {string} relativePath path under the cache/mock folder
 * @param {string} tpl 
 * @returns 
 */
function fsMapUrl(relativePath, tpl) {
    const basePath = path.basename(relativePath.replace(/\/index\.html$/, ''));
    const urlPart = path.dirname(relativePath);
    const urlMapped = `${urlPart}/${basePath}`;
    const methodsStr = HTTP_METHODS.join('|');
    const reg = new RegExp(
        `^${tpl
            .replace(/\{method\}/g, `(?<method>${methodsStr})`)
            .replace(/\{basename\}/g, `(?<basename>.+?)`)
            .replace(/\{query\}/g, `(?<query>\?.+)?`)
            .replace(/\{jsonExt\}/g, path.extname(relativePath))
        }$`
    );
    const { groups = {} } = urlMapped.match(reg);
    const query = groups['query'];
    return {
        method: groups['method'],
        url: `${urlPart}/${groups['basename']}${query}`,
        query,
    }
}


function guessMimeType(content) {
    try {
        JSON.parse(content);
        return mime.lookup('json');
    } catch (err) { }

    if (/^[\x00-\x7F]*$/.test(content.toString())) {
        if (content.toString().startsWith('<!DOCTYPE html>') || content.toString().startsWith('<html')) {
            return mime.lookup('html');
        }
        return mime.lookup('text');
    }

    // 默认返回二进制
    return mime.lookup('bin');
}

module.exports = {
    HTTP_METHODS,
    
    checkAndCreateFolder,
    urlMapFS,
    fsMapUrl,
    guessMimeType,

    resolveSearchPaths,
    tryResolveFiles,
};
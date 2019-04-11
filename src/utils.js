const HTTP_PREFIX_REG = new RegExp(/^(https?:\/\/)/);
const STATIC_FILE_REG = new RegExp(/\.[^\.]+$/);

function custom_assign (objValue, srcValue) {
    return !srcValue ? objValue : srcValue;
}

// make url complete with http/https
function completeUrl(urlFragment) {
    if (!HTTP_PREFIX_REG.test(urlFragment)) {
        return 'http://' + urlFragment;
    }
    else {
        return urlFragment;
    }
}

// transfer url to (cache) filename
// /`${GET/POST}_${URI}`/
function url2filename(method, url) {
    return method.toUpperCase()
        + url.split('/')
            .join('_')
            .replace(/\?.+/, '')
            .replace(/#.+/, '')
}

// deprecated
// transfer url to (cache) filename
function filename2url(url) {
    return url.split('_').join('/').replace(/(GET|POST|PATCH|OPTIONS|PUT)/);
}

/**
 * url path deep compare
 * @param {Number} order
 * @return {Function} compare function
 */
function pathCompareFactory (order) {
    return function (prev, curr) {
        const prev_dep = prev.match(/(\/)/g).length;
        const curr_dep = curr.match(/(\/)/g).length;
    
        if (prev_dep === curr_dep) {
            return (prev.length - curr.length) * order;
        }
        else {
            return (prev_dep - curr_dep) * order;
        }
    }
}

/**
* Proxy path transformer
* @param {String} proxyPath proxy matched path
* @param {String} targetPath proxy target path
* @param {String} path origin path
* @param {Boolean} rewrite rewrite proxy matched path
*/
function transformPath (proxyPath, overwriteHost, overwritePath, url, rewrite) {
   let transformedUrl;
   let matched = overwriteHost.match(HTTP_PREFIX_REG);

   url = url.replace(HTTP_PREFIX_REG, '');

   if (rewrite) {
       const rewritedPath = url.replace(proxyPath, overwritePath)
       transformedUrl = joinUrl([overwriteHost, rewritedPath]);
   }
   else {
       transformedUrl = joinUrl([overwriteHost, overwritePath, url]);
   }

   if (matched) {
       transformedUrl = matched[1] + transformedUrl;
   }
   else {
       transformedUrl = 'http://' + transformedUrl;
   }

   return transformedUrl;
}


function joinUrl(urls) {
    return urls.map(url => url.replace(HTTP_PREFIX_REG, '')).join('/').replace(/\/{2,}/g, '/');
}

// is static file uri value
function isStaticResouce(uri = '') {
    return STATIC_FILE_REG.test(
            uri
                .replace(/\?.+/, '')
                .replace(/#.+/, '')
        )
        
}

module.exports = {
    HTTP_PREFIX_REG,
    custom_assign,
    completeUrl,
    url2filename,
    filename2url,
    pathCompareFactory,
    transformPath,
    joinUrl,
    isStaticResouce
}
const HTTP_PREFIX_REG = new RegExp(/^(https?:\/\/)/);
const NONE_STATIC_REG = new RegExp(/\/[\w-]+$/);

function custom_assign (objValue, srcValue) {
    return !srcValue ? objValue : srcValue;
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


module.exports = {
    HTTP_PREFIX_REG,
    NONE_STATIC_REG,
    custom_assign,
    pathCompareFactory,
    transformPath,
    joinUrl
}
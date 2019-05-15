onmessage = (event) => {
    const { rawData, type } = event.data;
    const hljs = require('highlight.js/lib/highlight');
    if (/(java|ecma)script/.test(type)) {
        const javascript = require('highlight.js/lib/languages/javascript');
        hljs.registerLanguage('javascript', javascript);
    }
    else if (/(ht|x)ml/.test(type)) {
        const xml = require('highlight.js/lib/languages/xml');
        hljs.registerLanguage('xml', xml);
    }
    else if (/css/.test(type)) {
        const css = require('highlight.js/lib/languages/css');
        hljs.registerLanguage('css', css);
    }

    const result = hljs.highlightAuto(rawData);
    self.postMessage(result.value);
    self.close();
}
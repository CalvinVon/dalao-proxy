# proxy-plugin-inject
A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) for auto run multiple commands in parallel.
> only support dalao-proxy > 1.x

[![version](https://img.shields.io/npm/v/@calvin_von/proxy-plugin-inject.svg)](https://www.npmjs.com/package/@calvin_von/proxy-plugin-inject)
[![](https://img.shields.io/npm/dt/@calvin_von/proxy-plugin-inject.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/proxy-plugin-inject)

## Usage
Install `dalao-proxy` cli first
```bash
npm install -g dalao-proxy
```

Install plugin
- globally
    ```bash
    $ dalao-proxy plugin install -g @calvin_von/proxy-plugin-inject
    ```

- locally
    ```bash
    $ dalao-proxy plugin install -D @calvin_von/proxy-plugin-inject
    ```

Add config
```json
"inject": {
    "rules": [],
    "presets": {
        "mobileConsole": false,
        "remoteConsole": false
    }
}
```

Start proxy
```bash
$ dalao-proxy start
...
> npm run start
```

## Config
### rules
Example: inject `inject-file.js` into all files named `index.html`
```json
{
    "rules": [
        {
            "test": "^index\.html$",
            "serves": {
                "inject-file.js": "./libs/injected-file.js",
            },
            "template": "<script src=\"{{inject-file.js}}\"></script>",
            "insert": "body"
        }
    ]
}
```
- **test**: A `RegExp` to test all request over proxy.
- **serves**: An `Object` contains all static files to serve. An inter URL prefix would be added before the given name.
- **template**: A `DOMString` to be inserted into the matched HTML document.
- **templateSrc**: A path `string` of the text file that contains `DOMString` to be inserted into the matched HTML document.
- **insert**: A `string` tells the plugin where to insert.

### presets
- **mobileConsole**: Inject a console called [eruda](https://github.com/liriliri/eruda) for better debugging in mobile browsers
- **remoteConsole**: An experimental feature: debugging mobile web applications in the terminal console




more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

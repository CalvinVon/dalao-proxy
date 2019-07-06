# Proxy-plugin-redirect
A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) plugin for request redirect.
> Awesome plugin for debugging the online program locally.

[![version](https://img.shields.io/npm/v/@calvin_von/proxy-plugin-redirect.svg)](https://www.npmjs.com/package/@calvin_von/proxy-plugin-redirect)
[![](https://img.shields.io/npm/dt/@calvin_von/proxy-plugin-redirect.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/proxy-plugin-redirect)

## Usage
### 1. Global Install
Install `dalao-proxy` cli first
```bash
npm install -g dalao-proxy
```

Add plugin
```bash
$ dalao-proxy add-plugin @calvin_von/proxy-plugin-redirect
> @calvin_von/proxy-plugin-redirect Install complete
```

Add config
```json
"redirect": [
    {
        "from": "http://www.example.com/(app|\\d+).(\\w+.)?js",
        "to": "http://localhost:8000/$1.js"
    },
    {
        "from": "/(api/.+)",
        "to": "http://localhost:8000/$1"
    }
]
```

Start proxy
```bash
$ dalao-proxy start
Redirect config table:
┌────────────────────────────────────────────┬─────────────────────────────┐
│ From                                       │ To                          │
├────────────────────────────────────────────┼─────────────────────────────┤
│ http://www.example.com/(app|\d+).(\w+.)?js │ http://localhost:8000/$1.js │
├────────────────────────────────────────────┼─────────────────────────────┤
│ /(api/.+)                                  │ http://localhost:8000/$1    │
└────────────────────────────────────────────┴─────────────────────────────┘
```

### 2. Local Install
```bash
$ npm install -D dalao-proxy
$ npm install -D @calvin_von/proxy-plugin-redirect
```
Generate config json file
```bash
$ npx dalao-proxy init
```

Add plugin in config json file
```json
{
    "plugins": [
        "@calvin_von/proxy-plugin-redirect"
    ]
}
```

package.json
```json
{
    "scripts": {
        "proxy": "dalao-proxy start"
    }
}

```
Start proxy
```bash
$ npm run proxy
```

more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

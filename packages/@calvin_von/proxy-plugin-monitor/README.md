# Proxy-plugin-monitor
A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) plugin for request monitoring.

[![version](https://img.shields.io/npm/v/@calvin_von/proxy-plugin-monitor.svg)](https://www.npmjs.com/package/@calvin_von/proxy-plugin-monitor)
[![](https://img.shields.io/npm/dt/@calvin_von/proxy-plugin-monitor.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/proxy-plugin-monitor)

> - 1.x version support dalao-proxy@0.x
> - 2.x version support dalao-proxy@1.x

## Usage
### 1. Global Install
Install `dalao-proxy` cli first
```bash
npm install -g dalao-proxy
```

Add plugin

```bash
$ dalao-proxy plugin install -g @calvin_von/proxy-plugin-monitor
```


Add config
```json
{
    "monitor": {
        "open": true,
        "cleanOnRestart": false,
        "disableLogger": true,
        "maxRecords": 100,
        "editor": "code"
    }
}
```
- **`open`**: Auto open monitor page when start. (Default: `true`)
- **`disableLogger`**: Enable disable proxy logger. (Default: `true`)
- **`cleanOnRestart`**: Auto clean monitor data list when restart. (Default: `false`)
- **`maxRecords`**: Set maximum records item. (Default: `100`)
- **`editor`**: Default code editor. (Default: `code`)

Start proxy
```bash
$ dalao-proxy start
> [monitor] attached at http://localhost:40001
> dalao has setup the Proxy for you 🚀
> dalao is listening at http://localhost:8000
```

### 2. Local Install
```bash
$ npm install -D dalao-proxy
$ dalao-proxy plugin install -D @calvin_von/proxy-plugin-monitor
```
Generate config json file
```bash
$ npx dalao-proxy init -f
```

Add plugin in config json file
```json
{
    "plugins": [
        "@calvin_von/proxy-plugin-monitor"
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

## Screenshots
![preview](https://raw.githubusercontent.com/CalvinVon/dalao-proxy/master/packages/%40calvin_von/proxy-plugin-monitor/.github/screenshot/preview.png)

![preview-2](https://raw.githubusercontent.com/CalvinVon/dalao-proxy/master/packages/%40calvin_von/proxy-plugin-monitor/.github/screenshot/preview-2.png)

more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

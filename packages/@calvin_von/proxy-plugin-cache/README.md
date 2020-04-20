# proxy-plugin-cache
A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) for auto run multiple commands in parallel.
> only support dalao-proxy > 1.x

[![version](https://img.shields.io/npm/v/@calvin_von/proxy-plugin-cache.svg)](https://www.npmjs.com/package/@calvin_von/proxy-plugin-cache)
[![](https://img.shields.io/npm/dt/@calvin_von/proxy-plugin-cache.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/proxy-plugin-cache)

## Usage
Install `dalao-proxy` cli first
```bash
npm install -g dalao-proxy
```

Install plugin
- globally
    ```bash
    $ dalao-proxy plugin install -g @calvin_von/proxy-plugin-cache
    ```

- locally
    ```bash
    $ dalao-proxy plugin install -D @calvin_von/proxy-plugin-cache
    ```

Add config
- config for cache response
```json
"cache": {
    "dirname": ".dalao-cache",
    "contentType": [
        "application/json"
    ],
    "maxAge": [
        0,
        "second"
    ],
    "filters": [
        {
            "when": "response",
            "where": "status",
            "field": null,
            "value": 200,
            "custom": null,
            "applyRoute": "*"
        }
    ],
    "logger": true
}
```

- config for mock feature
```json
"mock": {
    "dirname": "mocks",
    "prefix": ""
}
```

Start proxy
```bash
$ dalao-proxy start
...
> npm run start
```

more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

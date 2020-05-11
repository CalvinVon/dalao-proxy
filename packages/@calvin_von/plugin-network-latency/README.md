# plugin-network-latency
A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) for simulate network latency.
> only support dalao-proxy > 1.x

[![version](https://img.shields.io/npm/v/@calvin_von/plugin-network-latency.svg)](https://www.npmjs.com/package/@calvin_von/plugin-network-latency)
[![](https://img.shields.io/npm/dt/@calvin_von/plugin-network-latency.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/plugin-network-latency)

## Usage
Install `dalao-proxy` cli first
```bash
npm install -g dalao-proxy
```

Install plugin
- globally
    ```bash
    $ dalao-proxy plugin install -g @calvin_von/plugin-network-latency
    ```

- locally
    ```bash
    $ dalao-proxy plugin install -D @calvin_von/plugin-network-latency
    ```

Add config
```json
"latency": {
    "test": "/\//",
    "include": [],
    "exclude": [],
    "time": 0,
    "request": false,
    "response": true
}
```


Start proxy
```bash
$ dalao-proxy start
...
> Proxy [/api]   GET   /api/test  >>>>  http://api.yourdoamin.com/api/test
> Simulate network latency for [/api/test] by [1000] ms
```

more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

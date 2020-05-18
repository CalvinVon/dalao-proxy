# plugin-serve-static
A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) for serve static files easily
> only support dalao-proxy > 1.x

[![version](https://img.shields.io/npm/v/@calvin_von/plugin-serve-static.svg)](https://www.npmjs.com/package/plugin-serve-static)
[![](https://img.shields.io/npm/dt/plugin-serve-static.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/plugin-serve-static)

## Usage
Install `dalao-proxy` cli first
```bash
npm install -g dalao-proxy
```

Install plugin
- globally
    ```bash
    $ dalao-proxy plugin install -g plugin-serve-static
    ```

- locally
    ```bash
    $ dalao-proxy plugin install -D plugin-serve-static
    ```

Add config
```json
"serve": {
    "route": "/statics",
    "root": "./",
    "serveOptions": {}
}
```


Start proxy
```bash
$ dalao-proxy start
...
> Serving [/home/your-path]
> Static server ready, available on [ http://localhost:8000/statics ]
```
Start single server
```bash
$ dalao-proxy serve

> Serving [/home/your-path]
> Static server ready, available on:
> - Local:    http://localhost:4200
> - Network:  http://192.168.10.206:4200
```

more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

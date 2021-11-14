# plugin-request-hijack

A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) for hijacking asynchronous requests to do more cool things. Mostly rewrite requests url to local dalao-proxy server.

> only support dalao-proxy > 1.x

[![version](https://img.shields.io/npm/v/@calvin_von/plugin-request-hijack.svg)](https://www.npmjs.com/package/@calvin_von/plugin-request-hijack)
[![](https://img.shields.io/npm/dt/@calvin_von/plugin-request-hijack.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/plugin-request-hijack)

## Usage

Install `dalao-proxy` cli first

```bash
npm install -g dalao-proxy
```

Install plugin

- globally

  ```bash
  dalao-proxy plugin install -g @calvin_von/plugin-request-hijack
  ```

- locally

  ```bash
  dalao-proxy plugin install -D @calvin_von/plugin-request-hijack
  ```

Add config

```json
"requestHijack": {
    "enable": true,
    "prefix": "",
    "smartInfer": true,
    "rewrite": [
        { "from": "...", "to": "...", }
    ]
}
```

Start proxy

```bash
$ dalao-proxy start
...
> npm run start
```

## Config

### prefix

Add prefix for all rewrite urls.

### smartInfer

If `rewrite` not provided, `smartInfer` set to `true` will auto infer rewrite config from `proxyTable` of base config.

### rewrite

- **from**: A string or `RegExp` string to match URLs
- **to**: A string or `RegExp` replace string to rewrite URLs


more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

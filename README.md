# Dalao-proxy
A HTTP proxy for frontend developer with request cache, request mock and development!

> An one-line command server! More light-weight and convenient than proxy of `webpack-dev-server` in daily development.

[![version](https://img.shields.io/npm/v/dalao-proxy.svg)](https://www.npmjs.com/package/dalao-proxy)
[![](https://img.shields.io/npm/dt/dalao-proxy.svg)](https://github.com/CalvinVon/dalao-proxy)
![dependencies](https://img.shields.io/david/CalvinVon/dalao-proxy.svg)

## Features
- HTTP proxy
- HTTP capture
- Request mock file
- Request auto cache with flexible configuration
- Auto generate config file
- Auto reload server when config file changes

## Getting Started
### Install
```bash
npm i dalao-proxy -g
```

### Configure
Default configuration file will be generated in `dalao.config.json`.
```bash
# This utility will walk you through creating a config file
dalao-proxy init

# Generate config file directly
dalao-proxy init -y
```

### Start proxy
```bash
# dalao will read default config file
dalao-proxy start

# custom options
dalao-proxy start -wc --config ./dalao.config.json
```
Start Options
```
Options:
    -C, --config [filepath]     use custom config file
    -w, --watch                 reload when config file changes
    -P, --port [port]           custom proxy port
    -H, --host [hostname]       dynamic add host linked to your server address
    -t, --target [proxyTarget]  target server to proxy
    -c, --cache                 enable request cache
    -i, --info                  enable log print
    -h, --help                  output usage information
```

🎉  Congratulations, your one-line command proxy server started, now you have your own *dalao*!

### Enjoy it!
Every single modification of the configuration file, the `dalao` will automatically restart and output prompts.

## Docs
It's on the way...

Well, you can type `dalao-proxy --help` for help temporarily.

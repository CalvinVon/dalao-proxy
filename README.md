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

# Content Table
- [Getting Started](#Getting-Started)
    - [Install](#Install)
    - [Configure](#Configure)
    - [Start proxy](#Start-proxy)
    - [Enjoy It](#Enjoy-It)
- [Docs](#Docs)
    - [Configuration file](#configuration-file)
        - [Option `watch`](#Option-watch)
        - [Option `cache`](#Option-cache)
        - [Option `cacheContentType`](#Option-cacheContentType)
        - [Option `cacheMaxAge`](#Option-cacheMaxAge)
        - [Option `responseFilter`](#Option-responseFilter)
- [Start Cache Request Response](#Start-Cache-Request-Response)
- [Start Request Mock](#Start-Request-Mock)
- [Development scenario](#Development-scenario)
# Getting Started
## Install
```bash
npm i dalao-proxy -g
```

## Configure
Default configuration file will be generated in `dalao.config.json`.
```bash
# This utility will walk you through creating a config file
dalao-proxy init

# Generate config file directly
dalao-proxy init -y
```

## Start proxy
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

## Enjoy it!
Every single modification of the configuration file, the `dalao` will automatically restart and output prompts.

# Docs
## Configuration file
Dalao will look up config file in current working directory while starting up.

Default config filename is `dalao.config.json`
```js
{
    // config file name
    "configFilename": "dalao.config.json",
    // cache file store
    "cacheDirname": ".dalao-cache",
    // enable reload when config file changes
    "watch": true,
    // proxy server host
    "host": "localhost",
    // proxy server port
    "port": 8000,
    // proxy target (base setting)
    "target": "target.example.com",
    // enable proxy request cache (base setting)
    "cache": false,
    // define response type to cache (base setting)
    "cacheContentType": [
        "application/json"
    ],
    // define cache valid max time before expired
    "cacheMaxAge": [
        "second",
        0
    ],
    // define response body filter
    "responseFilter": [
        "code",
        200
    ],
    // enable log out parsed config options
    "info": false,
    // custom response headers
    "headers": {},
    // proxy rule table
    "proxyTable": {
        // proxy match rule
        "/": {
            "path": "/"
        }
    }
}
```
### Option `watch`
- type: **boolean**
- default: `true`

Enable proxy server auto reload when config file changes

### Option `cache`
- type: **boolean**
- default: `true`

Enable request auto cache when response satisfies [certain conditions](https://github.com/CalvinVon/dalao-proxy#Start-Cache-Request-Response).
> When request has been cached, extra field `X-Cache-Request` will be added into response headers.

### Option `cacheContentType`
- *precondition: when `cache` option is `true`*
- type: **Array**
- default: `application/json`

Cache filtering by response content type with at lease one item matchs.


### Option `cacheMaxAge`
- *precondition: when `cache` option is `true`*
- type: **Array**
    - cacheMaxAge[0]: cache expire time unit
    - cacheMaxAge[1]: cache expire time digit
        - when digit comes to `0`, `dalao-proxy` will **never** try to look up cache file (but still cache request response) regardless of expire time. 
        - when digit comes to special value `'*'`, which means cache file will **never expire**, `dalao-proxy` will read cache file first, then send a real request. 
- default: `['second', 0]`

Cache filtering by cache file expire time.
> `X-Cache-Expire-Time` and `X-Cache-Rest-Time` fields will be included in response headers.

### Option `responseFilter`
- *precondition: when `cache` option is `true`*
- type: **Array**
    - responseFilter[0]: response body field for filtering
    - responseFilter[1]: valid value for filtering
- default: `['code', 200]`

Cache filtering by response body data. *Not HTTP status code*


# Start Cache Request Response
- Set `cache` option to `true`
- Set appropriate value for `cacheContentType`， `cacheMaxAge`，`responseFilter` fields

# Start Request Mock
Type `dalao-proxy mock <HTTP method>` and the HTTP method you want mock
```bash
# dalao-proxy mock [options] <method>
dalao-proxy mock post
> Request url: /api/list

Mock file created in /home/$(USER)/$(CWD)/.dalao-cache/GET_api_get.json
```
Input some mock data into `GET_api_get.json` file, then you can access `/api/list` and get your mock data.
# Development scenario
> Use cache only when developing or prevent backend api from frequent crash

Still working on it...

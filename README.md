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

# Table of contents
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
        - [Option `proxyTable`](#Option-proxyTable)
        - [Proxy `route` config](#Proxy-route-config)
            - [Route option `pathRewrite`](#Route-option-pathRewrite)
- [Start Cache Request Response](#Start-Cache-Request-Response)
    - [Example](#Example)
    - [`Never Read Cache` Mode](#Never-Read-Cache-Mode)
    - [`Read Cache` Mode](#Read-Cache-Mode)
- [Start Request Mock](#Start-Request-Mock)
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
- default: `['application/json']`

Cache filtering by response content type with at lease one item matchs.
*Support `RegExp` expression*

### Option `cacheMaxAge`
- *precondition: when `cache` option is `true`*
- type: **Array**
    - cacheMaxAge[0]: cache expire time unit
    - cacheMaxAge[1]: cache expire time digit
        - when digit comes to `0`, `dalao-proxy` will **never** try to look up cache file (but still cache request response) regardless of expire time. 
        - when digit comes to special value `'*'`, which means cache file will **never expire**, `dalao-proxy` will read cache file first, then send a real request. 
- default: `['second', 0]`

Cache filtering by cache file expire time.
> Support quick restart and take effect immediatly.

> `X-Cache-Expire-Time` and `X-Cache-Rest-Time` fields will be included in response headers.

### Option `responseFilter`
- *precondition: when `cache` option is `true`*
- type: **Array**
    - responseFilter[0]: response body field for filtering
    - responseFilter[1]: valid value for filtering
- default: `['code', 200]`

Cache filtering by response body data. *Not HTTP status code*

### Option `proxyTable`
- type: **Object**
- default: `{ "/": { "path": "/" } }`

Proxy [route](#Proxy-route-config) map set.

### Proxy `route` config
```js
{
    // proxy target path
    // default: `/`
    path
    // proxy target
    // extend base config option `target`
    target,
    // proxy target path rewrite
    pathRewrite,
    // route custom config
    // default: extend base config
    cache,
    cacheContentType，
    cacheMaxAge,
    responseFilter,
}
```
#### Route option `pathRewrite`
Use `RegExp` expression to match target path, and replace with rewrite value.

Example:
```js
"pathRewrite": {
    "^/api": ""
}
```

`"/api/user/list"` will be replaced to be `"/user/list"`

# Start Cache Request Response
1. Set option `cache` to `true`
1. Set appropriate value for `cacheContentType`， `cacheMaxAge`，`responseFilter` options

When those three fields satisfied certain conditions, request response would be cached in folder (`cacheDirname` you specified).

## Example:
Here is a sample of server response data
```js
// send request
POST /api/list HTTP/1.1
...

// get response
connection: keep-alive
content-encoding: gzip
content-type: application/json; charset=UTF-8
date: Fri, 19 Apr 2019 08:35:42 GMT
server: nginx/1.10.3 (Ubuntu)
transfer-encoding: chunked
vary: Accept-Encoding
// response data
{
    "status": 1,
    "data": {
        "list": [
            { "id": 1, "name": "dalao" },
            { "id": 2, "name": "proxy" }
        ],
        "total": 2
    }
}
```

The config should be like this:
```js
"cache": true,
"cacheContentType": ["application/json"],
"responseFilter": ["status", 1],
```

## `Never Read Cache` Mode
If you just want to cache response only and get real proxy response

> **Recommanded** when you have completed frontend and backend API docking or requiring high accuracy of response data.

> When the backend service crashes during development, you can switch to [**Read Cache** mode](#Read-Cache-Mode) to **create a fake backend service**.

Set option `cacheMaxAge` to *Never Read Cache* mode
```js
"cacheMaxAge": ["s", 0]
```

## `Read Cache` Mode
When you're ready to develop front-end pages or need [request mock](#Start-Request-Mock)

> `dalao-proxy` would try to look up cache/mock file first, then return a real response after the failure

Set option `cacheMaxAge` to *Read Cache* mode. [See option `cacheMaxAge`](#Option-cacheMaxAge)

```js
// set permanent request cache
"cacheMaxAge": ["s", "*"]
"cacheMaxAge": ["second", "*"]
// set certain expire time request cache (5 min)
"cacheMaxAge": ["m", 5]
"cacheMaxAge": ["minute", 5]
```

# Start Request Mock
Type `dalao-proxy mock <HTTP method>` and the HTTP method you want to mock
```bash
# dalao-proxy mock [options] <method>
dalao-proxy mock post
> Request url: /api/list

Mock file created in /home/$(USER)/$(CWD)/.dalao-cache/GET_api_get.json
```
Input some mock data into `GET_api_get.json` file, then you can access `/api/list` and get your mock data.

# LICENSE
[MIT LICENSE](https://github.com/CalvinVon/dalao-proxy/blob/master/LICENSE)
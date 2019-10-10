# Dalao-proxy
An expandable HTTP proxy based on the plug-in system for frontend developers with request caching request mock and development!

> An one-line command server! More light-weight and convenient than the proxy of `webpack-dev-server` in daily development.

[![version](https://img.shields.io/npm/v/dalao-proxy.svg)](https://www.npmjs.com/package/dalao-proxy)
[![](https://img.shields.io/npm/dt/dalao-proxy.svg)](https://github.com/CalvinVon/dalao-proxy)
[![Package Quality](https://npm.packagequality.com/shield/dalao-proxy.svg)](https://packagequality.com/#?package=dalao-proxy)
![dependencies](https://img.shields.io/david/CalvinVon/dalao-proxy.svg)

[English Doc](https://github.com/CalvinVon/dalao-proxy/blob/master/README.md)
|
[中文文档](https://github.com/CalvinVon/dalao-proxy/blob/master/README_CN.md)

## Features
- HTTP proxy
- HTTP capture
- Request mock
- Request auto cache with flexible configuration
- Auto-generate config file
- Auto reload server when config file changes
- Support fast switching of multiple environments
- Expandable and plugin-based system

![v0.9.2 preview](https://raw.githubusercontent.com/CalvinVon/dalao-proxy/master/.github/screenshot/start.png)

# Table of contents
- [Getting Started](#Getting-Started)
    - [Install](#Install)
    - [Configure](#Configure)
    - [Start proxy](#Start-proxy)
    - [Enjoy It](#Enjoy-It)
- [Commands](#Commands)
- [Docs](#Docs)
    - [Configuration file](#configuration-file)
        - [Option `host`](#Option-host)
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
- [Plugin System](#Plugin-Systembeta)
    - [Install Plugin](#Install-Plugin)
        - [Global Install Plugin](#Global-Install-Plugin)
        - [Local Install Plugin](#Local-Install-Plugin)
    - [Available Plugins](#Available-Plugins)
    - [Lifecycle Hook](#Lifecycle-Hook)
        - [beforeCreate](#beforeCreate)
        - [onRequest](#onRequest)
        - [onRouteMatch](#onRouteMatch)
        - [beforeProxy](#beforeProxy)
        - [afterProxy](#afterProxy)

# Getting Started
## Install
```bash
$ npm i dalao-proxy -g
```

## Configure
Default configuration file will be generated in `dalao.config.json`.
```bash
# This utility will walk you through creating a config file
$ dalao-proxy init

# Generate config file directly
$ dalao-proxy init -y
```

## Start proxy
```bash
# dalao will read default config file
$ dalao-proxy start

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

[back to menu](#Table-of-contents)

# Commands
```bash
$ dalao-proxy --help
Usage: dalao-proxy [options] [command]

Options:
  -V, --version                      output the version number
  -h, --help                         output usage information

Commands:
  start [options]                    auto detect config & start proxy server
  init [options]                     create an init config file in current folder
  mock [options] <method>            create a mock file in json format
  clean [options]                    clean cache files
  add-plugin [options] <pluginName>  add plugin globally
```

# Docs
## Configuration file
Dalao will look up the config file in the current working directory while starting up.

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
    "responseFilter": [],
    // enable logger
    "info": false,
    // show debug message
    "debug": false,
    // custom response headers
    "headers": {},
    // proxy rule table
    "proxyTable": {
        // proxy match rule
        "/": {
            "path": "/"
        }
    },
    // extra plugins
    "plugins": []
}
```

### Option `watch`
- type: **boolean**

    > When configured as `0.0.0.0`, other devices on the LAN can also access the service, and the machine can access using `localhost`.

### Option `watch`
- type: **boolean**
- default: `true`

Enable proxy server auto reload when config file changes

### Option `cache`
- type: **boolean**
- default: `true`

    Enable request cache when response satisfies [certain conditions](https://github.com/CalvinVon/dalao-proxy#Start-Cache-Request-Response).
    > When a request has been cached, extra field `X-Cache-Request` will be added into response headers.

### Option `cacheContentType`
- *precondition: when `cache` option is `true`*
- type: **Array**
- default: `['application/json']`

    Cache filtering by response content type with at least one item matches.
    *Support `RegExp` expression*

### Option `cacheMaxAge`
- *precondition: when `cache` option is `true`*
- type: **Array**
    - cacheMaxAge[0]: cache expire time unit
    - cacheMaxAge[1]: cache expire time digit
        - when digit comes to `0`, `dalao-proxy` will **never** try to look up cache file (but still cache request-response) regardless of expire time. 
        - when digit comes to special value `'*'`, which means cache file will **never expire**, and `dalao-proxy` will first try to read and return the cache file, and if it is not found, it would return the real request-response.
- default: `['second', 0]`

    Cache filtering by cache file expires time.
    > Support quick restart and take effect immediately.

    > `X-Cache-Expire-Time` and `X-Cache-Rest-Time` fields will be included in response headers.

### Option `responseFilter`
- *precondition: when `cache` option is `true`*
- type: **Array**
    - responseFilter[0]: response body field for filtering
    - responseFilter[1]: valid value for filtering
- default: `['code', 200]`

Cache filtering by response body data. *Not HTTP status code*

### Option `plugins`
- type: **Array**

    A list of plugin npm *package name*.

    You will need to add plugins to expand the expandability of `dalao-proxy`. See [Plugins](#Plugins).

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

[back to menu](#Table-of-contents)

# Start Cache Request Response
1. Set option `cache` to `true`
1. Set appropriate value for `cacheContentType`， `cacheMaxAge`，`responseFilter` options

    When those three fields satisfied certain conditions, request response would be cached in folder (`cacheDirname` you specified).

## Example:
Here is an simple example of server response data
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
If you just want to cache response only and get a real proxy response

> **Recommended** when you have completed frontend and backend API docking or requiring high accuracy of response data.

> When the backend service crashes during development, you can switch to [**Read Cache** mode](#Read-Cache-Mode) to **create a fake backend service**.

Set option `cacheMaxAge` to *Never Read Cache* mode
```js
"cacheMaxAge": ["s", 0]
```

## `Read Cache` Mode
When you're ready to develop front-end pages or need [request mock](#Start-Request-Mock)

> `dalao-proxy` would try to look up cache/mock file first, then return a real response after the failure.

> **Recommended:** The easier way is to delete `CACHE_TIME` field in the cached JSON files rather than frequent restarts of the service because of modifying config file.(Updated at **v0.8.3**)

Set option `cacheMaxAge` to *Read Cache* mode. [See option `cacheMaxAge`](#Option-cacheMaxAge)


```js
// set permanent request cache
"cacheMaxAge": ["s", "*"]
"cacheMaxAge": ["second", "*"]
// set certain expire time request cache (5 min)
"cacheMaxAge": ["m", 5]
"cacheMaxAge": ["minute", 5]
```

[back to menu](#Table-of-contents)

# Start Request Mock
> **Updated at v0.9.0** Now, `dalao-proxy` support Javascript-style cache file, so you can import any dependencies to mock your data. For example using [`Mock.js`](https://github.com/nuysoft/Mock/wiki/Getting-Started)

Type `dalao-proxy mock <HTTP method>` and the HTTP method you want to mock
```bash
# dalao-proxy mock [options] <method>
$ dalao-proxy mock post
> Request url: /api/list

Mock file created in /home/$(USER)/$(CWD)/.dalao-cache/GET_api_get.json


$ dalao-proxy mock post --js
> Request url: /api/list

Mock file created in /home/$(USER)/$(CWD)/.dalao-cache/GET_api_get.js
```
Put some mock data into `GET_api_get.json` file or do whatever you want in js file, then you can access `/api/list` to get your mock data.
```json
{
    "data": {
        "list": ["mock", "data"]
    },
    "code": 200
}
```
```js
const mockjs = require('mockjs');
const list = Mock.mock({
    'list|1-10': [{
        'id|+1': 1
    }]
});

module.exports = {
    data: list,
    code: 200
};
```

[back to menu](#Table-of-contents)
# Plugin System[Beta]
`Dalao-proxy` support custom plugins now by using option [`plugins`](#Option-plugins).
> **Note**: Reinstalling `dalao-proxy` will cause globally installed plugins to fail (local installation is not affected) and you will need to reinstall the required plugins globally.

## Install Plugin
### Global Install Plugin
```bash
# Globally install
$ dalao-proxy add-plugin <plugin name>

# Globally uninstall
$ dalao-proxy add-plugin -d <plugin name>
```
### Local Install Plugin
```bash
$ npm install -D dalao-proxy
$ npm install -D <plugin name>
```
Generate config json file
```bash
$ npx dalao-proxy init
```

Add plugin in config json file
```json
{
    "plugins": [
        "<plugin name>"
    ]
}
```

Then in package.json
```json
{
    "scripts": {
        "proxy": "dalao-proxy start"
    }
}
```

You can develop your plugins to expand the ability of `dalao-proxy`.
## Available Plugins
- [*Build in*] [**check-version**](https://github.com/CalvinVon/dalao-proxy/tree/master/src/plugin/check-version)

    The dalao-proxy will automaticly check the latest version.

- [*Build in*] [**proxy-cache**](https://github.com/CalvinVon/dalao-proxy/tree/master/src/plugin/proxy-cache)

    Doing awesome request cache and mock work.

- [**@calvin_von/proxy-plugin-monitor**](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/%40calvin_von/proxy-plugin-monitor) A dalao-proxy plugin for request monitoring.
    > Look at where the dalao-proxy forwarded the request.
- [*New*] [**@calvin_von/proxy-plugin-redirect**](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/%40calvin_von/proxy-plugin-redirect) A dalao-proxy plugin for request redirect.
    > Awesome plugin for debugging the online program locally.
## Lifecycle Hook
`Dalao-proxy` provides bellowing lifecycle hooks among different proxy periods.
> Note: All `context` parameters given are not read-only, you can modify and override the values at will.

> **Best Practices**: Each plugin produces its own context data under the `context` parameter, and appropriately modifies the behavior of `dalao-proxy` and its plugins according to the order in which the plugins are executed.
### `beforeCreate`
> You can do some initial operations here.
- type: `Function`
- params
    - `context`
        - `context.config`: parsed config object.
- detail:

    Invoked before proxy server created.

### `onRequest`
- type: `Function`
- params
    - `context`
        - `context.config`: parsed config object.
        - `context.request`: request received by the proxy server. Instance of `http.IncomingMessage`
        - `context.response`: response that proxy sever need to return. Instance of `http.ServerResponse`
    - `next`
        - type: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period. 
- detail:

    Invoked when a request received.

### `onRouteMatch`
- type: `Function`
- params
    - `context`
        - `context.config`: parsed config object
        - `context.request`: request received by the proxy server
        - `context.response`: response that proxy sever need to return
        - `context.matched`
            - `path`: matched path according to request URL.
            - `route`: matched route object.
            - `notFound`: whether the route is found.
    - `next`
        - type: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period.
- detail:

    Invoked when a request URL matches given `proxyTable` rules.

### `beforeProxy`
- type: `Function`
- params
    - `context`
        - `context.config`: parsed config object
        - `context.request`: request received by the proxy server
        - `context.response`: response that proxy sever need to return
        - `context.matched`
            - `path`: matched path according to request URL.
            - `route`: matched route object.
        - `context.proxy`
            - `uri`: the converted URI address.
            - `route`: matched route object.
    - `next`
        - type: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period.
- detail:

    Invoked before `dalao-proxy` start to send a proxy request.

### `afterProxy`
- type: `Function`
- params
    - `context`
        - `context.config`: parsed config object
        - `context.request`: request received by the proxy server
        - `context.response`: response that proxy sever need to return
        - `context.matched`
            - `path`: matched path according to request URL.
            - `route`: matched route object.
        - `context.proxy`
            - `uri`: the converted URI address.c
            - `route`: matched route object.
            - `request`: proxy request object. Instance of `request.Request`. see [request/request on Github](https://github.com/request/request#streaming)
            - `response`: proxy response object. Instance of `request.Response`.
        - `context.data`
            - `error`: proxy request error. instance of `Error`.
            - `request`
                - `rawBody`: raw data of request body
                - `body`: parsed data of request body
                - `query`: parsed data of request query
                - `type`: content type of request
            - `response`
                - `rawBody`: raw data of response body of proxy
                - `body`: parsed data of response body of proxy
                - `type`: content type of response of proxy
                - `size`: content size of response of proxy
                - `encode`: content type of response of proxy
    - `next`
        - type: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period.
- detail:

    Invoked after `dalao-proxy` has sent a proxy request and has resolved all request and response data.

[back to menu](#Table-of-contents)

# LICENSE
[MIT LICENSE](https://github.com/CalvinVon/dalao-proxy/blob/master/LICENSE)
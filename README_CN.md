# Dalao-proxy
基于插件系统的可扩展HTTP代理，用于前端开发人员请求缓存、数据模拟和页面开发！

> 一行代码就可以启动服务器！ 日常开发中比 `webpack-dev-server` 代理更轻便、更方便。

[![version](https://img.shields.io/npm/v/dalao-proxy.svg)](https://www.npmjs.com/package/dalao-proxy)
[![](https://img.shields.io/npm/dt/dalao-proxy.svg)](https://github.com/CalvinVon/dalao-proxy)
![dependencies](https://img.shields.io/david/CalvinVon/dalao-proxy.svg)

## 特点
- HTTP 代理
- HTTP 捕获
- 请求 mock 文件
- 通过灵活配置请求自动缓存
- 自动生成配置文件
- 配置文件更改时自动重新加载服务器
- 可扩展和基于插件的系统

![v0.9.2 preview](https://raw.githubusercontent.com/CalvinVon/dalao-proxy/master/.github/screenshot/start.png)

# 目录
- [起步](#起步)
    - [安装](#安装)
    - [配置](#配置)
    - [启动代理](#Start-proxy)
    - [快乐程序员](#Enjoy-It)
- [命令](#Commands)
- [文件](#Docs)
    - [配置](#configuration-file)
        - [选项 `watch`](#Option-watch)
        - [选项 `cache`](#Option-cache)
        - [选项 `cacheContentType`](#Option-cacheContentType)
        - [选项 `cacheMaxAge`](#Option-cacheMaxAge)
        - [选项 `responseFilter`](#Option-responseFilter)
        - [选项 `proxyTable`](#Option-proxyTable)
        - [代理 `route` 配置](#Proxy-route-config)
            - [路由选项 `pathRewrite`](#Route-option-pathRewrite)
- [开始请求响应缓存](#Start-Cache-Request-Response)
    - [举个栗子](#Example)
    - [`Never Read Cache` 模式](#Never-Read-Cache-模式)
    - [`Read Cache` 模式](#Read-Cache-Mode)
- [开始 MOCK 请求](#开始-MOCK-请求)
- [插件系统](#Plugin-Systembeta)
    - [安装插件](#Install-Plugin)
        - [全局安装](#Global-Install-Plugin)
        - [本地安装](#Local-Install-Plugin)
    - [可用的插件](#Available-Plugins)
    - [生命周期钩子](#Lifecycle-Hook)
        - [beforeCreate](#beforeCreate)
        - [onRequest](#onRequest)
        - [onRouteMatch](#onRouteMatch)
        - [beforeProxy](#beforeProxy)
        - [afterProxy](#afterProxy)

# 起步
## 安装
```bash
$ npm i dalao-proxy -g
```

## 配置
默认配置文件将会生成在 `dalao.config.json`.
```bash
# This utility will walk you through creating a config file
$ dalao-proxy init

# Generate config file directly
$ dalao-proxy init -y
```

## 启动代理
```bash
# dalao 将会读取默认配置文件
$ dalao-proxy start

# 定制命令行选项
dalao-proxy start -wc --config ./dalao.config.json
```
启动选项
```
Options:
    -C, --config [filepath]     使用定制的配置文件
    -w, --watch                 配置文件更新时自动重启
    -P, --port [port]           定制代理监听端口
    -H, --host [hostname]       定制代理监听host
    -t, --target [proxyTarget]  代理目标地址
    -c, --cache                 开启请求缓存
    -i, --info                  开启日志输出
    -h, --help                  输出帮助信息
```

🎉  恭喜, 你的代理服务器已经启动, 现在你也拥有了自己的 *dalao*！

## 快乐程序员
每次修改配置文件，`dalao` 都会自动重启并输出提示。

[返回目录](#Table-of-contents)

# 命令
```bash
$ dalao-proxy --help
Usage: dalao-proxy [options] [command]

Options:
  -V, --version                      输出版本号
  -h, --help                         输出帮助信息

Commands:
  start [options]                    自动检测配置 & 启动代理服务器
  init [options]                     在当前文件夹中创建一个配置文件
  mock [options] <method>            创建一个 json 格式的 mock 文件
  clean [options]                    清空所有缓存文件
  add-plugin [options] <pluginName>  全局添加插件
```

# 文件
## 配置
启动时，Dalao将在当前工作目录中查找配置文件。

默认的配置文件名是 `dalao.config.json`
```js
{
    // 配置文件名
    "configFilename": "dalao.config.json",
    // catch文件存储
    "cacheDirname": ".dalao-cache",
    // 在配置文件更改时自动重新加载
    "watch": true,
    // 代理服务器host
    "host": "localhost",
    // 代理服务器端口号
    "port": 8000,
    // 代理目标（基本设置）
    "target": "target.example.com",
    // 启用代理请求缓存（基本设置）
    "cache": false,
    // 定义缓存的响应类型（基本设置）
    "cacheContentType": [
        "application/json"
    ],
    // 定义缓存的最长有效时间
    "cacheMaxAge": [
        "second",
        0
    ],
    // 定义请求返回体过滤器
    "responseFilter": [
        "code",
        200
    ],
    // 开启日志
    "info": false,
    // 显示调试信息
    "debug": false,
    // 自定义响应头
    "headers": {},
    // 代理路由规则表
    "proxyTable": {
        // 匹配规则
        "/": {
            "path": "/"
        }
    },
    // 插件列表
    "plugins": []
}
```
### 选项 `host`
- 类型: **string**

当配置为`0.0.0.0`时，局域网内其他设备也可以访问，本机使用`localhost`访问。

### 选项 `watch`
- 类型: **boolean**
- 默认值: `true`

配置文件更改时启用代理服务器自动重新加载。

### 选项 `cache`
- 类型: **boolean**
- 默认值: `true`

    响应满足 [一些条件](#Start-Cache-Request-Response) 时启用请求自动缓存。
    > 当请求从缓存文件返回时，会在响应标头中添加额外字段 `X-Cache-Request` 。

### 选项 `cacheContentType`
- *前提条件: 当 `cache` 选项为 `true`*
- 类型: **Array**
- 默认值: `['application/json']`

    按响应内容类型筛选时，至少有一个项匹配时缓存请求响应。
    *支持 `正则` 表达式*

### 选项 `cacheMaxAge`
- *前提条件： 当 `cache` 选项为 `true`*
- 类型: **Array**
    - cacheMaxAge[0]: 缓存过期时间单位
    - cacheMaxAge[1]: 缓存过期时间数值
        - 当填写 `0`, `dalao-proxy` 将 **不会** 尝试查找缓存文件 (但仍然是缓存请求)。
        - 当填写 `'*'`, 表示缓存文件 **永不过期**, `dalao-proxy` 先读取缓存文件，然后再发送实际请求。
- 默认值: `['second', 0]`

    缓存文件的缓存过滤到期时间。
    > 支持快速重启并立即生效。

    > `X-Cache-Expire-Time` 和 `X-Cache-Rest-Time` 字段将包含在响应标头中。

### 选项 `responseFilter`
- *前提条件： 当 `cache` 选项为 `true`*
- 类型: **Array**
    - responseFilter[0]: 用于过滤的响应主体字段
    - responseFilter[1]: 过滤的有效值
- 默认值: `['code', 200]`

通过响应数据过滤缓存。 *不是 HTTP 状态码*

### 选项 `plugins`
- 类型: **Array**

    给出了一系列插件 *npm 包名*。

    如果你需要添加插件以扩展 `dalao-proxy`. 请参阅 [插件](#插件).

### 选项 `proxyTable`
- 类型: **Object**
- 默认值: `{ "/": { "path": "/" } }`

    代理 [route](#Proxy-route-config) 映射集。

### `route` 代理配置
```js
{
    // 代理目标路径
    // 默认: `/`
    path
    // 代理目标
    // 扩展基本配置项 `target`
    target,
    // 代理目标路径重写
    pathRewrite,
    // 路由自定义配置
    // 默认：扩展基本配置 
    cache,
    cacheContentType，
    cacheMaxAge,
    responseFilter,
}
```
#### Route 选项 `pathRewrite`
使用 `RegExp` 表达式匹配目标路径，并替换为重写值。

例:
```js
"pathRewrite": {
    "^/api": ""
}
```

`"/api/user/list"` 将被替换为 `"/user/list"`

[返回目录](#Table-of-contents)

# 启动缓存请求响应
1. 将选项 `cache` 设置为 `true`
1. 设置适当的 `cacheContentType`， `cacheMaxAge`，`responseFilter` 选项值

    当这三个字段满足某些条件时，请求响应将缓存在文件夹 (`cacheDirname`你指定的)中。

## 例:
以下是服务器响应数据的简单示例
```js
// 发送请求
POST /api/list HTTP/1.1
...

// 获取响应
connection: keep-alive
content-encoding: gzip
content-type: application/json; charset=UTF-8
date: Fri, 19 Apr 2019 08:35:42 GMT
server: nginx/1.10.3 (Ubuntu)
transfer-encoding: chunked
vary: Accept-Encoding
// 响应数据
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

配置应该是这样的：
```js
"cache": true,
"cacheContentType": ["application/json"],
"responseFilter": ["status", 1],
```

## `Never Read Cache` 模式
如果您只想缓存响应并获得真正的代理响应

> **建议** 您完成前端和后端API对接或要求高精度的响应数据。

> 当后端服务在开发期间崩溃时，您可以切换到 [`Never Read Cache` 模式](#Never-Read-Cache-模式) 以 **创建伪后端服务**.

将选项 `cacheMaxAge` 设置成 *Never Read Cache* 模式
```js
"cacheMaxAge": ["s", 0]
```

## `Read Cache` 模式
当您准备开发前端页面或需要 [开始 MOCK 请求](#开始-MOCK-请求)

> `dalao-proxy` 会先尝试查找缓存/模拟文件，然后在失败后返回真实的响应。

> **建议：** 更简单的方法是删除缓存在JSON文件中的 `CACHE_TIME` 字段，而不是因修改配置文件而频繁重启服务。(更新于 **v0.8.3**)

将选项 `cacheMaxAge` 设置为 *Read Cache* 模式。 [选项 `cacheMaxAge`](#Option-cacheMaxAge)


```js
// 设置永久请求缓存
"cacheMaxAge": ["s", "*"]
"cacheMaxAge": ["second", "*"]
// set certain expire time request cache (5 min)
"cacheMaxAge": ["m", 5]
"cacheMaxAge": ["minute", 5]
```

[返回目录](#Table-of-contents)

# Start Request Mock
Type `dalao-proxy mock <HTTP method>` and the HTTP method you want to mock

> **Updated at v0.9.0** Now, `dalao-proxy` support Javascript-style cache file, so you can import any dependencies to mock your data. For example using [`Mock.js`](https://github.com/nuysoft/Mock/wiki/Getting-Started)
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

[返回目录](#Table-of-contents)
# Plugin System[Beta]
`Dalao-proxy` support custom plugins now by using option [`plugins`](#Option-plugins).

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

### `beforeCreate`
> You can do some initial operations here.
- 类型: `Function`
- params
    - `context`
        - `context.config`: parsed config object.
- detail:

    Invoked before proxy server created.

### `onRequest`
- 类型: `Function`
- params
    - `context`
        - `context.config`: parsed config object.
        - `context.request`: request received by the proxy server. Instance of `http.IncomingMessage`
        - `context.response`: response that proxy sever need to return. Instance of `http.ServerResponse`
    - `next`
        - 类型: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period. 
- detail:

    Invoked when a request received.

### `onRouteMatch`
- 类型: `Function`
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
        - 类型: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period.
- detail:

    Invoked when a request URL matches given `proxyTable` rules.

### `beforeProxy`
- 类型: `Function`
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
        - 类型: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period.
- detail:

    Invoked before `dalao-proxy` start to send a proxy request.

### `afterProxy`
- 类型: `Function`
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
        - 类型: `Function`
        - params: `error`/`interruptMessage`
            - If an `error` param passed in, the request would be interrupted because of throwing an error.
            - If a `string` param passed in, it would be seen as a `PluginInterrupt` without throwing an error.

        A `next` function must be called to enter the next period.
- detail:

    Invoked after `dalao-proxy` has sent a proxy request and has resolved all request and response data.

[返回目录](#Table-of-contents)

# LICENSE
[MIT LICENSE](https://github.com/CalvinVon/dalao-proxy/blob/master/LICENSE)
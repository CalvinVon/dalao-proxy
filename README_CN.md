# Dalao-proxy
基于插件系统的可扩展HTTP代理，用于前端开发人员请求缓存、数据模拟和页面开发！

> 一行代码就可以启动服务器！ 日常开发中比 `webpack-dev-server` 代理更轻便、更方便。

[![version](https://img.shields.io/npm/v/dalao-proxy.svg)](https://www.npmjs.com/package/dalao-proxy)
[![](https://img.shields.io/npm/dt/dalao-proxy.svg)](https://github.com/CalvinVon/dalao-proxy)
[![Package Quality](https://npm.packagequality.com/shield/dalao-proxy.svg)](https://packagequality.com/#?package=dalao-proxy)
![dependencies](https://img.shields.io/david/CalvinVon/dalao-proxy.svg)

[English Doc](https://github.com/CalvinVon/dalao-proxy/blob/master/README.md)
|
[中文文档](https://github.com/CalvinVon/dalao-proxy/blob/master/README_CN.md)

## 特性
- HTTP 代理
- HTTP 捕获
- 请求模拟
- 通过灵活配置自动缓存请求
- 自动生成配置文件
- 配置文件更改时自动重启
- 支持多环境快速自由切换
- 可扩展和插件架构的系统

![v0.9.2 preview](https://raw.githubusercontent.com/CalvinVon/dalao-proxy/master/.github/screenshot/start.png)

# 目录
- [起步](#起步)
    - [安装](#安装)
    - [配置](#配置)
    - [启动代理](#启动代理)
    - [快乐程序员](#快乐程序员)
- [命令行](#命令行)
- [文档](#文档)
    - [详细配置](#详细配置)
        - [选项 `host`](#选项-host)
        - [选项 `watch`](#选项-watch)
        - [选项 `cache`](#选项-cache)
        - [选项 `cacheContentType`](#选项-cacheContentType)
        - [选项 `cacheMaxAge`](#选项-cacheMaxAge)
        - [选项 `responseFilter`](#选项-responseFilter)
        - [选项 `proxyTable`](#选项-proxyTable)
        - [`route` 配置](#route-配置)
            - [`route`选项 `pathRewrite`](#route-选项-pathRewrite)
- [开始缓存请求响应](#开始缓存请求响应)
    - [举个栗子](#举个栗子)
    - [`Never Read Cache` 模式](#Never-Read-Cache-模式)
    - [`Read Cache` 模式](#Read-Cache-模式)
- [开始模拟请求数据](#开始模拟请求数据)
- [插件系统[Beta版]](#插件系统Beta版)
    - [安装插件](#安装插件)
        - [全局安装](#全局安装)
        - [局部安装](#局部安装)
    - [可用的插件](#可用的插件)
    - [生命周期钩子](#生命周期钩子)
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
# 初始化工具会帮助你生成定制的配置文件
$ dalao-proxy init

# 直接生成默认配置文件
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

[返回目录](#目录)

# 命令行
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

# 文档
## 详细配置
启动时，`dalao-proxy`将在当前工作目录中查找并读取配置文件。

默认的配置文件名是 `dalao.config.json`
```js
{
    // 配置文件文件名
    "configFilename": "dalao.config.json",
    // 请求缓存文件存储文件夹名称
    "cacheDirname": ".dalao-cache",
    // 是否监听配置文件更改并自动重新加载
    "watch": true,
    // 代理服务器 host
    "host": "localhost",
    // 代理服务器端口号
    "port": 8000,
    // 代理目标（通用设置）
    "target": "target.example.com",
    // 是否启用代理请求缓存（通用设置）
    "cache": false,
    // 设置要缓存请求响应的内容类型（通用设置）
    "cacheContentType": [
        "application/json"
    ],
    // 设置缓存文件的最长有效时间
    "cacheMaxAge": [
        "second",
        0
    ],
    // 设置请求返回体过滤器
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

    > 当配置为 `0.0.0.0` 时，局域网内其他设备也可以访问，本机使用`localhost`访问。

### 选项 `watch`
- 类型: **boolean**
- 默认值: `true`

配置文件更改时启用代理服务器自动重新加载。

### 选项 `cache`
- 类型: **boolean**
- 默认值: `true`

    响应满足[一些条件](#开始缓存请求响应)时启用请求缓存。
    > 当请求从缓存文件返回时，会在响应标头中添加额外字段 `X-Cache-Request`。

### 选项 `cacheContentType`
- *前提条件: 当 `cache` 选项为 `true`*
- 类型: **Array**
- 默认值: `['application/json']`

    按响应内容类型筛选，当至少有一个项匹配时缓存请求响应。
    *支持 `正则` 表达式*

### 选项 `cacheMaxAge`
- *前提条件： 当 `cache` 选项为 `true`*
- 类型: **Array**
    - cacheMaxAge[0]: 设置缓存过期时间单位（支持简写 `d`, `day`, `days`）。
    - cacheMaxAge[1]: 设置缓存过期时间数值
        - 当值为 `0` 时, `dalao-proxy` 将 **永远不会** 尝试读取缓存文件 (但仍然缓存请求响应)。
        - 当值为特殊值 `'*'` 时, 表示缓存文件将 **永不过期**, `dalao-proxy` 先尝试读取并返回缓存文件，若没有找到再返回真实的请求响应。
- 默认值: `['second', 0]`

    设置缓存文件的的到期时间（最长有效时间）。

    > `X-Cache-Expire-Time` 和 `X-Cache-Rest-Time` 字段将会被包含在响应标头中。

### 选项 `responseFilter`
- *前提条件： 当 `cache` 选项为 `true`*
- 类型: **Array**
    - responseFilter[0]: 设置用于判断是否缓存的响应体字段
    - responseFilter[1]: 设置该字段的有效值
- 默认值: `['code', 200]`

    设置通过响应数据判断是否缓存。 *不是通过 HTTP 状态码判断*

### 选项 `plugins`
- 类型: **Array**

    设置使用插件的列表 *npm 包名*。

    你将会需要添加插件来扩展 `dalao-proxy` 的能力。请参阅 [插件](#插件) 部分.

### 选项 `proxyTable`
- 类型: **Object**
- 默认值: `{ "/": { "path": "/" } }`

    代理 [route](#route-配置) 配置集合。

### `route` 配置
> 填写完路由之后，所有配置字段均可省略不填

```js
{
    // 代理目标路径
    // 默认: `/`
    "path": "/api/your/target",
    // 代理目标
    // 继承于通用配置项 `target`
    "target": "http://your.target.com",
    // 代理目标路径重写
    "pathRewrite": {
        "^/api": "/api/v1"
    },
    // 路由自定义配置
    // 继承于通用配置项 `cache`
    "cache": true,
    // 继承于通用配置项 `cacheContentType`
    "cacheContentType": ["json"],
    // 继承于通用配置项 `cacheMaxAge`
    "cacheMaxAge": ["year", 365],
    // 继承于通用配置项 `responseFilter`
    "responseFilter": ["code", 200],
}
```
#### Route 选项 `pathRewrite`
使用`正则表达式`匹配目标路径，并替换为重写值。

例:
```js
"pathRewrite": {
    "^/api": ""
}
```

`"/api/user/list"` 将被替换为 `"/user/list"`

[返回目录](#目录)

---


# 开始缓存请求响应
1. 将选项 `cache` 设置为 `true`
1. 设置适当的 `cacheContentType`， `cacheMaxAge`，`responseFilter` 选项值

    当这三个字段满足某些条件时，请求响应将作为缓存文件保存在指定的`cacheDirname`文件夹中。

## 举个栗子
以下是服务器响应数据的简单示例
```bash
// 发送请求
POST /api/list HTTP/1.1
...

// 请求响应
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
如果你只想把真实的响应缓存起来，并对请求代理没有任何影响的话。

> **建议** 当要求返回真实的、高精度的响应数据时。

> **场景** 当后端服务在开发期间崩溃时，你可以快速切换到 [`Read Cache` 模式](#Read-Cache-模式) 以 **创建一个不依赖于后端的简单“后台”服务**。

> 想要在此模式时，**为某个接口单独返回缓存/模拟文件时**，你可以选择删除缓存在JSON（JS）文件中的 `CACHE_TIME` 字段，而不是反复修改配置来切换模式，后者将会频繁重启服务。(更新于 **v0.8.3**)

将选项 `cacheMaxAge` 设置成 *Never Read Cache* 模式
```js
"cacheMaxAge": ["s", 0]
```

## `Read Cache` 模式
当你准备开发前端页面或需要 [开始 MOCK 请求](#开始-MOCK-请求) 时，或者要获取更多变的数据时。

> `dalao-proxy` 会先尝试查找缓存/模拟文件，若没有找到时再返回真实的请求响应。

> **建议：** 更简单的方法是删除缓存在JSON（JS）文件中的 `CACHE_TIME` 字段。(更新于 **v0.8.3**)

将选项 `cacheMaxAge` 设置为 *Read Cache* 模式。 [选项 `cacheMaxAge`](#Option-cacheMaxAge)


```js
// 设置永久请求缓存
"cacheMaxAge": ["s", "*"]
"cacheMaxAge": ["second", "*"]
// set certain expire time request cache (5 min)
"cacheMaxAge": ["m", 5]
"cacheMaxAge": ["minute", 5]
```

[返回目录](#目录)

# 开始模拟请求数据
> **v0.9.0更新** 现在, `dalao-proxy` 支持JS类型的缓存文件，因此，你可以引用任何库来模拟你的数据. 例如使用 [`Mock.js`](https://github.com/nuysoft/Mock/wiki/Getting-Started)

输入 `dalao-proxy mock <HTTP method>` 和要模拟的 HTTP 请求方法
```bash
# dalao-proxy mock [options] <method>
$ dalao-proxy mock post
> Request url: /api/list

Mock file created in /home/$(USER)/$(CWD)/.dalao-cache/GET_api_get.json

# 传入`--js`参数来使用 js模式的缓存文件
$ dalao-proxy mock post --js
> Request url: /api/list

Mock file created in /home/$(USER)/$(CWD)/.dalao-cache/GET_api_get.js
```

将一些模拟数据放入`GET_api_get.json`文件或在js文件中执行任何操作，然后您可以访问`/api/list`以获取模拟数据。
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

[返回目录](#目录)

---

# 插件系统[Beta版]
`Dalao-proxy` 现在通过使用选项 [`plugins`](#Option-plugins) 来支持使用自定义插件。
> 注意，重新安装 `dalao-proxy` 将导致全局安装的插件失效（局部安装不受影响），你需要重新全局安装需要的插件。

## 安装插件
### 全局安装
```bash
# 全局安装
$ dalao-proxy add-plugin <plugin name>

# 全局卸载
$ dalao-proxy add-plugin -d <plugin name>
```
### 局部安装
```bash
$ npm install -D dalao-proxy
$ npm install -D <插件名称>
```
生成配置文件
```bash
$ npx dalao-proxy init
```

在配置文件的 `plugins` 选项中添加
```json
{
    "plugins": [
        "<插件名称>"
    ]
}
```

然后在 package.json 中添加命令
```json
{
    "scripts": {
        "proxy": "dalao-proxy start"
    }
}
```

你也可以自己开发插件来扩展 `dalao-proxy` 的行为能力。
## 可用的插件
- [*内建*] [**check-version**](https://github.com/CalvinVon/dalao-proxy/tree/master/src/plugin/check-version)

    该插件将自动检查 `dalao-proxy` 的最新版本。

- [*内建*] [**proxy-cache**](https://github.com/CalvinVon/dalao-proxy/tree/master/src/plugin/proxy-cache)

    该插件完成了很棒的请求缓存和模拟工作.

- [**@calvin_von/proxy-plugin-monitor**](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/%40calvin_von/proxy-plugin-monitor) 用于请求监控的插件
    > 查看代理的请求在 dalao-proxy 内部匹配的规则和具体请求的位置。

- [*新发布*] [**@calvin_von/proxy-plugin-redirect**](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/%40calvin_von/proxy-plugin-redirect) 用于请求重定向的插件
    > 用于在本地调试线上（前端）代码的插件。
## 生命周期钩子
`Dalao-proxy` 提供了不同代理周期之间的生命周期钩子.
> 注意：给出的 `context` 参数里的所有数据*均非只读*，你可以随意修改和覆盖这些值，但是要注意各个插件和核心代码之间的配合。

> **最佳实践**：每一个插件都在 `context` 参数下生产自己的上下文数据，根据插件执行的顺序来适当修改 `dalao-proxy` 及其插件的行为。
### `beforeCreate`
> 你可以在这里做一些根据配置文件的定义的初始化操作。
- 类型: `Function`
- 参数
    - `context`
        - `context.config`: 解析过的配置文件对象。
- 详情:

    在创建代理服务器之前调用。

### `onRequest`
- 类型: `Function`
- 参数
    - `context`
        - `context.config`: 解析过的配置文件对象。
        - `context.request`: 代理服务器接收到的请求。 `http.IncomingMessage` 的实例
        - `context.response`: 代理服务器需要返回的响应对象。 `http.ServerResponse` 的实例
    - `next`
        - 类型: `Function`
        - 参数: `error`/`interruptMessage`
            - 如果 `error` 参数被传入, 此次请求将由于抛出错误而导致被中断。
            - 如果一个 `string` 类型的参数传入, 它将被视为`PluginInterrupt`而不会抛出错误

        `next`函数必须被调用，以进入下一个周期。 
- 详情:

    代理服务器接收到请求时调用。

### `onRouteMatch`
- 类型: `Function`
- 参数
    - `context`
        - `context.config`: 解析过的配置文件对。
        - `context.request`: 代理服务器接收到的请求。
        - `context.response`: 代理服务器需要返回的响应对象。
        - `context.matched`
            - `path`: 匹配到的请求 path。
            - `route`: 匹配的路由对象。
            - `notFound`: 是否匹配到给定的 proxyTable。
    - `next`
        - 类型: `Function`
        - 参数: `error`/`interruptMessage`
            - 如果 `error` 参数被传入, 此次请求将由于抛出错误而导致被中断。
            - If a `string` param passed in, 它将被视为`PluginInterrupt`而不会抛出错误

        `next`函数必须被调用，以进入下一个周期。
- 详情:

    请求URL与给定`proxyTable`规则匹配时调用。

### `beforeProxy`
- 类型: `Function`
- 参数
    - `context`
        - `context.config`: 解析过的配置文件对。
        - `context.request`: 代理服务器接收到的请求。
        - `context.response`: 代理服务器需要返回的响应对象。
        - `context.matched`
            - `path`: 匹配到的请求 path。
            - `route`: 匹配的路由对象。
        - `context.proxy`
            - `uri`: 转换过后的 URI 地址。
            - `route`: 匹配的路由对象。
    - `next`
        - 类型: `Function`
        - 参数: `error`/`interruptMessage`
            - 如果 `error` 参数被传入, 此次请求将由于抛出错误而导致被中断。
            - If a `string` param passed in, 它将被视为`PluginInterrupt`而不会抛出错误

        `next`函数必须被调用，以进入下一个周期。
- 详情:

    在 `dalao-proxy` 开始发送代理请求之前调用。

### `afterProxy`
- 类型: `Function`
- 参数
    - `context`
        - `context.config`: 解析过的配置文件对。
        - `context.request`: 代理服务器接收到的请求。
        - `context.response`: 代理服务器需要返回的响应对象。
        - `context.matched`
            - `path`: 匹配到的请求 path。
            - `route`: 匹配的路由对象。
        - `context.proxy`
            - `uri`: 转换过后的 URI 地址。
            - `route`: 匹配的路由对象。
            - `request`: 代理请求对象。 `request.Request`的实例。 在 [Github 上查看 request/request](https://github.com/request/request#streaming)
            - `response`: 代理响应对象。 `request.Response` 的实例。
        - `context.data`
            - `error`: 代理请求中出错的错误对象。 `Error` 的实例
            - `request`
                - `rawBody`: 请求体的原始数据。
                - `body`: 解析后的请求体数据。
                - `query`: 解析后的请求查询参数。
                - `type`: 请求的内容类型。
            - `response`
                - `rawBody`: 代理响应体的原始数据。
                - `body`: 解析后的代理响应体的数据。
                - `type`: 代理响应的内容类型。
                - `size`: 代理响应的内容大小。
                - `encode`: 代理响应的内容类型。
    - `next`
        - 类型: `Function`
        - 参数: `error`/`interruptMessage`
            - 如果 `error` 参数被传入, 此次请求将由于抛出错误而导致被中断。
            - If a `string` param passed in, 它将被视为`PluginInterrupt`而不会抛出错误

        `next`函数必须被调用，以进入下一个周期。
- 详情:

    在 `dalao-proxy` 发送代理请求并解析完所有请求和响应数据后调用。

[返回目录](#目录)

# LICENSE
[MIT LICENSE](https://github.com/CalvinVon/dalao-proxy/blob/master/LICENSE)
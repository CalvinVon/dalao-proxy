# Dalao-proxy
An HTTP proxy for frontend developer with request cache, request mock and development!

> An one-line command started server! More light-weight and convenient than webpack-dev-server in daily development.

## Feature
- HTTP proxy
- HTTP capture
- request mock file
- request auto cache with flexible configuration
- auto generate config file
- auto reload proxy server when config file changes

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
dalao-proxy start
```
🎉  Congratulations, your one-line command proxy server started, now you have your own *dalao*!
### Enjoy it!
Every single modification of the configuration file, the `dalao` will automatically restart and output prompts.

## Docs
It's on the way...

Well, you can type `dalao-proxy --help` for help temporarily.

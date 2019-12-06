# Plugin-autorun-scripts
A [dalao-proxy](https://github.com/CalvinVon/dalao-proxy) for auto run multiple commands in parallel.
> only support dalao-proxy > 1.x

[![version](https://img.shields.io/npm/v/@calvin_von/plugin-autorun-scripts.svg)](https://www.npmjs.com/package/@calvin_von/plugin-autorun-scripts)
[![](https://img.shields.io/npm/dt/@calvin_von/plugin-autorun-scripts.svg)](https://github.com/CalvinVon/dalao-proxy/tree/master/packages/@calvin_von/plugin-autorun-scripts)

## Usage
Install `dalao-proxy` cli first
```bash
npm install -g dalao-proxy
```

Install plugin
- globally
    ```bash
    $ dalao-proxy plugin install -g @calvin_von/plugin-autorun-scripts
    ```

- locally
    ```bash
    $ dalao-proxy plugin install -D @calvin_von/plugin-autorun-scripts
    ```

Add config
```json
"autorun": {
    "scripts": ["start"]
}
```

Start proxy
```bash
$ dalao-proxy start
...
> npm run start
```

more docs about `dalao-proxy`, see [CalvinVon/dalao-proxy on Github](https://github.com/CalvinVon/dalao-proxy).

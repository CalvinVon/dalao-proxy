const { Command } = require('commander');const defaultConfig = require('../config');
const ConfigParser = require('./parser/config-parser');
const BodyParser = require('./parser/body-parser');
const { Plugin } = require('./plugin');
const Utils = require('./utils');

class CommandContext {
    constructor() {
        /**
         * the entry command
         */
        this.program = null;
        /**
         * the current (sub)command
         */
        this.command = null;
        /**
         * the current (sub)command name
         */
        this.commandName = null;
        /**
         * parsed options values
         */
        this.options = {};
        /**
         * user's raw config
         * @description Notice that it may not exist
         */
        this.rawConfig = null;
        /**
         * *configurable*
         * 
         * parsed core config
         * 
         * @description the config is **not parsed immediately** in **`command#action()`** method,
         *  at the meantime, the config value is only the result of simply merged user's config with the default
         *  config, you need to use **`register`** object to **configure/access** the value after parsed.
         */
        this.config = {};
        /**
         * user's config file path
         */
        this.configPath = null;
        /**
         * default config
         */
        this.defaultConfig = defaultConfig;
        /**
         * *configurable*
         * 
         * Core proxy server
         */
        this.server = null;
        /**
         * runtime plugins list
         */
        this.plugins = [];
        this.pluginIds = new Set();
        /**
         * *configurable*
         * 
         * program output
         */
        this.output = {};

        this.exports = {
            ConfigParser,
            BodyParser,
            Plugin,
            Utils,
            Command,
            bin: require.resolve('../bin/dalao-proxy')
        };
    }
}

module.exports = CommandContext;

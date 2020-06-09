const baseConfig = require('./webpack.base');
const merge = require('webpack-merge');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(baseConfig, {
    mode: 'production',
    output: {
        library: 'cacheSwitcherUI',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /s?css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    entry: path.join(__dirname, '..', 'src', 'index.jsx'),
    devtool: 'none',
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'cache-switcher-ui.css'
        })
    ]
});

const baseConfig = require('./webpack.base');
const merge = require('webpack-merge');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const devConfig = merge(baseConfig, {
    mode: 'development',
    entry: path.join(__dirname, '..', 'src', 'example'),
    module: {
        rules: [
            {
                test: /s?css$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    devtool: 'source-map',
    devServer: {
        host: 'localhost',
        port: 8080,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, '..', 'public', 'example.html')
        })
    ]
});

module.exports = devConfig;
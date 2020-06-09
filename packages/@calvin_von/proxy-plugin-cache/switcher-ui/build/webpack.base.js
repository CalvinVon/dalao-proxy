const path = require('path');
module.exports = {
    output: {
        path: path.join(__dirname, '..', 'dist'),
        filename: "cache-switcher-ui.js"
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: [
                    path.join(__dirname, '..', 'src')
                ],
                exclude: [
                    path.join(__dirname, '..', 'node_modules')
                ],
                loader: 'babel-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.json', '.js', '.jsx']
    }
};
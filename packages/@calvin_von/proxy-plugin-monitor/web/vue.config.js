module.exports = {
    configureWebpack: {
        // output: {
        //     globalObject: 'self',
        // },
        module: {
            rules: [
                {
                    test: /\.worker\.js$/,
                    use: [{ loader: 'worker-loader' }],
                }
            ]
        },
    },
    chainWebpack: config => {
        config.module.rule('js').exclude.add(/\.worker\.js$/)
    }
};
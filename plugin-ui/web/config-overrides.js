const path = require('path');
const fs = require('fs');
const { override, fixBabelImports, addLessLoader } = require('customize-cra');

const definedVariables = readLessVariables();

module.exports = override(
    fixBabelImports('import', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
    }),
    addLessLoader({
        javascriptEnabled: true,
        modifyVars: {
            '@primary-color': definedVariables['@color-primary']
        }
    }),
    (config) => {
        if (process.env.NODE_ENV === "production") config.devtool = false;

        const loaders = config.module.rules.find(rule => Array.isArray(rule.oneOf)).oneOf;
        loaders[7].use.push({
            loader: 'style-resources-loader',
            options: {
                patterns: [
                    path.resolve(__dirname, 'src/styles/variable.less')
                ]
            }
        });

        require('fs').writeFileSync(__dirname + '/webpack-config.json', JSON.stringify(config, null, 4));
        return config;
    }
);

function readLessVariables() {
    const variableMapper = {};
    const variables = fs
        .readFileSync(path.join(__dirname, './src/styles/variable.less'))
        .toString()
        .split('\n');
    for (const variableStr of variables) {
        if (variableStr) {
            const matched = variableStr.match(/^(@\S+?)\:\s*(#\S+?);$/);
            if (matched) {
                variableMapper[matched[1]] = matched[2];
            }
        }
    }
    console.log(variableMapper);
    return variableMapper;
}

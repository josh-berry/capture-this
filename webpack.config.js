const path = require("path");
const VueLoaderPlugin = require('vue-loader/dist/plugin').default;
const TerserPlugin = require('terser-webpack-plugin');
const {DefinePlugin} = require("webpack");

module.exports = env => ({
    entry: {
        "index": "./src/index.ts",
        "options-ui": "./src/options-ui.ts",
        "test": "./src/test/index.ts",
    },
    mode: env,
    devtool: "inline-source-map",
    cache: {
        type: 'filesystem',
        buildDependencies: { config: [__filename] },
    },
    module: {
        rules: [
            {test: /\.vue$/, loader: 'vue-loader'},
            {test: /\.tsx?$/, loader: 'ts-loader',
             exclude: /node_modules/, options: {appendTsSuffixTo: [/.vue$/]}},
            {test: /\.svg$/, loader: 'file-loader'},
            {test: /\.css$/, use: [
                'vue-style-loader',
                {loader: 'css-loader', options: {
                    esModule: false, // to make css-loader 4.x work with vue
                    modules: true,
                }},
            ]},
        ],
    },
    resolve: {
        modules: [path.resolve(__dirname, 'src'), 'node_modules'],
        extensions: ['.ts', '.js', '.vue', '.json'],
        alias: {
            'vue$': 'vue/dist/vue.runtime.esm-bundler'
        },
    },
    plugins: [
        new VueLoaderPlugin(),
        new DefinePlugin({
            __VUE_OPTIONS_API__: JSON.stringify(true),
            __VUE_PROD_DEVTOOLS__: JSON.stringify(env === 'development'),
        }),
    ],

    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    // Required because mangling names breaks fake-indexeddb.
                    mangle: false,
                },
            }),
        ],
        // We always enable minimization so that debug and release builds look
        // as similar as possible--have seen test failures in release builds
        // when this isn't done.
        minimize: true,

        // Enable some options for deterministic builds
        portableRecords: true,
    },

    output: {
        path: path.resolve(__dirname, "dist"),
    }
});



const webpack = require('webpack');
const HTMLPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';


const config = {
    target: 'web',
    entry:
        {
            app: __dirname + '/src/index.js',
            vendor: ["vue"]
        },
    output: {
        filename: 'bundle.js',
        path: __dirname + '/dist'
    },
    devtool: '#cheap-module-eval-source-map',
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.jsx$/,
                loader: 'babel-loader'
            }
            , {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }, {
                test: /\.(gif|jpg|jpeg|svg|png)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 2048,
                            name: '[name].[ext]'
                        }
                    }
                ]
            }, {
                test: /\.less$/,
                use: [

                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true,
                        }
                    },
                    'less-loader'
                ]
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: isDev ? '"development"' : '"production"'
            }
        }),
        new HTMLPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'runtime'
        })
    ],
    devServer: {
        port: 8000,
        host: '0.0.0.0',
        overlay: {
            error: true
        },
        hot: true
        //historyFallback: {

        //}
        //open:true
    }
};

module.exports = config;



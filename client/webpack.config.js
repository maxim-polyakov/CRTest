const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html'
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public')
        },
        port: 3001,
        host: '0.0.0.0',
        hot: true,
        open: false,
        historyApiFallback: true,
        allowedHosts: 'all',
        client: {
            webSocketURL: {
                hostname: '0.0.0.0',
                pathname: '/ws',
                port: 3001
            }
        },
        webSocketServer: 'ws'
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
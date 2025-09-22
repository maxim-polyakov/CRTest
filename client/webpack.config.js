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
        port: 3016,
        host: '0.0.0.0',
        // Полностью отключаем WebSocket и Hot Reload
        hot: false,
        liveReload: false,
        open: false,
        historyApiFallback: true,
        allowedHosts: 'all',
        // Явно отключаем WebSocket сервер
        webSocketServer: false,
        client: {
            // Отключаем WebSocket клиент
            webSocketURL: false,
            logging: 'none'
        }
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
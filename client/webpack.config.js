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
        // Убрано дублирование hot: true и hot: false
        hot: false, // Отключаем hot reload
        open: false,
        historyApiFallback: true,
        allowedHosts: 'all', // Это допустимое значение
        liveReload: true,
        webSocketServer: false,
        // Добавляем devMiddleware для совместимости
        devMiddleware: {
            publicPath: '/'
        }
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
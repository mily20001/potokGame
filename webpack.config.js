const path = require("path");
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const buildPath = "build/frontend";

module.exports = {
    entry: ["./frontend/index.js"],
    output: {
        path: path.resolve(__dirname, buildPath),
        filename: "js/[name].js",
        // publicPath: "frontend/public/",
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name (file) {
                                return '[name].[ext]';
                            }
                        }
                    }
                ],
            },
            { // regular css files
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    use: 'css-loader?importLoaders=1',
                }),
            },
            { // sass / scss loader for webpack
                test: /\.(sass|scss)$/,
                loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
            },
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
        new ExtractTextPlugin({ // define where to save the file
            filename: `css/[name].bundle.css`,
            allChunks: true,
        }),
    ],
};
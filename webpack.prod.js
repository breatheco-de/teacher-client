const merge = require('webpack-merge');
const webpack = require('webpack');
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    devtool: "source-map",
    output: {
        filename: '[hash].bundle.js',
        path: path.resolve(__dirname, 'public'),
        publicPath: path.resolve(__dirname, '/')
    },
    plugins: [
        new Dotenv({
            path: './.env.prod'
        })
    ]
})
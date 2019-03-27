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
        new webpack.ProvidePlugin({
          $: 'jquery',
          Popper: 'popper.js',
          jQuery: 'jquery',
          // In case you imported plugins individually, you must also require them here:
          Util: "exports-loader?Util!bootstrap/js/dist/util",
          Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown"
        }),
        new HtmlWebpackPlugin({
            favicon: '4geeks.ico',
            template: 'template.html'
        }),
        new Dotenv({
            path: './.env.prod'
        })
    ]
})
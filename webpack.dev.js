const webpack = require('webpack');
const common = require('./webpack.common.js');
const merge = require('webpack-merge');
var PrettierPlugin = require("prettier-webpack-plugin");
const Dotenv = require('dotenv-webpack');

module.exports = merge(common, {
  devtool: "source-map",
  devServer: {
    contentBase:  './dist',
    hot: true,
    disableHostCheck: true,
    historyApiFallback: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new PrettierPlugin({
      parser: "babylon",
      printWidth: 150,             // Specify the length of line that the printer will wrap on.
      tabWidth: 4,                // Specify the number of spaces per indentation-level.
      useTabs: true,              // Indent lines with tabs instead of spaces.
      bracketSpacing: true,
      extensions: [ ".js", ".jsx" ],
      jsxBracketSameLine: true,
      semi: true,                 // Print semicolons at the ends of statements.
      encoding: 'utf-8'           // Which encoding scheme to use on files
    })
  ]
});

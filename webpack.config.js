const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const EslintWebpackPlugin = require('eslint-webpack-plugin');

const path = require('path');

// const filename = ext => process.env.NODE_ENV === 'development' ? `[name].${ext}` : `[name].[contenthash].${ext}`;
const filename = ext => `[name].${ext}`;

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: { index: './index.ts' },
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'build'),
    publicPath: '',
    iife: false
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  devServer: {
    port: 8080,
    hot: process.env.NODE_ENV === 'development'
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html'
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/data'),
          to: path.resolve(__dirname, 'build/data')
        }
      ]
    }),
    new EslintWebpackPlugin({
      extensions: ['.ts'],
      fix: false,
      exclude: 'node_modules'
    })
  ]
}

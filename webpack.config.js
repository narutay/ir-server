'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const messageClassDisplayName = require('./lib/message-class.json');
const PACKAGE = require('./package.json');
const version = PACKAGE.version;

require('dotenv').config();
const AUTH0_CONFIG = {};
AUTH0_CONFIG.domain = process.env.AUTH0_DOMAIN;
AUTH0_CONFIG.audience = process.env.AUTH0_AUDIENCE;

const mode = process.env.NODE_ENV || 'development';
const enabledSourceMap = (mode === 'development');

module.exports = {
  mode: mode,
  entry: {
    js: './client/src/js/app.js',
  },
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.join(__dirname, 'server/public/js'),
  },
  externals: {
    jquery: 'jQuery',
  },
  module: {
    rules: [
      {
        test: /\.pug$/,
        use: {
          loader: 'pug-loader',
          options: {
            self: true,
          },
        },
      },
      {
        test: /\.scss/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: enabledSourceMap,
              importLoaders: 2, // 2 => postcss-loader, sass-loader
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: enabledSourceMap,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      AUTH0_CONFIG: JSON.stringify(AUTH0_CONFIG),
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new CleanWebpackPlugin([
      'server/public/js/*.js',
      'server/public/index.html',
    ]),
    new HtmlWebpackPlugin({
      title: 'IR Server',
      filename: '../index.html',
      template: 'server/views/pages/index.pug',
      data: {
        messageClassDisplayName: messageClassDisplayName,
        version: version,
      },
    }),
  ],
};

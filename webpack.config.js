'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    js: './client/src/js/app.js',
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'server/public/js'),
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'Popper': 'popper.js/dist/umd/popper',
    }),
  ],
};

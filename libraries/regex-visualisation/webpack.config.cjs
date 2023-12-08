//@ts-check

'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node',
	mode: 'none',

  entry: { 
    main: {
      import: path.resolve(__dirname, 'src/index.ts')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ],
        resolve: { extensions: ['.ts', '.js' ] }
      },
      {
        test: /\.less$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                strictMath: true,
              },
            },
          }
        ]
      },
      {
        test: /\.html$/i,
        exclude: /node_modules/,
        loader: 'html-loader',
        options: {
          esModule: true,
        }
      }
    ]
  },
  watchOptions: {
    ignored: ['**/node_modules', path.resolve(__dirname, './dist')],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/templates/main.html'
    })
  ]
};
module.exports = [ extensionConfig ];
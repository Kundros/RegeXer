//@ts-check

'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'web',
	mode: 'none',

  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      url: require.resolve("url/")
    }
  },

  experiments: {
    asyncWebAssembly: true,
    layers: true,
    syncWebAssembly: true,
    topLevelAwait: true,
  },

  entry: { 
    main: {
      import: path.resolve(__dirname, 'src/index.ts')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
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
          },
        ]
      },
      {
        test: /\.(js|ts)$/,
        use: [
          {
            loader: path.resolve('loaders/url-path-loader.js')
          }
        ],
      },
      {
        test: /\.(html)$/,
        use: ['html-loader']
      }
    ]
  },
  watchOptions: {
    ignored: ['**/node_modules', path.resolve(__dirname, './dist')],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/templates/main.html"
    })
  ]
};
module.exports = [ extensionConfig ];
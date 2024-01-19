//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'webworker',
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
        resourceQuery: /inline/,
        type: 'asset/source',
      },
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
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
        options: {
          removeTags: true,
          removingTags: ["fill"],
          removeSVGTagAttrs: true,
          removingTagAttrs: ["fill"]
        }
      }
    ]
  },
  optimization: {
    splitChunks: false
  },
  watchOptions: {
    ignored: ['**/node_modules', path.resolve(__dirname, './dist')],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/templates/main.html"
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    })
  ]
};
module.exports = [ extensionConfig ];
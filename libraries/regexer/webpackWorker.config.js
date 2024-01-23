//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const webConfig = {
  target: 'webworker',
	mode: 'none',

  resolve: {
    fallback: {
      path: require.resolve("path-browserify")
    }, 
    // @ts-ignore
    plugins: [new TsconfigPathsPlugin()]
  },

  experiments: {
    asyncWebAssembly: true,
    layers: true,
    syncWebAssembly: true,
    topLevelAwait: true
  },

  entry: { 
    MatchingWorker: {
      import: path.resolve("./src/core/MatchingWorkerEntry.ts")
    }
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].web.js'
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                module: "esnext"
              }
            }
          }
        ],
        resolve: { extensions: ['.ts', '.js' ] }
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
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    })
  ]
};

const nodeConfig = {
  target: ['node16', "es22"],
	mode: 'none',

  resolve: {
    // @ts-ignore
    plugins: [new TsconfigPathsPlugin()]
  },

  experiments: {
    asyncWebAssembly: true,
    layers: true,
    syncWebAssembly: true,
    topLevelAwait: true
  },

  entry: { 
    MatchingWorker: {
      import: path.resolve("./src/core/MatchingWorkerEntry.ts")
    }
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].node.js'
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                module: "ESNext"
              }
            }
          }
        ],
        resolve: { extensions: ['.ts', '.js' ] }
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
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    })
  ]
};

module.exports = [ webConfig, nodeConfig ];
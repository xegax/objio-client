const path = require('path');
const webpack = require('webpack');
const htmlWebpackPlugin = require('html-webpack-plugin');

const outputDir = 'client';

module.exports = [
  {
    mode: 'development',
    entry: {
      'client': ['./src/entry/entry.tsx'],
      'login': ['./src/entry/login.ts'],
      'loader': ['./src/entry/loader.ts'],
      'test': ['./src/entry/test.ts']
    },
    output: {
      path: path.resolve(`./${outputDir}`),
      filename: '[name].js',
      library: '[name]'
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".scss"],
      modules: [
        'styles',
        path.resolve('./src'),
        'node_modules'
      ]
    },
    externals: {
      'react': 'react',
      'react-dom': 'reactdom',
      '@blueprintjs/core': 'blueprintjs',
      'ts-react-ui/typings': 'react',
      'bluebird': 'bluebird'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        }, {
          test: /\.scss$/,
          use: [ 'style-loader', 'css-loader', 'sass-loader' ]
        }, {
          test: /(fontawesome-webfont\.svg)|\.(png|jpg|gif|eot|ttf|woff|woff2)$/,
          loader: 'url-loader',
          options: {
            name: '[name].[ext]',
            outputPath: `../${outputDir}`,
            limit: 10000
          }
        }, {
          test: /\.svg$/,
          loader: 'svg-inline-loader'
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        Promise: 'bluebird'
      }),
      new htmlWebpackPlugin({
        template: 'html/index.html',
        filename: 'index.html',
        inject: false,
        hashStr: Date.now().toString(16),
        bodyJS: [ 'react.js', 'reactdom.js', 'bluebird.js', 'blueprintjs.js', 'client.js' ]
      }),
      new htmlWebpackPlugin({
        template: 'html/login.html',
        filename: 'login.html',
        inject: false,
        hashStr: Date.now().toString(16),
        bodyJS: [ 'react.js', 'reactdom.js', 'bluebird.js', 'blueprintjs.js', 'login.js' ]
      }),
      new htmlWebpackPlugin({
        template: 'html/test.html',
        filename: 'test.html',
        inject: false,
        hashStr: Date.now().toString(16),
        bodyJS: [ 'react.js', 'reactdom.js', 'bluebird.js', 'blueprintjs.js', 'test.js' ]
      })
    ],
    devtool: 'source-map'
  }
]

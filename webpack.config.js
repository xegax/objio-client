const path = require('path');
const webpack = require('webpack');

module.exports = [
  {
    mode: 'development',
    entry: {
      'entry': ['./src/entry/entry.tsx']
    },
    output: {
      path: path.resolve('./build'),
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
      '@blueprintjs/core': 'blueprintjs'
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
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }
      ]
    },
    plugins: [
    ],
    devtool: 'source-map'
  }
]

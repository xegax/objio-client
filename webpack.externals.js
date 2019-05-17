const path = require('path');
const webpack = require('webpack');

const outputDir = './client';

var externals = {
  'react': [
    './node_modules/react/cjs/react.development.js'
  ],
  'reactdom': [
    './node_modules/react-dom/cjs/react-dom.production.min.js'
  ],
  'blueprintjs': [
    './node_modules/normalize.css/normalize.css',
    './node_modules/@blueprintjs/core/lib/css/blueprint.css',
    './node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css',
    './node_modules/@blueprintjs/core/dist/core.bundle.js'
  ],
  'bluebird': [
    './node_modules/bluebird/js/browser/bluebird.min.js'
  ]
};

module.exports = [
  {
    mode: 'development',
    entry: externals,
    output: {
      path: path.resolve(outputDir),
      publicPath: '/',
      filename: '[name].js',
      library: '[name]'
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      modules: [
        path.resolve('./src'),
        'node_modules'
      ]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        }, {
          test: /\.css$/,
          use: [ 'style-loader', 'css-loader' ]
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

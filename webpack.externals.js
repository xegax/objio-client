const path = require('path');
const webpack = require('webpack');

var externals = {
  'react': [
    './node_modules/react/umd/react.development.js'
  ],
  'reactdom': [
    './node_modules/react-dom/umd/react-dom.development.js'
  ],
  'blueprintjs': [
    './node_modules/normalize.css/normalize.css',
    './node_modules/@blueprintjs/core/lib/css/blueprint.css',
    './node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css',
    './node_modules/@blueprintjs/core/dist/core.bundle.js'
  ]
};

module.exports = [
  {
    mode: 'development',
    entry: externals,
    output: {
      path: path.resolve('./build'),
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

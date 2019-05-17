const path = require('path');
const webpack = require('webpack');
const externals = [
  'objio',
  'objio-object',
  'objio-sqlite-table',
  'objio-mysql-database',
  'ts-react-ui',
  'bluebird',
  'process'
];

module.exports = [
  {
    mode: 'development',
    entry: {
      'server': ['./src/server/doc-server.ts']
    },
    output: {
      path: path.resolve('./server'),
      filename: '[name].js',
      library: '[name]'
    },
    resolve: {
      extensions: [".ts", ".js"],
      modules: [
        path.resolve('./src'),
        'node_modules'
      ]
    },
    externals: [
      function(ctx, request, callback) {
        const module = request.split('/')[0];
        if (externals.indexOf(module) != -1)
          return callback(null, 'commonjs ' + request);
        callback();
      }
    ],
    module: {
      rules: [
        {
          test: /\.ts?$/,
          loader: 'ts-loader'
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        Promise: 'bluebird'
      }),
    ],
    devtool: 'source-map'
  }
]

var path = require('path');
const webpack = require('webpack');

var entry = {
  'entry': './src/entry/entry.tsx'
};

module.exports = [
  {
    mode: 'production',
    entry: entry,
    output: {
      path: path.resolve('./build'),
      filename: '[name].js'
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      modules: [
        path.resolve('./src'),
        'node_modules'
      ]
    },
    externals: {
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        }
      ]
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin({
        exclude: ['entry'],
        columns: false,
        filename: '[file].map'
      }),
      // Source map for entry points which use loader.ts
      new webpack.SourceMapDevToolPlugin({
        include: ['entry'],
        columns: false,
        filename: '[file].map',
        append: '\n//# sourceMappingURL=../libs/scripts/[url]'
      })
    ],
    devtool: 'source-map'
  }
]

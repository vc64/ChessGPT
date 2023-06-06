const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // mode: 'development',
  // devtool: 'inline-source-map',
  // devServer: {
  //   static: './docs',
  // },
  // optimization: {
  //   runtimeChunk: 'single',
  // },
  entry: ['./src/game.js'],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'docs'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: "assets/[name][ext]",
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
        filename: "prod-index.html",
        template: "index.html",
        favicon: "./src/img/horse.ico"
    })
  ]
};
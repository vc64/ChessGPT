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
  entry: ['./src/game.js', './src/intro.js'],
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
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
        filename: "index.html",
        template: "index.html",
        favicon: "./src/img/horse.ico"
    })
  ]
};
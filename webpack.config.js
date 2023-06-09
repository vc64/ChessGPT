const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// build docs with 'npm run build'
module.exports = {
  // uncomment below for development server, which can be ran with 'npm run start'
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
        filename: "index.html", //output in docs
        template: "index.html", //the root one, used as template
        favicon: "./src/img/horse.ico"
    })
  ]
};
import { Configuration, DefinePlugin } from 'webpack'
import * as HtmlWebpackPlugin from 'html-webpack-plugin'
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin'
import * as OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import * as webpackNodeExternals from 'webpack-node-externals'
import config from './config'
import getPath from './get-path'

const TerserWebpackPlugin = require('terser-webpack-plugin')

const terser = () => new TerserWebpackPlugin({
  parallel: true,
  cache: true,
  terserOptions: {
    ecma: 8,
    output: {
      beautify: false
    }
  }
})

export const mainConfig: Configuration = {
  mode: 'production',
  context: getPath(),
  target: 'electron-main',
  entry: {
    main: [getPath('./src/main/main.ts')]
  },
  output: {
    filename: '[name].js',
    path: config.outputPath || getPath('out')
  },
  node: false,
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
      {
        test: /\.(jpg|png|ico|icns)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./${config.iconOutDir}/[name].[ext]`
          }
        }]
      }
    ]
  },
  externals: [webpackNodeExternals()],
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new DefinePlugin({
      'process.isLinux': JSON.stringify(process.platform === 'linux')
    })
  ],
  optimization: {
    minimizer: [terser()]
  }
}

export const rendererConfig: Configuration = {
  mode: 'production',
  context: getPath(),
  target: 'electron-renderer',
  entry: {
    renderer: [getPath('./src/renderer/index.tsx')]
  },
  output: {
    filename: '[name].js',
    path: config.outputPath || getPath('out')
  },
  node: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: false
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.svg$/,
        use: [{
          loader: 'url-loader',
          options: {
            name: `./${config.iconOutDir}/[name].[ext]`
          }
        }]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.css']
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: require(getPath('package.json')).name,
      template: getPath('./src/renderer/index.html'),
      chunks: ['renderer', 'dll', 'common']
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'common',
      cacheGroups: {
        dll: {
          test: /[\\/]node_modules[\\/]/,
          name: 'dll'
        }
      }
    },
    minimizer: [
      terser(),
      new OptimizeCSSAssetsPlugin({})
    ]
  }
}

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const pages = [
  'index',
  'minify',
  'generator',
  'expression',
  'clean',
  'diff',
  'keyword',
  'policy'
];

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: {
      common: './src/scripts/common.js',
      navbar: './src/components/navbar.js',
      ...pages.reduce((acc, page) => ({
        ...acc,
        [page]: `./src/scripts/${page}.js`
      }), {})
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'scripts/[name].[contenthash].js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
      clean: true,
      publicPath: isDevelopment ? '/' : './'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      ...pages.map(page => new HtmlWebpackPlugin({
        template: `./src/${page}.html`,
        filename: `${page}.html`,
        chunks: ['common', 'navbar', page],
        scriptLoading: 'defer',
        minify: isDevelopment ? false : {
          collapseWhitespace: false,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: false,
          minifyJS: false,
          processConditionalComments: false,
          keepClosingSlash: true,
          preserveLineBreaks: true,
          conservativeCollapse: true
        }
      })),
      new MiniCssExtractPlugin({
        filename: 'styles/[name].[contenthash].css'
      }),
      new CopyPlugin({
        patterns: [
          { 
            from: 'src/images',
            to: 'images'
          },
          {
            from: 'src/robots.txt',
            to: 'robots.txt'
          },
          {
            from: 'src/sitemap.xml',
            to: 'sitemap.xml'
          },
          {
            from: 'src/_headers',
            to: '_headers'
          },
          {
            from: 'src/_redirects',
            to: '_redirects'
          }
        ]
      })
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: !isDevelopment,
              drop_debugger: !isDevelopment
            }
          },
          extractComments: false
        }),
        new CssMinimizerPlugin()
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      hot: true,
      open: true,
      compress: true,
      port: 3000,
      historyApiFallback: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    performance: {
      hints: isDevelopment ? false : 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  };
}; 
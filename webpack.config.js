const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables
const env = dotenv.config().parsed || {};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'app/static/dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      publicPath: isProduction ? '/static/dist/' : '/',
      clean: true,
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'app/static'),
          publicPath: '/static',
        }
      ],
      port: 3000,
      hot: true,
      compress: true,
      open: false,
      historyApiFallback: {
        index: '/spa.html'
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5002',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'http://localhost:5002',
          ws: true,
          changeOrigin: true,
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb inline threshold
            },
          },
          generator: {
            filename: 'images/[hash:8][ext][query]'
          }
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@utils': path.resolve(__dirname, 'src/utils')
      }
    },
    plugins: [
      // Define environment variables
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(process.env),
        'import.meta.env': JSON.stringify({
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
          VITE_API_URL: process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:5002/api',
          VITE_APP_NAME: process.env.VITE_APP_NAME || env.VITE_APP_NAME || 'Venezia Ice Cream'
        })
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'spa.html',
        inject: true,
        // In development, we need to handle the service worker differently
        templateParameters: {
          isProduction: isProduction,
          isDevelopment: isDevelopment
        },
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false
      }),
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
        }),
        new GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [{
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          }, {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          }, {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
            },
          }]
        })
      ] : [])
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          // Framework core (React, React-DOM)
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
            name: 'framework',
            priority: 40,
            enforce: true,
          },
          // Chart.js y librerías de gráficos
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            priority: 30,
            enforce: true,
          },
          // UI Libraries (Framer Motion, Headless UI, etc.)
          ui: {
            test: /[\\/]node_modules[\\/](framer-motion|@headlessui|@heroicons|lucide-react)[\\/]/,
            name: 'ui-libs',
            priority: 25,
          },
          // Utilities (date-fns, clsx, axios, etc.)
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|clsx|axios|socket\.io-client)[\\/]/,
            name: 'utils',
            priority: 20,
          },
          // Resto de vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          // Common chunks entre páginas
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      // Mejor hashing para cache busting
      moduleIds: 'deterministic',
      runtimeChunk: {
        name: 'runtime',
      },
    },
    performance: {
      maxAssetSize: 500000,
      maxEntrypointSize: 500000,
    }
  };
}; 
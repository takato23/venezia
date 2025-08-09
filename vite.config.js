import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      visualizer({
        open: false,
        filename: 'dist/bundle-stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@store': path.resolve(__dirname, './src/store'),
        '@utils': path.resolve(__dirname, './src/utils')
      },
      // Handle .mjs files correctly
      extensions: ['.mjs', '.js', '.jsx', '.json']
    },
    
    // ESBuild configuration for better CommonJS/ESM compatibility
    esbuild: {
      target: 'es2020',
      format: 'esm'
    },
    
    build: {
      // Output directory to match Webpack config
      outDir: 'app/static/dist',
      
      // Empty outDir before build
      emptyOutDir: true,
      
      // Optimize chunk size
      rollupOptions: {
        output: {
          // Match Webpack's chunk naming
          entryFileNames: mode === 'production' ? '[name].[hash].js' : '[name].js',
          chunkFileNames: mode === 'production' ? '[name].[hash].js' : '[name].js',
          assetFileNames: mode === 'production' ? '[name].[hash].[ext]' : '[name].[ext]',
          
          manualChunks: {
            // Framework core (React, React-DOM)
            'framework': ['react', 'react-dom', 'react-router-dom'],
            // Chart.js and visualization libraries
            'charts': ['chart.js', 'react-chartjs-2'],
            // UI Libraries
            'ui-libs': ['framer-motion', '@headlessui/react', '@heroicons/react', 'lucide-react'],
            // Utilities
            'utils': ['date-fns', 'clsx', 'axios', 'socket.io-client'],
            // Common vendor libraries
            'vendors': ['zustand', 'react-hot-toast', 'jspdf', 'jspdf-autotable']
          }
        }
      },
      
      // Minimize bundle
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      
      // Enable CSS code splitting
      cssCodeSplit: true,
      
      // Asset optimization
      assetsInlineLimit: 8192, // 8kb inline threshold
      
      // Source maps only in development
      sourcemap: mode === 'development',
      
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
      
      // Report compressed size
      reportCompressedSize: true
    },
    
    server: {
      port: 5173, // Use Vite's default port to avoid conflicts
      host: true,
      open: false,
      cors: true,
      
      proxy: {
        '/api': {
          target: 'http://localhost:5002',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/public/, '/api'),
        },
        '/socket.io': {
          target: 'http://localhost:5002',
          ws: true,
          changeOrigin: true,
        }
      }
    },
    
    define: {
      // Define global constants
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.REACT_APP_GEMINI_API_KEY': JSON.stringify(env.REACT_APP_GEMINI_API_KEY),
      
      // Vite env variables
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:5002/api'),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'Venezia Ice Cream'),
      'import.meta.env.REACT_APP_GEMINI_API_KEY': JSON.stringify(env.REACT_APP_GEMINI_API_KEY)
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom',
        'axios',
        'date-fns',
        'framer-motion',
        'chart.js',
        'react-chartjs-2',
        '@supabase/supabase-js',
        '@supabase/postgrest-js',
        '@supabase/realtime-js',
        '@supabase/storage-js',
        '@supabase/functions-js',
        '@supabase/auth-js'
      ],
      exclude: [],
      esbuildOptions: {
        target: 'es2020',
        format: 'esm'
      }
    },
    
    // Fix for Supabase CommonJS/ESM issues
    ssr: {
      noExternal: ['@supabase/supabase-js', '@supabase/postgrest-js']
    },
    
    // Environment variables prefix
    envPrefix: ['VITE_', 'REACT_APP_']
  };
});
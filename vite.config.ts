import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  
  // CSS optimization
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        // Enable CSS modules
        modules: {
          localsConvention: 'camelCase',
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Enable source maps for production debugging
    sourcemap: true,
    
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        // Manual chunking strategy for optimal code splitting
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            
            // Chart libraries
            if (id.includes('recharts') || id.includes('chart')) {
              return 'chart-vendor';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            
            // Other vendors
            return 'vendor';
          }
          
          // Role-specific dashboard chunks
          if (id.includes('/pages/AdminDashboard') || id.includes('/components/admin/')) {
            return 'admin-dashboard';
          }
          
          if (id.includes('/pages/FreelancerDashboard') || id.includes('/components/freelancer/')) {
            return 'freelancer-dashboard';
          }
          
          if (id.includes('/pages/ClientDashboard') || id.includes('/components/client/')) {
            return 'client-dashboard';
          }
          
          // Timer components
          if (id.includes('/components/timer/') || id.includes('Timer')) {
            return 'timer-components';
          }
          
          // Analytics and charts
          if (id.includes('/components/analytics/') || id.includes('/components/charts/')) {
            return 'analytics-components';
          }
          
          // File management
          if (id.includes('/components/files/') || id.includes('FileManager')) {
            return 'file-components';
          }
          
          // Performance monitoring
          if (id.includes('/components/performance/') || id.includes('/utils/performance/')) {
            return 'performance-components';
          }
          
          // UI components
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
        },
        
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|otf|eot/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
        
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
})

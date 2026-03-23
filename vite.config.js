import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Task Planner — AI Coach',
        short_name: 'Task Planner',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0f',
        theme_color: '#6366f1',
        description: 'AI Personal Coach for daily tasks, habits & productivity.',
        categories: ['productivity', 'lifestyle'],
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        navigateFallback: '/index.html',
        // ✅ FIX: Cache strategies for better offline support
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },

  // ✅ FIX: Build optimization — smaller APK, faster load
  build: {
    // Split large chunks — faster app load
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom'],
          // Charts library — heavy, load separately
          'vendor-charts': ['recharts'],
          // Capacitor core
          'vendor-capacitor': [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/haptics',
            '@capacitor/keyboard',
            '@capacitor/status-bar',
          ],
        }
      }
    },
    // ✅ Minify for smaller APK size
    minify: 'esbuild',
    // Warn if chunk > 1MB
    chunkSizeWarningLimit: 1000,
    // ✅ Remove console.log in production
    esbuildOptions: {
      drop: ['console', 'debugger'],
    }
  }
});

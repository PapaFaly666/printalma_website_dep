import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// Configuration optimisée pour résoudre les problèmes de build
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://printalma-back-dep.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // Optimisations pour éviter les problèmes de build
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['fabric'] // fabric.js peut poser des problèmes
  },

  build: {
    // Diviser en chunks plus petits
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les gros modules
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          fabric: ['fabric'],
          utils: ['lodash', 'axios'],
          icons: ['lucide-react', 'react-icons']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Configuration pour éviter les timeouts
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild', // Plus rapide que terser
    chunkSizeWarningLimit: 1000
  }
})
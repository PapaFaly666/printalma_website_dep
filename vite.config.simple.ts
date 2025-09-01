import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// Configuration simplifiée pour debug du build
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  
  // Configuration simplifiée
  server: {
    port: 5174
  },

  // Build avec optimisations minimales
  build: {
    minify: false,
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    }
  }
})
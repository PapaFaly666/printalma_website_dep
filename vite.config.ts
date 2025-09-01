import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  
  // Configuration du serveur de développement avec proxy
  server: {
    // Spécifiez le port 5174 pour correspondre à celui autorisé par l'API
    port: 5174,
    
    // Configuration du proxy pour les requêtes API
    proxy: {
      '/api': {
        target: 'https://printalma-back-dep.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // Optimisations pour TypeScript
  optimizeDeps: {
    include: ['react', 'react-dom']
  },

  // Configuration pour éviter les erreurs 404
  build: {
    rollupOptions: {
      external: []
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement selon le mode
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [react(), tailwindcss()],

  // Définir explicitement les variables d'environnement
  define: {
    'import.meta.env.VITE_STABILITY_API_KEY': JSON.stringify(env.VITE_STABILITY_API_KEY),
    'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
    'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT),
  },
  
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
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
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
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// Configuration de test pour identifier le problème de build
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  
  // Point d'entrée minimal pour test
  build: {
    rollupOptions: {
      input: './src/main-minimal.tsx'
    }
  }
})
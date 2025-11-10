import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/best-sellers.css'

// 🧪 Importer les outils de test pour le développement
if (import.meta.env.DEV) {
  import('./utils/testAuthAPI.ts')
    .then(() => {
      console.log('🧪 Outils de test API chargés - utilisez runAuthTest() dans la console');
    })
    .catch(err => {
      console.warn('⚠️ Erreur chargement outils de test:', err);
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Point d'entrée minimal pour tester le build
function MinimalApp() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">PrintAlma - Build Test</h1>
      <p className="mt-4">Application construite avec succès !</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MinimalApp />
  </React.StrictMode>,
)
import React, { useState } from 'react';
import { ProductService, DiagnosticResult } from '../services/productService';

interface ProductDiagnosticProps {
  productId: number;
}

export function ProductDiagnostic({ productId }: ProductDiagnosticProps) {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setShowDiagnostic(true);
    try {
      const result = await ProductService.diagnoseProduct(productId);
      setDiagnostic(result);
    } catch (error) {
      console.error('Erreur diagnostic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendations = (diagnostic: DiagnosticResult): string[] => {
    const recommendations = [];

    const baseOk = diagnostic['Base Product']?.ok;
    const vendorOk = diagnostic['Vendor Product']?.ok;
    const adminOk = diagnostic['Admin Vendor']?.ok;

    if (!baseOk && !vendorOk && !adminOk) {
      recommendations.push('Produit probablement inexistant en base de données');
      recommendations.push('Vérifier l\'ID du produit');
    }

    if (!vendorOk && diagnostic['Vendor Product']?.status === 401) {
      recommendations.push('Problème d\'authentification - vérifier le token JWT');
    }

    if (!vendorOk && diagnostic['Vendor Product']?.status === 403) {
      recommendations.push('Droits insuffisants - utiliser un compte vendeur/admin');
    }

    if (baseOk && !vendorOk) {
      recommendations.push('Utiliser l\'endpoint /products/:id pour ce produit de base');
    }

    if (!baseOk && vendorOk) {
      recommendations.push('Utiliser l\'endpoint /vendor/products/:id pour ce produit vendeur');
    }

    if (adminOk && !vendorOk) {
      recommendations.push('Produit accessible uniquement par admin');
    }

    // Vérifier l'authentification localStorage
    const storedAuth = localStorage.getItem('auth_session');
    if (!storedAuth) {
      recommendations.push('Aucune session d\'authentification trouvée');
    } else {
      try {
        const authData = JSON.parse(storedAuth);
        if (!authData.isAuthenticated) {
          recommendations.push('Session marquée comme non authentifiée');
        }
      } catch (e) {
        recommendations.push('Session d\'authentification corrompue');
      }
    }

    return recommendations;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🔍 Diagnostic Produit {productId}
        </h3>
        <button
          onClick={runDiagnostic}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Test en cours...' : 'Tester tous les endpoints'}
        </button>
      </div>

      {/* Info d'authentification */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-medium text-blue-800 mb-2">🔐 État de l'authentification :</h4>
        {(() => {
          const storedAuth = localStorage.getItem('auth_session');
          if (!storedAuth) {
            return (
              <div className="text-sm text-red-700">
                <div>Session: ❌ Aucune session trouvée</div>
              </div>
            );
          }

          try {
            const authData = JSON.parse(storedAuth);
            const isAuthenticated = authData.isAuthenticated;
            const user = authData.user;
            const timestamp = authData.timestamp;
            const ageInSeconds = Math.floor((Date.now() - timestamp) / 1000);

            return (
              <div className="text-sm text-blue-700">
                <div>Session: {isAuthenticated ? '✅ Connecté' : '❌ Non connecté'}</div>
                {isAuthenticated && user && (
                  <>
                    <div>Utilisateur: {user.firstName} {user.lastName} ({user.email})</div>
                    <div>Rôle: {user.role || 'Non défini'}</div>
                    <div>Âge session: {ageInSeconds}s</div>
                    {ageInSeconds > 604800 && (
                      <div className="text-red-600 font-medium">⚠️ Session expirée (&gt;7 jours)</div>
                    )}
                  </>
                )}
              </div>
            );
          } catch (e) {
            return (
              <div className="text-sm text-red-700">
                <div>Session: ❌ Données corrompues</div>
              </div>
            );
          }
        })()}
      </div>

      {diagnostic && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 mb-3">📡 Résultats des tests d'endpoints :</h4>
          {Object.entries(diagnostic).map(([name, info]: [string, any]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <strong className="text-gray-800">{name}</strong>
                <div className="text-sm text-gray-600">{info.url}</div>
                {info.error && (
                  <div className="text-xs text-red-600 mt-1">Erreur: {info.error}</div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  info.ok 
                    ? 'bg-green-100 text-green-800' 
                    : info.status === 'NETWORK_ERROR'
                    ? 'bg-red-100 text-red-800'
                    : info.status === 401
                    ? 'bg-yellow-100 text-yellow-800'
                    : info.status === 403
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {info.status} {info.ok ? '✅' : info.status === 'NETWORK_ERROR' ? '🔌' : '❌'}
                </span>
                {info.ok && (
                  <span className="text-xs text-green-600">
                    {info.data?.data ? 'Avec données' : 'Réponse vide'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {diagnostic && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-blue-800 mb-2">💡 Recommandations :</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {getRecommendations(diagnostic).map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions rapides */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <h4 className="font-medium text-green-800 mb-2">🚀 Test rapide en console :</h4>
        <div className="text-sm text-green-700 font-mono bg-green-100 p-2 rounded">
          {`// Copier-coller dans la console du navigateur
async function testProduct(id) {
  const endpoints = [
    \`/products/\${id}\`,
    \`/vendor/products/\${id}\`,
    \`/vendor/admin/products/\${id}\`
  ];
  
  for (const url of endpoints) {
    try {
      const response = await fetch('https://printalma-back-dep.onrender.com' + url, { credentials: 'include' });
      console.log(\`\${url}: \${response.status}\`, response.ok ? '✅' : '❌');
      if (response.ok) {
        const data = await response.json();
        console.log('Data:', data);
      }
    } catch (error) {
      console.log(\`\${url}: ERROR\`, error.message);
    }
  }
}

testProduct(${productId});`}
        </div>
      </div>
    </div>
  );
} 
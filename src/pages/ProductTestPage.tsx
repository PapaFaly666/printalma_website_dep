import React, { useState } from 'react';
import { useProductSmart } from '../hooks/useProductSmart';
import { ProductDiagnostic } from '../components/ProductDiagnostic';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function ProductTestPage() {
  const [productId, setProductId] = useState(169);
  const { data: productResult, isLoading, error, refetch } = useProductSmart(productId);

  const testDifferentProduct = (id: number) => {
    setProductId(id);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🧪 Test du Service Intelligent de Produits
        </h1>
        <p className="text-gray-600 mb-6">
          Cette page teste le nouveau système de récupération intelligent des produits avec fallback automatique.
        </p>
        
        {/* Contrôles de test */}
        <div className="flex gap-4 mb-6">
          <Button onClick={() => testDifferentProduct(169)} variant={productId === 169 ? "default" : "outline"}>
            Produit 169 (Problématique)
          </Button>
          <Button onClick={() => testDifferentProduct(1)} variant={productId === 1 ? "default" : "outline"}>
            Produit 1 (Test)
          </Button>
          <Button onClick={() => testDifferentProduct(999)} variant={productId === 999 ? "default" : "outline"}>
            Produit 999 (Inexistant)
          </Button>
          <Button onClick={refetch} variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Résultat du service intelligent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📦 Produit {productId}</span>
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-600">Test du service intelligent...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Échec du service intelligent
                </h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <Badge variant="destructive">❌ Non trouvé</Badge>
              </div>
            ) : productResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-green-800 font-semibold">Succès!</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Source</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {productResult.source}
                      </Badge>
                      <Badge variant="outline" className="text-blue-700 border-blue-300">
                        {productResult.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nom du produit</label>
                    <p className="font-semibold text-gray-900 mt-1">
                      {productResult.data?.name || productResult.data?.vendorName || 'Non défini'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID du produit</label>
                    <p className="text-gray-900 mt-1">{productResult.data?.id}</p>
                  </div>
                  
                  {productResult.data?.status && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Statut</label>
                      <div className="mt-1">
                        <Badge variant={
                          productResult.data.status === 'PUBLISHED' ? 'default' : 'secondary'
                        }>
                          {productResult.data.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {productResult.data?.price && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Prix</label>
                      <p className="text-gray-900 mt-1">
                        {typeof productResult.data.price === 'number' 
                          ? `${(productResult.data.price / 100).toLocaleString()} CFA`
                          : productResult.data.price
                        }
                      </p>
                    </div>
                  )}
                  
                  {productResult.data?.vendor && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vendeur</label>
                      <p className="text-gray-900 mt-1">
                        {productResult.data.vendor.firstName} {productResult.data.vendor.lastName}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Données brutes (debug) */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600">
                    Voir les données brutes (Debug)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(productResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Composant de diagnostic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Diagnostic des endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProductDiagnostic productId={productId} />
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>💡 Comment utiliser cette solution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Pour les développeurs :</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Utiliser <code className="bg-gray-100 px-1 rounded">useProductSmart(id)</code> au lieu de l'ancien hook</li>
                <li>• Le service teste automatiquement tous les endpoints</li>
                <li>• Fallback intelligent en cas d'échec</li>
                <li>• Logs détaillés dans la console</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Pour le diagnostic :</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Le composant <code className="bg-gray-100 px-1 rounded">ProductDiagnostic</code> teste tous les endpoints</li>
                <li>• Vérification de l'authentification JWT</li>
                <li>• Recommandations automatiques</li>
                <li>• Code de test pour la console navigateur</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
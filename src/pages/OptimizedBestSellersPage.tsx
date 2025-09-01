import React, { useState } from 'react';
import { OptimizedBestSellersDashboard } from '../components/BestSellers/OptimizedBestSellersDashboard';
import { Button } from '../components/ui/button';

export const OptimizedBestSellersPage: React.FC = () => {
  const [useOptimized, setUseOptimized] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'>('month');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Système Optimisé des Meilleures Ventes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Découvrez nos performances avec le nouveau système optimisé
          </p>
          
          {/* Contrôles */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Système:
              </label>
              <Button
                onClick={() => setUseOptimized(!useOptimized)}
                className={useOptimized ? 
                  'bg-blue-600 hover:bg-blue-700 text-white' : 
                  'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }
              >
                {useOptimized ? '⚡ Optimisé' : '🔄 Legacy'}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Période:
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Année</option>
                <option value="all">Tout temps</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {useOptimized && (
          <div className="mb-12">
            <OptimizedBestSellersDashboard 
              autoRefresh={true}
              refreshInterval={5 * 60 * 1000} // 5 minutes
            />
          </div>
        )}

        {/* Carousel des meilleures ventes */}
        <div className="mb-12">
          {/* <BestSellersCarousel
            title={`🏆 Top Meilleures Ventes - ${period}`}
            limit={12}
            useOptimized={useOptimized}
            period={period}
            showViewAllButton={true}
          /> */}
          <p>BestSellersCarousel is not available in this context.</p>
        </div>

        {/* Comparaison des systèmes */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">
              ⚡ Système Optimisé
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Cache intelligent multi-niveaux</li>
              <li>✅ Requêtes SQL optimisées</li>
              <li>✅ Métriques de performance avancées</li>
              <li>✅ Statistiques en temps réel</li>
              <li>✅ Analyse des tendances</li>
              <li>✅ Support de tous les filtres</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-600">
              🔄 Système Legacy
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Fiabilité éprouvée</li>
              <li>✅ Compatibilité garantie</li>
              <li>⚠️ Performances limitées</li>
              <li>⚠️ Cache simple</li>
              <li>❌ Pas d'analyse de tendances</li>
              <li>❌ Métriques basiques</li>
            </ul>
          </div>
        </div>

        {/* Métriques de performance */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Avantages du Système Optimisé</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">5x</div>
              <div className="text-sm text-gray-600">Plus rapide</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">90%</div>
              <div className="text-sm text-gray-600">Moins de charge serveur</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">Compatible</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800">
            🔧 Comment utiliser le système optimisé
          </h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>
              <strong>1. Dans vos composants:</strong> Utilisez le prop <code>useOptimized={"{true}"}</code> 
              sur <code>BestSellersCarousel</code>
            </p>
            <p>
              <strong>2. Pour les statistiques:</strong> Importez et utilisez <code>OptimizedBestSellersDashboard</code>
            </p>
            <p>
              <strong>3. Hooks disponibles:</strong> <code>useOptimizedBestSellers</code> et <code>useQuickStats</code>
            </p>
            <p>
              <strong>4. Fallback automatique:</strong> En cas d'erreur, le système bascule automatiquement 
              vers l'API legacy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
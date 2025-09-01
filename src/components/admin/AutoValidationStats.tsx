import React, { useState, useEffect } from 'react';
import { autoValidationService, AutoValidationStats as AutoValidationStatsType } from '../../services/autoValidationService';

interface AutoValidationStatsProps {
  className?: string;
  refreshTrigger?: number; // Pour déclencher un refresh depuis le parent
}

const AutoValidationStats: React.FC<AutoValidationStatsProps> = ({
  className = '',
  refreshTrigger = 0
}) => {
  const [stats, setStats] = useState<AutoValidationStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await autoValidationService.getAutoValidationStats();
      setStats(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des statistiques';
      setError(errorMessage);
      console.error('Erreur stats auto-validation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <span className="text-base">❌</span>
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const totalProducts = stats.data.autoValidated + stats.data.manualValidated + stats.data.pending;
  const autoValidationRate = totalProducts > 0 
    ? ((stats.data.autoValidated / totalProducts) * 100).toFixed(1)
    : '0';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <h3 className="text-lg font-semibold text-gray-900">
            Statistiques Auto-validation
          </h3>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Actualiser les statistiques"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Auto-validés */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <span className="text-sm font-medium text-green-800">Auto-validés</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.data.autoValidated}</div>
          <div className="text-xs text-green-600 mt-1">
            {autoValidationRate}% du total
          </div>
        </div>

        {/* Validés manuellement */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium text-blue-800">Manuels</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.data.manualValidated}</div>
          <div className="text-xs text-blue-600 mt-1">
            Validés par admin
          </div>
        </div>

        {/* En attente */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⏳</span>
            <span className="text-sm font-medium text-orange-800">En attente</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.data.pending}</div>
          <div className="text-xs text-orange-600 mt-1">
            Non validés
          </div>
        </div>

        {/* Total validés */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📈</span>
            <span className="text-sm font-medium text-gray-800">Total validés</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.data.totalValidated}</div>
          <div className="text-xs text-gray-600 mt-1">
            Sur {totalProducts} produits
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progression globale</span>
          <span className="text-gray-800 font-medium">
            {totalProducts > 0 ? ((stats.data.totalValidated / totalProducts) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${totalProducts > 0 ? (stats.data.totalValidated / totalProducts) * 100 : 0}%` 
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{totalProducts} produits</span>
        </div>
      </div>

      {/* Efficacité de l'auto-validation */}
      {stats.data.totalValidated > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base">💡</span>
            <span>
              <strong>{autoValidationRate}%</strong> des validations sont automatiques, 
              économisant du temps admin !
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoValidationStats;
import React, { useState } from 'react';
import AdminProductCard from '../../components/admin/AdminProductCard';
import AdminValidationTable from '../../components/admin/AdminValidationTable';
import { useAdminValidation } from '../../hooks/useAdminValidation';
import { ProductFilters } from '../../types/admin-validation';

const AdminWizardValidation: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filters, setFilters] = useState<ProductFilters>({ productType: 'ALL' });

  const { products, loading, error, stats, useMockData, validateProduct } = useAdminValidation({ filters });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des produits...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600">
              ❌ Erreur: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header avec statistiques */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Validation des Produits
        </h1>

        {/* 🚧 Bannière dynamique selon le mode */}
        {useMockData ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-blue-600 text-lg">🚧</div>
              <div>
                <div className="font-medium text-blue-900">Mode Démonstration</div>
                <div className="text-sm text-blue-700">
                  Endpoints backend non disponibles. Interface fonctionnelle avec données mockées.
                  Les validations sont simulées localement.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-green-600 text-lg">✅</div>
              <div>
                <div className="font-medium text-green-900">Connecté au Backend</div>
                <div className="text-sm text-green-700">
                  Interface connectée aux endpoints backend. Les données et validations sont réelles.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Statistiques avec types de produits */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
              <div className="text-sm text-gray-600">Validés</div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejetés</div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        )}

        {/* ✅ Répartition par type de produit */}
        <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Répartition par type</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded"></span>
              <span className="text-sm">
                {stats?.wizardProducts || products.filter(p => p.isWizardProduct).length} Produits WIZARD
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded"></span>
              <span className="text-sm">
                {stats?.traditionalProducts || products.filter(p => !p.isWizardProduct).length} Produits Traditionnels
              </span>
            </div>
          </div>
        </div>

        {/* Contrôles de vue */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📱 Vue Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📋 Vue Table
            </button>
          </div>

          {/* Filtres rapides */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ productType: 'ALL' })}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filters.productType === 'ALL'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilters({ productType: 'WIZARD' })}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filters.productType === 'WIZARD'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🎨 WIZARD
            </button>
            <button
              onClick={() => setFilters({ productType: 'TRADITIONAL' })}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filters.productType === 'TRADITIONAL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              🎯 Traditionnels
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Affichage selon le mode choisi */}
      {viewMode === 'cards' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              onValidate={validateProduct}
            />
          ))}
        </div>
      ) : (
        <AdminValidationTable
          products={products}
          onValidate={validateProduct}
          onFilterChange={setFilters}
        />
      )}

      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            Aucun produit en attente de validation
          </div>
          <div className="text-gray-400 text-sm">
            {filters.productType !== 'ALL'
              ? `Aucun produit ${filters.productType === 'WIZARD' ? 'WIZARD' : 'traditionnel'} en attente`
              : 'Tous les produits ont été traités'
            }
          </div>
        </div>
      )}

      {/* ✅ Légende pour les types de produits */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Guide de validation</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
              🎨
            </div>
            <div>
              <div className="font-medium text-purple-700">Produits WIZARD</div>
              <div className="text-gray-600">
                Produits utilisant des images personnalisées du vendeur.
                Vérifiez la qualité des images et la cohérence du produit.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
              🎯
            </div>
            <div>
              <div className="font-medium text-blue-700">Produits Traditionnels</div>
              <div className="text-gray-600">
                Produits avec designs à positionner.
                Assurez-vous que le design a été validé séparément.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWizardValidation;
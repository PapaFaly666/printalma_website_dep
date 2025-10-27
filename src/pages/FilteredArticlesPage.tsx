import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import vendorProductsService, { VendorProduct } from '../services/vendorProductsService';
import { ProductCardWithDesign } from '../components/ProductCardWithDesign';
import { formatPrice } from '../utils/priceUtils';

const FilteredArticlesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCategory = searchParams.get('category');

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('product');
  const [searchTerm, setSearchTerm] = useState('');

  // États pour les produits de l'API
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false
  });

  const themes = ['Amour', 'Otaku', 'Sport', 'HipHop', 'Anniversaire', 'Drôle'];

  // Charger les produits depuis l'API
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchQuery = selectedCategory || searchTerm || '';
        const itemsPerPage = 9;
        const offset = (currentPage - 1) * itemsPerPage;

        console.log('🔍 [FilteredArticlesPage] Recherche:', {
          category: selectedCategory,
          searchTerm,
          searchQuery,
          page: currentPage,
          offset
        });

        const response = await vendorProductsService.searchProducts({
          search: searchQuery,
          limit: itemsPerPage,
          offset
        });

        if (response.success) {
          setProducts(response.data);
          setPagination({
            total: response.pagination.total,
            hasMore: response.pagination.hasMore
          });
          console.log('✅ [FilteredArticlesPage] Produits chargés:', response.data.length);
        } else {
          setError(response.message);
          setProducts([]);
        }
      } catch (err) {
        console.error('❌ [FilteredArticlesPage] Erreur:', err);
        setError('Erreur lors du chargement des produits');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategory, searchTerm, currentPage]);

  // Calcul de la pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(pagination.total / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec catégorie sélectionnée */}
      {selectedCategory && (
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCategory}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Découvrez nos produits personnalisables
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-48 lg:flex-shrink-0">
            {/* Mobile sidebar toggle pour plus tard */}
            <div className="lg:hidden mb-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg w-full justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="font-medium">Filtres</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {/* Boutique Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h2 className="font-bold text-xl">Boutique</h2>
                  </div>

                  {/* Catégories */}
                  <div className="mb-6">
                    <button className="flex items-center justify-between w-full py-2 text-sm font-medium mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="font-semibold">Catégories</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="pl-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Hommes</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Femmes</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Enfants</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Bébés</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Accessoires</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <label className="text-sm cursor-pointer text-gray-700 hover:text-gray-900">Stickers</label>
                      </div>
                    </div>
                  </div>

                  {/* Produits */}
                  <div>
                    <button className="flex items-center justify-between w-full py-2 text-sm font-medium mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="font-semibold">Produits</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="pl-6 space-y-2 text-sm text-gray-700">
                      <button className="text-left hover:text-blue-600 block w-full text-left py-1">T-shirt</button>
                      <button className="text-left hover:text-blue-600 block w-full text-left py-1">Sweat/ Pull</button>
                      <button className="text-left hover:text-blue-600 block w-full text-left py-1">Casquettes et bonnets</button>
                      <button className="text-left hover:text-blue-600 block w-full text-left py-1">Sacs et sacs à dos</button>
                      <button className="text-left hover:text-blue-600 block w-full text-left py-1">Mugs et tasses</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Filter Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filtrer par</span>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <span>Couleurs</span>
                  <span className="text-base">🎨</span>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <span>Tailles</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <span>Prix</span>
                  <span className="text-base">💰</span>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <span>Matières</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search and Display controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                {/* Affichage buttons */}
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700">Affichage:</label>
                  <button
                    onClick={() => setViewMode('product')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      viewMode === 'product'
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>Produit</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setViewMode('design')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      viewMode === 'design'
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>Design</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="mb-8">
              {/* Loader */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-600">Chargement des produits...</span>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="font-medium">Erreur</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* No results */}
              {!loading && !error && products.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Aucun produit trouvé</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCategory
                      ? `Aucun produit pour la catégorie "${selectedCategory}"`
                      : 'Essayez une autre recherche'}
                  </p>
                </div>
              )}

              {/* Products */}
              {!loading && !error && products.length > 0 && (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {pagination.total} produit{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
                    {selectedCategory && ` pour "${selectedCategory}"`}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <ProductCardWithDesign
                        key={product.id}
                        product={product}
                        onClick={() => {
                          // Navigation vers la page détails du produit
                          console.log('Navigation vers détail produit:', product.id);
                          navigate(`/vendor-product-detail/${product.id}`);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {!loading && !error && products.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mb-8">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages = [];
                  const maxVisible = 5;

                  if (totalPages <= maxVisible) {
                    // Show all pages if total is less than max
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`w-8 h-8 rounded font-medium text-sm transition-colors ${
                            currentPage === i
                              ? 'bg-black text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                  } else {
                    // Show first page
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className={`w-8 h-8 rounded font-medium text-sm transition-colors ${
                          currentPage === 1
                            ? 'bg-black text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        1
                      </button>
                    );

                    // Show ellipsis if needed
                    if (currentPage > 3) {
                      pages.push(
                        <span key="ellipsis-start" className="px-1 text-gray-500">...</span>
                      );
                    }

                    // Show pages around current page
                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`w-8 h-8 rounded font-medium text-sm transition-colors ${
                            currentPage === i
                              ? 'bg-black text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Show ellipsis if needed
                    if (currentPage < totalPages - 2) {
                      pages.push(
                        <span key="ellipsis-end" className="px-1 text-gray-500">...</span>
                      );
                    }

                    // Show last page
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className={`w-8 h-8 rounded font-medium text-sm transition-colors ${
                          currentPage === totalPages
                            ? 'bg-black text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}

                {/* Next button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Tags Section */}
            <div className="mb-8">
              <p className="text-base font-medium text-gray-900 mb-4">Les clients ont également recherché :</p>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme}
                    className="px-4 py-2 border border-gray-400 rounded-md text-sm hover:bg-gray-50 transition-colors"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* History Section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl italic">Historique</span>
                  <div className="bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    !
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-400 text-white rounded-md text-sm font-medium hover:bg-blue-500 flex items-center gap-2 transition-colors">
                  Supprimer tout
                  <span className="bg-white text-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={`history-${i}`} className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                    <div className="relative bg-gradient-to-br from-pink-500 to-pink-600 aspect-square flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="0.5" opacity="0.5" />
                        <line x1="100" y1="0" x2="0" y2="100" stroke="white" strokeWidth="0.5" opacity="0.5" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default FilteredArticlesPage;
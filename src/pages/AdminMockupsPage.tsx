import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import adminProductsService, { AdminProduct } from '../services/adminProductsService';

const AdminMockupsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger tous les produits admin validés
        const response = await adminProductsService.getAllProducts();

        console.log('API Response:', response);

        // Vérifier si response.data existe, sinon utiliser response directement
        let allProducts = Array.isArray(response.data) ? response.data :
                         Array.isArray(response) ? response : [];

        let filteredProducts = allProducts;

        // Filtrer par catégorie si spécifiée
        if (categoryParam) {
          filteredProducts = filteredProducts.filter((product: AdminProduct) => {
            const categoryName = product.category?.name?.toLowerCase() || '';
            const categorySlug = product.category?.slug?.toLowerCase() || '';
            const subCategoryName = product.subCategory?.name?.toLowerCase() || '';
            const subCategorySlug = product.subCategory?.slug?.toLowerCase() || '';
            const searchCategory = categoryParam.toLowerCase();

            return categoryName.includes(searchCategory) ||
                   categorySlug.includes(searchCategory) ||
                   subCategoryName.includes(searchCategory) ||
                   subCategorySlug.includes(searchCategory) ||
                   categoryName === searchCategory ||
                   categorySlug === searchCategory ||
                   subCategoryName === searchCategory ||
                   subCategorySlug === searchCategory;
          });
        }

        // Filtrer par recherche
        if (searchTerm) {
          filteredProducts = filteredProducts.filter((product: AdminProduct) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setProducts(filteredProducts);
      } catch (err) {
        console.error('Erreur lors du chargement des mockups:', err);
        setError('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryParam, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Personnalise ton produit
              </h1>
              {categoryParam && (
                <p className="text-gray-600 mt-1">
                  Catégorie: <span className="font-medium">{categoryParam}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Retour
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Chargement des produits...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Aucun produit trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              {categoryParam
                ? `Aucun produit disponible pour la catégorie "${categoryParam}"`
                : 'Essayez une autre recherche'}
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}/customize`)}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.colorVariations && product.colorVariations.length > 0 && product.colorVariations[0].images && product.colorVariations[0].images.length > 0 ? (
                      <img
                        src={product.colorVariations[0].images[0].url}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span>Pas d'image</span>
                      </div>
                    )}

                    {/* Badge personnalisable */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        Personnalisable
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Couleurs disponibles */}
                    {product.colorVariations && product.colorVariations.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500">Couleurs:</span>
                        <div className="flex gap-1">
                          {product.colorVariations.slice(0, 5).map((color) => (
                            <div
                              key={color.id}
                              className="w-5 h-5 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: color.colorCode }}
                              title={color.name}
                            />
                          ))}
                          {product.colorVariations.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{product.colorVariations.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                      Personnaliser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMockupsPage;

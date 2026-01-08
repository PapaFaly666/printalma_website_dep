import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import CategoryTabs from '../components/CategoryTabs';
import { ArrowLeft } from 'lucide-react';
import vendorProductsService, { VendorProduct } from '../services/vendorProductsService';
import { ProductCardWithDesign } from '../components/ProductCardWithDesign';
import { categoriesService, Category } from '../services/categoriesService';
import { subCategoriesService, SubCategory } from '../services/subCategoriesService';
import { Loader2 } from 'lucide-react';

export default function FilteredProducts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Charger les catégories et sous-catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [categoriesData, subCategoriesData] = await Promise.all([
          categoriesService.getActiveCategories(),
          subCategoriesService.getAllSubCategories()
        ]);
        setCategories(categoriesData);
        setSubCategories(subCategoriesData.filter(sub => sub.isActive));

        // Trouver la catégorie correspondante au paramètre
        if (categoryParam) {
          const category = categoriesData.find(cat =>
            cat.name.toLowerCase() === categoryParam.toLowerCase()
          );
          if (category) {
            setSelectedCategory(category);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    loadCategories();
  }, [categoryParam]);

  // Charger les produits
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        let searchQuery = categoryParam || searchParam || '';

        const response = await vendorProductsService.searchProducts({
          search: searchQuery,
          limit: 100
        });

        if (response.success && response.data) {
          // Filtrer uniquement les produits publiés
          const publishedProducts = response.data.filter(
            product => product.status && product.status.toLowerCase() === 'published'
          );
          setProducts(publishedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryParam, searchParam]);

  // Formater le prix en FCFA
  const formatPriceInFCFA = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(price);
  };

  // Obtenir le titre de la page
  const getPageTitle = () => {
    if (categoryParam) {
      return categoryParam;
    }
    if (searchParam) {
      return `Résultats pour "${searchParam}"`;
    }
    return 'Tous les produits';
  };

  return (
    <>
      {/* CategoryTabs sticky qui suit le scroll */}
      <div className="sticky top-0 z-40">
        <CategoryTabs />
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Bouton de retour */}
        <div className="px-6 pt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-gray-600 hover:text-yellow-600 transition-colors duration-200 mb-5"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-base sm:text-lg font-medium">Retour à l'accueil</span>
          </button>
        </div>

        {/* Header de la page */}
        <div className="px-6 py-8 sm:py-12">
          <div className="flex items-center gap-4 mb-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>

          {/* Compteur de produits */}
          {!loading && (
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Grille des produits */}
        <div className="px-6 pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600 text-base sm:text-lg font-medium">Chargement des produits...</p>
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCardWithDesign
                  key={product.id}
                  product={product}
                  selectedColors={[]}
                  onClick={() => {
                    console.log('Navigation vers détail produit:', product.id);
                    navigate(`/vendor-product-detail/${product.id}`);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg px-6">
              <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-gray-400 mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-600 text-xl sm:text-2xl lg:text-3xl mb-3 font-semibold">Aucun produit trouvé</p>
              <p className="text-gray-500 text-base sm:text-lg lg:text-xl">
                {categoryParam
                  ? `Aucun produit disponible dans la catégorie "${categoryParam}"`
                  : searchParam
                  ? `Aucun produit ne correspond à votre recherche "${searchParam}"`
                  : 'Aucun produit disponible pour le moment'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-8 px-8 py-3 bg-yellow-400 text-black font-semibold text-base sm:text-lg rounded-lg hover:bg-yellow-500 transition-colors duration-200"
              >
                Retour à l'accueil
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

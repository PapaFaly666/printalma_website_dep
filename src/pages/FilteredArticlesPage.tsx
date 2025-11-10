import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import vendorProductsService, { VendorProduct } from '../services/vendorProductsService';
import { ProductCardWithDesign } from '../components/ProductCardWithDesign';
import { formatPrice } from '../utils/priceUtils';
import { categoriesService, Category } from '../services/categoriesService';
import { subCategoriesService, SubCategory } from '../services/subCategoriesService';

const FilteredArticlesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryParam = searchParams.get('category');

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

  // États pour les catégories et sous-catégories
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // États pour le sélecteur de couleur
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [tempSelectedColors, setTempSelectedColors] = useState<string[]>([]);
  const [showColorSelector, setShowColorSelector] = useState(false);

  // Couleurs disponibles
  const availableColors = [
    { name: 'Noir', value: 'black', hex: '#000000' },
    { name: 'Blanc', value: 'white', hex: '#FFFFFF' },
    { name: 'Rouge', value: 'red', hex: '#EF4444' },
    { name: 'Bleu', value: 'blue', hex: '#3B82F6' },
    { name: 'Vert', value: 'green', hex: '#10B981' },
    { name: 'Jaune', value: 'yellow', hex: '#F59E0B' },
    { name: 'Rose', value: 'pink', hex: '#EC4899' },
    { name: 'Violet', value: 'purple', hex: '#8B5CF6' },
    { name: 'Gris', value: 'gray', hex: '#6B7280' },
    { name: 'Orange', value: 'orange', hex: '#F97316' }
  ];

  // Fonctions pour gérer la sélection de couleur
  const toggleTempColor = (colorValue: string) => {
    setTempSelectedColors(prev =>
      prev.includes(colorValue)
        ? prev.filter(c => c !== colorValue)
        : [...prev, colorValue]
    );
  };

  const applyColorSelection = () => {
    setSelectedColors(tempSelectedColors);
    setShowColorSelector(false);
  };

  const cancelColorSelection = () => {
    setTempSelectedColors(selectedColors);
    setShowColorSelector(false);
  };

  const clearColors = () => {
    setSelectedColors([]);
    setTempSelectedColors([]);
  };

  // Fonction pour déterminer les couleurs disponibles dans les produits
  const getAvailableColorsFromProducts = () => {
    const colorSet = new Set<string>();

    products.forEach(product => {
      if (product.adminProduct?.colorVariations) {
        product.adminProduct.colorVariations.forEach((variation: any) => {
          const variationName = variation.name.toLowerCase();

          // Mapping inversé: trouver la valeur de couleur correspondante
          const colorMapping: { [key: string]: string } = {
            'noir': 'black',
            'blanc': 'white',
            'rouge': 'red',
            'bleu': 'blue',
            'vert': 'green',
            'jaune': 'yellow',
            'rose': 'pink',
            'violet': 'purple',
            'gris': 'gray',
            'orange': 'orange'
          };

          // Chercher correspondance par nom
          const mappedColor = colorMapping[variationName];
          if (mappedColor && availableColors.find(c => c.value === mappedColor)) {
            colorSet.add(mappedColor);
          }

          // Chercher correspondance directe par valeur
          const directMatch = availableColors.find(c =>
            c.value === variationName ||
            variation.colorCode.toLowerCase().includes(c.value)
          );
          if (directMatch) {
            colorSet.add(directMatch.value);
          }
        });
      }
    });

    // Filtrer availableColors pour ne garder que celles trouvées
    return availableColors.filter(color => colorSet.has(color.value));
  };

  // Charger les catégories et sous-catégories
  useEffect(() => {
    const loadCategoriesAndSubCategories = async () => {
      setLoadingCategories(true);
      try {
        const [categoriesData, subCategoriesData] = await Promise.all([
          categoriesService.getActiveCategories(),
          subCategoriesService.getAllSubCategories()
        ]);

        setCategories(categoriesData);
        setSubCategories(subCategoriesData.filter(sub => sub.isActive));

        // Si une catégorie est sélectionnée via l'URL, trouver la catégorie correspondante
        if (categoryParam) {
          const category = categoriesData.find(cat =>
            cat.name.toLowerCase() === categoryParam.toLowerCase() ||
            cat.slug === categoryParam
          );
          setSelectedCategory(category || null);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des catégories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategoriesAndSubCategories();
  }, [categoryParam]);

  // Charger les produits depuis l'API
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchQuery = categoryParam || searchTerm || '';
        const itemsPerPage = 9;
        const offset = (currentPage - 1) * itemsPerPage;

        console.log('🔍 [FilteredArticlesPage] Recherche:', {
          category: categoryParam,
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
          // Filtrer pour n'afficher que les produits publiés
          let publishedProducts = response.data.filter(product =>
            product.status && product.status.toLowerCase() === 'published'
          );

          // Si des couleurs sont sélectionnées, filtrer pour n'afficher que les produits qui ont ces couleurs
          if (selectedColors.length > 0) {
            console.log('🎨 [DEBUG] Couleurs sélectionnées:', selectedColors);
            console.log(`🧠 [LOGIC] ${selectedColors.length} couleur(s) sélectionnée(s) -> ${selectedColors.length === 1 ? 'Logique ET (exact match)' : 'Logique OU (any match)'}`);

            const filteredProducts = publishedProducts.filter(product => {
              if (!product.adminProduct?.colorVariations) {
                console.log(`❌ [DEBUG] Produit ${product.id} n'a pas de colorVariations`);
                return false;
              }

              console.log(`🔍 [DEBUG] Produit ${product.id}:`, {
                name: product.adminProduct.name,
                variations: product.adminProduct.colorVariations.map(v => ({
                  name: v.name,
                  colorCode: v.colorCode
                }))
              });

              // Fonction pour normaliser les noms de couleurs et comparer
              const normalizeColorName = (colorName: string): string => {
                return colorName.toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '') // Remove accents
                  .trim();
              };

              // LOGIQUE CONDITIONNELLE :
              // - 1 couleur : doit avoir EXACTEMENT cette couleur (ET)
              // - 2+ couleurs : doit avoir AU MOINS UNE de ces couleurs (OU)
              let hasMatchingColors: boolean;

              if (selectedColors.length === 1) {
                // UNE SEULE COULEUR : Logique ET exacte
                const selectedColor = selectedColors[0];
                console.log(`\n  🎯 [1 COULEUR] Recherche exacte de: ${selectedColor}`);

                hasMatchingColors = product.adminProduct.colorVariations.some((variation: any) => {
                  const variationName = normalizeColorName(variation.name);
                  const selectedColorNormalized = normalizeColorName(selectedColor);

                  // Mapping des couleurs anglaises vers françaises
                  const colorMapping: { [key: string]: string[] } = {
                    'black': ['black', 'noir'],
                    'white': ['white', 'blanc'],
                    'red': ['red', 'rouge'],
                    'blue': ['blue', 'bleu'],
                    'green': ['green', 'vert'],
                    'yellow': ['yellow', 'jaune'],
                    'pink': ['pink', 'rose'],
                    'purple': ['purple', 'violet'],
                    'gray': ['gray', 'grey', 'gris'],
                    'orange': ['orange']
                  };

                  // Noms possibles pour cette couleur
                  const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];

                  const match = possibleNames.some(name => {
                    const normalizedPossible = normalizeColorName(name);
                    const isMatch = variationName === normalizedPossible ||
                                   variationName.includes(normalizedPossible) ||
                                   normalizedPossible.includes(variationName);
                    return isMatch;
                  });

                  // Vérifier aussi par colorCode
                  const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);

                  const found = match || colorCodeMatch;
                  console.log(`    - Variation "${variation.name}" (code: ${variation.colorCode}) -> match: ${found}`);
                  return found;
                });

                console.log(`  ✅ [1 COULEUR] Couleur ${selectedColor} trouvée: ${hasMatchingColors}`);

              } else {
                // MULTIPLES COULEURS : Logique OU (au moins une couleur)
                console.log(`\n  🎯 [MULTI COULEURS] Recherche AU MOINS UNE de: ${selectedColors.join(', ')}`);

                hasMatchingColors = selectedColors.some(selectedColor => {
                  const colorFound = product.adminProduct.colorVariations.some((variation: any) => {
                    const variationName = normalizeColorName(variation.name);
                    const selectedColorNormalized = normalizeColorName(selectedColor);

                    // Mapping des couleurs anglaises vers françaises
                    const colorMapping: { [key: string]: string[] } = {
                      'black': ['black', 'noir'],
                      'white': ['white', 'blanc'],
                      'red': ['red', 'rouge'],
                      'blue': ['blue', 'bleu'],
                      'green': ['green', 'vert'],
                      'yellow': ['yellow', 'jaune'],
                      'pink': ['pink', 'rose'],
                      'purple': ['purple', 'violet'],
                      'gray': ['gray', 'grey', 'gris'],
                      'orange': ['orange']
                    };

                    // Noms possibles pour cette couleur
                    const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];

                    const match = possibleNames.some(name => {
                      const normalizedPossible = normalizeColorName(name);
                      const isMatch = variationName === normalizedPossible ||
                                     variationName.includes(normalizedPossible) ||
                                     normalizedPossible.includes(variationName);
                      return isMatch;
                    });

                    // Vérifier aussi par colorCode
                    const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);

                    return match || colorCodeMatch;
                  });

                  console.log(`    - Couleur ${selectedColor} trouvée: ${colorFound}`);
                  return colorFound;
                });

                console.log(`  ✅ [MULTI COULEURS] Au moins une couleur trouvée: ${hasMatchingColors}`);
              }

              console.log(`🏆 Produit ${product.id} (${product.adminProduct.name}) - Résultat final: ${hasMatchingColors}`);
              return hasMatchingColors;
            });

            console.log(`📊 [DEBUG] Produits filtrés: ${filteredProducts.length} / ${publishedProducts.length}`);
            publishedProducts = filteredProducts;
          }

          setProducts(publishedProducts);

          // Calculer correctement la pagination pour les produits filtrés
          if (selectedColors.length > 0) {
            // Pour les filtres de couleur, nous avons besoin de compter tous les produits correspondants
            // Pas juste ceux de la page actuelle - UTILISER LA MÊME LOGIQUE CONDITIONNELLE QUE CI-DESSUS
            const allFilteredProducts = response.data.filter(product => {
              if (!product.status || product.status.toLowerCase() !== 'published') return false;
              if (!product.adminProduct?.colorVariations) return false;

              // Fonction pour normaliser les noms de couleurs et comparer (même fonction que ci-dessus)
              const normalizeColorName = (colorName: string): string => {
                return colorName.toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '') // Remove accents
                  .trim();
              };

              // MÊME LOGIQUE CONDITIONNELLE :
              // - 1 couleur : doit avoir EXACTEMENT cette couleur
              // - 2+ couleurs : doit avoir AU MOINS UNE de ces couleurs
              let hasMatchingColors: boolean;

              if (selectedColors.length === 1) {
                // UNE SEULE COULEUR : Logique exacte
                const selectedColor = selectedColors[0];

                hasMatchingColors = product.adminProduct.colorVariations.some((variation: any) => {
                  const variationName = normalizeColorName(variation.name);
                  const selectedColorNormalized = normalizeColorName(selectedColor);

                  const colorMapping: { [key: string]: string[] } = {
                    'black': ['black', 'noir'],
                    'white': ['white', 'blanc'],
                    'red': ['red', 'rouge'],
                    'blue': ['blue', 'bleu'],
                    'green': ['green', 'vert'],
                    'yellow': ['yellow', 'jaune'],
                    'pink': ['pink', 'rose'],
                    'purple': ['purple', 'violet'],
                    'gray': ['gray', 'grey', 'gris'],
                    'orange': ['orange']
                  };

                  const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];

                  const match = possibleNames.some(name => {
                    const normalizedPossible = normalizeColorName(name);
                    const isMatch = variationName === normalizedPossible ||
                                   variationName.includes(normalizedPossible) ||
                                   normalizedPossible.includes(variationName);
                    return isMatch;
                  });

                  const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);

                  return match || colorCodeMatch;
                });

              } else {
                // MULTIPLES COULEURS : Logique OU (au moins une couleur)
                hasMatchingColors = selectedColors.some(selectedColor => {
                  return product.adminProduct.colorVariations.some((variation: any) => {
                    const variationName = normalizeColorName(variation.name);
                    const selectedColorNormalized = normalizeColorName(selectedColor);

                    const colorMapping: { [key: string]: string[] } = {
                      'black': ['black', 'noir'],
                      'white': ['white', 'blanc'],
                      'red': ['red', 'rouge'],
                      'blue': ['blue', 'bleu'],
                      'green': ['green', 'vert'],
                      'yellow': ['yellow', 'jaune'],
                      'pink': ['pink', 'rose'],
                      'purple': ['purple', 'violet'],
                      'gray': ['gray', 'grey', 'gris'],
                      'orange': ['orange']
                    };

                    const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];

                    const match = possibleNames.some(name => {
                      const normalizedPossible = normalizeColorName(name);
                      const isMatch = variationName === normalizedPossible ||
                                     variationName.includes(normalizedPossible) ||
                                     normalizedPossible.includes(variationName);
                      return isMatch;
                    });

                    const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);

                    return match || colorCodeMatch;
                  });
                });
              }

              return hasMatchingColors;
            });

            setPagination({
              total: allFilteredProducts.length,
              hasMore: false // Désactiver la pagination pour les filtres de couleur pour l'instant
            });
          } else {
            setPagination({
              total: response.pagination.total,
              hasMore: response.pagination.hasMore
            });
          }
          console.log('✅ [FilteredArticlesPage] Produits chargés:', response.data.length);
          console.log('📊 [FilteredArticlesPage] Produits publiés:', publishedProducts.length);
          console.log('🎨 [FilteredArticlesPage] Couleurs sélectionnées:', selectedColors);

          // Debug: Afficher la structure d'un produit exemple
          if (response.data.length > 0) {
            console.log('📋 [DEBUG] Structure produit exemple:', {
              id: response.data[0].id,
              status: response.data[0].status,
              hasAdminProduct: !!response.data[0].adminProduct,
              colorVariations: response.data[0].adminProduct?.colorVariations
            });
          }
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
  }, [categoryParam, searchTerm, currentPage, selectedColors]);

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
      {categoryParam && (
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCategory?.name || categoryParam}
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
                      {loadingCategories ? (
                        <div className="flex items-center gap-2 py-1">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-gray-500">Chargement...</span>
                        </div>
                      ) : (
                        <>
                          {subCategories.length === 0 ? (
                            <span className="text-gray-500 py-1">Aucune sous-catégorie</span>
                          ) : (
                            subCategories.map((subCategory) => (
                              <button
                                key={subCategory.id}
                                onClick={() => {
                                  // Naviguer vers la page filtrée pour cette sous-catégorie
                                  navigate(`/filtered-articles?category=${subCategory.slug}`);
                                }}
                                className="text-left hover:text-blue-600 block w-full text-left py-1 transition-colors"
                              >
                                {subCategory.name}
                              </button>
                            ))
                          )}
                        </>
                      )}
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

                <div className="relative">
                  <button
                    onClick={() => {
    if (!showColorSelector) {
      setTempSelectedColors(selectedColors);
    }
    setShowColorSelector(!showColorSelector);
  }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedColors.length > 0
                        ? 'bg-blue-500 text-white border-2 border-blue-500 shadow-md hover:bg-blue-600'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Couleurs</span>
                      {selectedColors.length === 0 && (
                        <span className="text-xs opacity-70">
                          ({getAvailableColorsFromProducts().length})
                        </span>
                      )}
                      {selectedColors.length > 0 && (
                        <div className="flex items-center gap-1">
                          {selectedColors.slice(0, 3).map((colorValue, index) => {
                            const color = availableColors.find(c => c.value === colorValue);
                            return color ? (
                              <div
                                key={colorValue}
                                className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                            ) : null;
                          })}
                          {selectedColors.length > 3 && (
                            <span className="text-xs opacity-90">
                              +{selectedColors.length - 3}
                            </span>
                          )}
                          <span className="text-xs opacity-90">
                            ({selectedColors.length})
                          </span>
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${showColorSelector ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Color Dropdown */}
                  {showColorSelector && (
                    <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
                      <div className="p-3">
                        {/* Sélection actuelle */}
                        {tempSelectedColors.length > 0 && (
                          <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Sélectionné:</div>
                            <div className="flex flex-wrap gap-1">
                              {tempSelectedColors.map((colorValue) => {
                                const color = availableColors.find(c => c.value === colorValue);
                                return color ? (
                                  <div
                                    key={colorValue}
                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-400"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="text-gray-700">{color.name}</span>
                                    <button
                                      onClick={() => toggleTempColor(colorValue)}
                                      className="text-gray-400 hover:text-gray-600 ml-1"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Grille de couleurs */}
                        <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto mb-3">
                          {getAvailableColorsFromProducts().map((color) => (
                            <button
                              key={color.value}
                              onClick={() => toggleTempColor(color.value)}
                              className={`group relative w-9 h-9 border transition-all hover:scale-105 ${
                                tempSelectedColors.includes(color.value)
                                  ? 'border-blue-500 shadow-sm z-10'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              title={color.name}
                            >
                              <div
                                className="w-full h-full"
                                style={{ backgroundColor: color.hex }}
                              />
                              {tempSelectedColors.includes(color.value) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {getAvailableColorsFromProducts().length === 0 && (
                          <div className="text-center py-3 text-sm text-gray-500">
                            Aucune couleur disponible
                          </div>
                        )}

                        {/* Boutons Enregistrer/Annuler */}
                        {getAvailableColorsFromProducts().length > 0 && (
                          <div className="flex gap-2 border-t border-gray-200 pt-3">
                            <button
                              onClick={applyColorSelection}
                              className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelColorSelection}
                              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
              {/* Color selection info */}
              {selectedColors.length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">
                          Couleurs sélectionnées:
                        </span>
                        <div className="flex gap-1">
                          {selectedColors.map((colorValue) => {
                            const color = availableColors.find(c => c.value === colorValue);
                            return color ? (
                              <div
                                key={colorValue}
                                className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-sm font-semibold text-blue-700 border border-blue-300"
                              >
                                <div
                                  className="w-3 h-3 rounded-full border border-blue-300"
                                  style={{ backgroundColor: color.hex }}
                                />
                                {color.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">
                        {selectedColors.length === 1
                          ? `Produits disponibles dans cette couleur`
                          : `Produits disponibles dans au moins une de ces couleurs`
                        }
                      </span>
                    </div>
                    <button
                      onClick={clearColors}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/80 hover:bg-white text-sm font-medium text-blue-600 hover:text-blue-800 rounded-lg border border-blue-200 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                      </svg>
                      Toutes les couleurs
                    </button>
                  </div>
                </div>
              )}

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
                    {selectedColors.length > 0 && categoryParam
                      ? `Aucun produit "${selectedCategory?.name || categoryParam}" disponible ${selectedColors.length === 1 ? 'dans cette couleur' : 'dans ces couleurs'} : ${selectedColors.map(c => availableColors.find(ac => ac.value === c)?.name).join(selectedColors.length === 1 ? '' : ', ')}`
                      : selectedColors.length > 0
                      ? `Aucun produit disponible ${selectedColors.length === 1 ? 'dans cette couleur' : 'dans ces couleurs'} : ${selectedColors.map(c => availableColors.find(ac => ac.value === c)?.name).join(', ')}`
                      : categoryParam
                      ? `Aucun produit pour la catégorie "${selectedCategory?.name || categoryParam}"`
                      : 'Essayez une autre recherche'}
                  </p>
                  {selectedColors.length > 0 && (
                    <button
                      onClick={clearColors}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Afficher tous les produits
                    </button>
                  )}
                </div>
              )}

              {/* Products */}
              {!loading && !error && products.length > 0 && (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {pagination.total} produit{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
                    {selectedColors.length > 0 && categoryParam
                      ? ` "${selectedCategory?.name || categoryParam}" ${selectedColors.length === 1 ? 'dans cette couleur' : 'dans ces couleurs'} : ${selectedColors.map(c => availableColors.find(ac => ac.value === c)?.name).join(', ')}`
                      : selectedColors.length > 0
                      ? ` ${selectedColors.length === 1 ? 'dans cette couleur' : 'dans ces couleurs'} : ${selectedColors.map(c => availableColors.find(ac => ac.value === c)?.name).join(', ')}`
                      : categoryParam && ` pour "${selectedCategory?.name || categoryParam}"`}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <ProductCardWithDesign
                        key={product.id}
                        product={product}
                        selectedColors={selectedColors}
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
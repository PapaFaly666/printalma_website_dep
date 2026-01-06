import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Loader2, Heart } from 'lucide-react';
import vendorProductsService, { VendorProduct } from '../services/vendorProductsService';
import { ProductCardWithDesign } from '../components/ProductCardWithDesign';
import { SimpleProductPreview } from '../components/vendor/SimpleProductPreview';
import { formatPrice } from '../utils/priceUtils';
import { categoriesService, Category } from '../services/categoriesService';
import { subCategoriesService, SubCategory } from '../services/subCategoriesService';
import ServiceFeatures from './ServiceFeatures ';
import Footer from '../components/Footer';
import { useFavorites } from '../contexts/FavoritesContext';

const FilteredArticlesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('product');
  const [searchTerm, setSearchTerm] = useState(searchParam || '');

  // États pour les produits de l'API
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false
  });

  const themes = ['Amour', 'Otaku', 'Sport', 'HipHop', 'Anniversaire', 'Drôle'];

  // ============ GESTION DE L'HISTORIQUE PROFESSIONNEL ============
  const HISTORY_STORAGE_KEY = 'vendor_products_history';
  const MAX_HISTORY_ITEMS = 12; // Limite professionnelle comme les apps e-commerce
  const MIN_DISPLAY_ITEMS = 4; // Minimum à afficher quand possible

  // Charger l'historique depuis le localStorage
  const loadHistory = (): VendorProduct[] => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
    return [];
  };

  // Sauvegarder l'historique dans le localStorage
  const saveHistory = (history: VendorProduct[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erreur sauvegarde historique:', error);
    }
  };

  // Ajouter un produit à l'historique avec comportement FIFO professionnel
  const addToHistory = (product: VendorProduct) => {
    const currentHistory = loadHistory();

    // Supprimer le produit s'il existe déjà (pour éviter les doublons)
    const filteredHistory = currentHistory.filter(p => p.id !== product.id);

    // Ajouter le produit en tête de liste avec FIFO - écraser les plus anciens
    const newHistory = [product, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    saveHistory(newHistory);
    setHistoryProducts(newHistory);

    console.log('✅ Produit ajouté à l\'historique (mode FIFO):', product.id);
    console.log('📊 Historique - Total:', newHistory.length, 'Récent:', newHistory.slice(0, 3).map(p => p.id));
  };

  // Supprimer tout l'historique
  const clearHistory = () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistoryProducts([]);
    console.log('✅ Historique supprimé');
  };

  // Supprimer un produit spécifique de l'historique
  const removeFromHistory = (productId: number) => {
    const currentHistory = loadHistory();
    const newHistory = currentHistory.filter(p => p.id !== productId);
    saveHistory(newHistory);
    setHistoryProducts(newHistory);
    console.log('✅ Produit retiré de l\'historique:', productId);
  };

  // Charger l'historique au montage du composant
  useEffect(() => {
    const history = loadHistory();
    setHistoryProducts(history);
    console.log('📜 Historique chargé:', history.length, 'produits');
  }, []);

  // Mettre à jour searchTerm quand searchParam change
  useEffect(() => {
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParam]);

  // États pour les catégories et sous-catégories
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // États pour le sélecteur de couleur
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [tempSelectedColors, setTempSelectedColors] = useState<string[]>([]);
  const [showColorSelector, setShowColorSelector] = useState(false);

  // États pour le sélecteur de taille
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [tempSelectedSizes, setTempSelectedSizes] = useState<string[]>([]);
  const [showSizeSelector, setShowSizeSelector] = useState(false);

  // États pour le filtre de prix
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [tempMinPrice, setTempMinPrice] = useState<number | ''>('');
  const [tempMaxPrice, setTempMaxPrice] = useState<number | ''>('');
  const [showPriceSelector, setShowPriceSelector] = useState(false);

  // États pour l'historique
  const [historyProducts, setHistoryProducts] = useState<VendorProduct[]>([]);

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

  // Fonctions pour gérer la sélection de taille
  const toggleTempSize = (size: string) => {
    setTempSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const applySizeSelection = () => {
    setSelectedSizes(tempSelectedSizes);
    setShowSizeSelector(false);
  };

  const cancelSizeSelection = () => {
    setTempSelectedSizes(selectedSizes);
    setShowSizeSelector(false);
  };

  const clearSizes = () => {
    setSelectedSizes([]);
    setTempSelectedSizes([]);
  };

  // Fonctions pour gérer le filtre de prix
  const applyPriceFilter = () => {
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setShowPriceSelector(false);
  };

  const cancelPriceFilter = () => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setShowPriceSelector(false);
  };

  const clearPriceFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    setTempMinPrice('');
    setTempMaxPrice('');
  };

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';

  // Formater le prix en FCFA
  const formatPriceInFCFA = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(price);
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

  // Fonction pour déterminer les tailles disponibles dans les produits
  const getAvailableSizesFromProducts = () => {
    const sizeSet = new Set<string>();

    products.forEach(product => {
      if (product.selectedSizes && Array.isArray(product.selectedSizes)) {
        product.selectedSizes.forEach((sizeObj: any) => {
          if (sizeObj.sizeName) {
            sizeSet.add(sizeObj.sizeName.toUpperCase());
          }
        });
      }
    });

    // Retourner les tailles triées par ordre logique
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const availableSizes = Array.from(sizeSet).sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return availableSizes;
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

          // Appliquer les filtres de couleur, taille et prix
          if (selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter) {
            console.log('🎨 [DEBUG] Couleurs sélectionnées:', selectedColors);
            console.log('📏 [DEBUG] Tailles sélectionnées:', selectedSizes);
            console.log('💰 [DEBUG] Prix min:', minPrice, 'Prix max:', maxPrice);

            if (selectedColors.length > 0) {
              console.log(`🧠 [LOGIC] ${selectedColors.length} couleur(s) sélectionnée(s) -> ${selectedColors.length === 1 ? 'Logique ET (exact match)' : 'Logique OU (any match)'}`);
            }
            if (selectedSizes.length > 0) {
              console.log(`🧠 [LOGIC] ${selectedSizes.length} taille(s) sélectionnée(s) -> Logique OU (any match)`);
            }
            if (hasPriceFilter) {
              console.log(`🧠 [LOGIC] Filtre de prix actif`);
            }

            const filteredProducts = publishedProducts.filter(product => {
              // Fonction pour normaliser les noms de couleurs et comparer
              const normalizeColorName = (colorName: string): string => {
                return colorName.toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '') // Remove accents
                  .trim();
              };

              // FILTRE PAR COULEUR
              let passesColorFilter = selectedColors.length === 0; // Si aucune couleur sélectionnée, on passe

              if (selectedColors.length > 0) {
                if (!product.adminProduct?.colorVariations) {
                  passesColorFilter = false;
                } else {
                  // LOGIQUE CONDITIONNELLE :
                  // - 1 couleur : doit avoir EXACTEMENT cette couleur (ET)
                  // - 2+ couleurs : doit avoir AU MOINS UNE de ces couleurs (OU)
                  let hasMatchingColors: boolean;

                  if (selectedColors.length === 1) {
                    // UNE SEULE COULEUR : Logique ET exacte
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
                        return variationName === normalizedPossible ||
                               variationName.includes(normalizedPossible) ||
                               normalizedPossible.includes(variationName);
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
                          return variationName === normalizedPossible ||
                                 variationName.includes(normalizedPossible) ||
                                 normalizedPossible.includes(variationName);
                        });

                        const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);
                        return match || colorCodeMatch;
                      });
                    });
                  }

                  passesColorFilter = hasMatchingColors;
                }
              }

              // FILTRE PAR TAILLE
              let passesSizeFilter = selectedSizes.length === 0; // Si aucune taille sélectionnée, on passe

              if (selectedSizes.length > 0) {
                if (!product.selectedSizes || !Array.isArray(product.selectedSizes)) {
                  passesSizeFilter = false;
                } else {
                  // Logique OU : le produit doit avoir AU MOINS UNE des tailles sélectionnées
                  const productSizes = product.selectedSizes.map((s: any) => s.sizeName.toUpperCase());
                  const hasMatchingSize = selectedSizes.some(selectedSize =>
                    productSizes.includes(selectedSize.toUpperCase())
                  );
                  passesSizeFilter = hasMatchingSize;
                }
              }

              // FILTRE PAR PRIX
              let passesPriceFilter = !hasPriceFilter; // Si aucun filtre de prix, on passe

              if (hasPriceFilter) {
                const productPrice = product.price || 0;
                const min = minPrice !== '' ? minPrice : 0;
                const max = maxPrice !== '' ? maxPrice : Infinity;

                passesPriceFilter = productPrice >= min && productPrice <= max;
              }

              // Le produit doit passer TOUS les filtres actifs (ET logique entre les filtres)
              return passesColorFilter && passesSizeFilter && passesPriceFilter;
            });

            console.log(`📊 [DEBUG] Produits filtrés: ${filteredProducts.length} / ${publishedProducts.length}`);
            publishedProducts = filteredProducts;
          }

          setProducts(publishedProducts);

          // Calculer correctement la pagination pour les produits filtrés
          if (selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter) {
            // Pour les filtres, nous avons besoin de compter tous les produits correspondants
            const allFilteredProducts = response.data.filter(product => {
              if (!product.status || product.status.toLowerCase() !== 'published') return false;

              // Fonction pour normaliser les noms de couleurs et comparer (même fonction que ci-dessus)
              const normalizeColorName = (colorName: string): string => {
                return colorName.toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '') // Remove accents
                  .trim();
              };

              // FILTRE PAR COULEUR
              let passesColorFilter = selectedColors.length === 0;

              if (selectedColors.length > 0) {
                if (!product.adminProduct?.colorVariations) {
                  passesColorFilter = false;
                } else {
                  let hasMatchingColors: boolean;

                  if (selectedColors.length === 1) {
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
                        return variationName === normalizedPossible ||
                               variationName.includes(normalizedPossible) ||
                               normalizedPossible.includes(variationName);
                      });

                      const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);
                      return match || colorCodeMatch;
                    });
                  } else {
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
                          return variationName === normalizedPossible ||
                                 variationName.includes(normalizedPossible) ||
                                 normalizedPossible.includes(variationName);
                        });

                        const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);
                        return match || colorCodeMatch;
                      });
                    });
                  }

                  passesColorFilter = hasMatchingColors;
                }
              }

              // FILTRE PAR TAILLE
              let passesSizeFilter = selectedSizes.length === 0;

              if (selectedSizes.length > 0) {
                if (!product.selectedSizes || !Array.isArray(product.selectedSizes)) {
                  passesSizeFilter = false;
                } else {
                  const productSizes = product.selectedSizes.map((s: any) => s.sizeName.toUpperCase());
                  const hasMatchingSize = selectedSizes.some(selectedSize =>
                    productSizes.includes(selectedSize.toUpperCase())
                  );
                  passesSizeFilter = hasMatchingSize;
                }
              }

              // FILTRE PAR PRIX
              let passesPriceFilter = !hasPriceFilter;

              if (hasPriceFilter) {
                const productPrice = product.price || 0;
                const min = minPrice !== '' ? minPrice : 0;
                const max = maxPrice !== '' ? maxPrice : Infinity;

                passesPriceFilter = productPrice >= min && productPrice <= max;
              }

              return passesColorFilter && passesSizeFilter && passesPriceFilter;
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
  }, [categoryParam, searchTerm, currentPage, selectedColors, selectedSizes, minPrice, maxPrice]);

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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      selectedColors.length > 0
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
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
                          {selectedColors.slice(0, 3).map((colorValue) => {
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
                              className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelColorSelection}
                              className="flex-1 px-3 py-1.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      if (!showSizeSelector) {
                        setTempSelectedSizes(selectedSizes);
                      }
                      setShowSizeSelector(!showSizeSelector);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      selectedSizes.length > 0
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Tailles</span>
                      {selectedSizes.length === 0 && (
                        <span className="text-xs opacity-70">
                          ({getAvailableSizesFromProducts().length})
                        </span>
                      )}
                      {selectedSizes.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold opacity-90">
                            {selectedSizes.slice(0, 3).join(', ')}
                          </span>
                          {selectedSizes.length > 3 && (
                            <span className="text-xs opacity-90">
                              +{selectedSizes.length - 3}
                            </span>
                          )}
                          <span className="text-xs opacity-90">
                            ({selectedSizes.length})
                          </span>
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${showSizeSelector ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Size Dropdown */}
                  {showSizeSelector && (
                    <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
                      <div className="p-3">
                        {/* Sélection actuelle */}
                        {tempSelectedSizes.length > 0 && (
                          <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Sélectionné:</div>
                            <div className="flex flex-wrap gap-1">
                              {tempSelectedSizes.map((size) => (
                                <div
                                  key={size}
                                  className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                                >
                                  <span className="text-gray-700 font-semibold">{size}</span>
                                  <button
                                    onClick={() => toggleTempSize(size)}
                                    className="text-gray-400 hover:text-gray-600 ml-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Grille de tailles */}
                        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto mb-3">
                          {getAvailableSizesFromProducts().map((size) => (
                            <button
                              key={size}
                              onClick={() => toggleTempSize(size)}
                              className={`px-3 py-2 text-sm font-semibold border-2 rounded-lg transition-all ${
                                tempSelectedSizes.includes(size)
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>

                        {getAvailableSizesFromProducts().length === 0 && (
                          <div className="text-center py-3 text-sm text-gray-500">
                            Aucune taille disponible
                          </div>
                        )}

                        {/* Boutons Enregistrer/Annuler */}
                        {getAvailableSizesFromProducts().length > 0 && (
                          <div className="flex gap-2 border-t border-gray-200 pt-3">
                            <button
                              onClick={applySizeSelection}
                              className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelSizeSelection}
                              className="flex-1 px-3 py-1.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      if (!showPriceSelector) {
                        setTempMinPrice(minPrice);
                        setTempMaxPrice(maxPrice);
                      }
                      setShowPriceSelector(!showPriceSelector);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      hasPriceFilter
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>Prix</span>
                    {hasPriceFilter && (
                      <span className="text-xs font-semibold opacity-90">
                        {minPrice !== '' && maxPrice !== ''
                          ? `${formatPriceInFCFA(Number(minPrice))} - ${formatPriceInFCFA(Number(maxPrice))}`
                          : minPrice !== ''
                          ? `>${formatPriceInFCFA(Number(minPrice))}`
                          : maxPrice !== '' ? `<${formatPriceInFCFA(Number(maxPrice))}` : ''
                        }
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 transition-transform ${showPriceSelector ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Price Dropdown */}
                  {showPriceSelector && (
                    <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-80">
                      <div className="p-4">
                        <div className="mb-3">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Filtrer par prix (FCFA)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Prix minimum</label>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="Min"
                                value={tempMinPrice === '' ? '' : tempMinPrice}
                                onChange={(e) => setTempMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Prix maximum</label>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="Max"
                                value={tempMaxPrice === '' ? '' : tempMaxPrice}
                                onChange={(e) => setTempMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Suggestions de plage de prix */}
                        <div className="mb-3">
                          <label className="text-xs text-gray-600 mb-2 block">Suggestions:</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => {
                                setTempMinPrice('');
                                setTempMaxPrice(10000);
                              }}
                              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-purple-100 border border-gray-300 hover:border-purple-400 rounded transition-colors"
                            >
                              &lt; 10k
                            </button>
                            <button
                              onClick={() => {
                                setTempMinPrice(10000);
                                setTempMaxPrice(25000);
                              }}
                              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-purple-100 border border-gray-300 hover:border-purple-400 rounded transition-colors"
                            >
                              10k - 25k
                            </button>
                            <button
                              onClick={() => {
                                setTempMinPrice(25000);
                                setTempMaxPrice('');
                              }}
                              className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-purple-100 border border-gray-300 hover:border-purple-400 rounded transition-colors"
                            >
                              &gt; 25k
                            </button>
                          </div>
                        </div>

                        {/* Boutons Appliquer/Annuler */}
                        <div className="flex gap-2 border-t border-gray-200 pt-3">
                          <button
                            onClick={applyPriceFilter}
                            className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Appliquer
                          </button>
                          <button
                            onClick={cancelPriceFilter}
                            className="flex-1 px-3 py-1.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
              {/* Filters info */}
              {(selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter) && (
                <div className="mb-4 space-y-2">
                  {/* Color selection info */}
                  {selectedColors.length > 0 && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary">
                              Couleurs:
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {selectedColors.map((colorValue) => {
                                const color = availableColors.find(c => c.value === colorValue);
                                return color ? (
                                  <div
                                    key={colorValue}
                                    className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-sm font-semibold text-primary border border-primary/30"
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    {color.name}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={clearColors}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-primary/10 text-sm font-medium text-primary rounded-lg border border-primary/30 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Size selection info */}
                  {selectedSizes.length > 0 && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary">
                              Tailles:
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {selectedSizes.map((size) => (
                                <div
                                  key={size}
                                  className="px-2 py-1 bg-white rounded-full text-sm font-semibold text-primary border border-primary/30"
                                >
                                  {size}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={clearSizes}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-primary/10 text-sm font-medium text-primary rounded-lg border border-primary/30 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Price filter info */}
                  {hasPriceFilter && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary">
                              Prix:
                            </span>
                            <div className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-primary border border-primary/30">
                              {minPrice !== '' && maxPrice !== ''
                                ? `${formatPriceInFCFA(Number(minPrice))} - ${formatPriceInFCFA(Number(maxPrice))}`
                                : minPrice !== ''
                                ? `À partir de ${formatPriceInFCFA(Number(minPrice))}`
                                : maxPrice !== '' ? `Jusqu'à ${formatPriceInFCFA(Number(maxPrice))}` : ''
                              }
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={clearPriceFilter}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-primary/10 text-sm font-medium text-primary rounded-lg border border-primary/30 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
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
                    {(selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter)
                      ? `Aucun produit disponible avec les filtres sélectionnés`
                      : categoryParam
                      ? `Aucun produit pour la catégorie "${selectedCategory?.name || categoryParam}"`
                      : 'Essayez une autre recherche'}
                  </p>
                  {(selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter) && (
                    <div className="flex gap-2 justify-center mt-3 flex-wrap">
                      {selectedColors.length > 0 && (
                        <button
                          onClick={clearColors}
                          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Effacer les couleurs
                        </button>
                      )}
                      {selectedSizes.length > 0 && (
                        <button
                          onClick={clearSizes}
                          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Effacer les tailles
                        </button>
                      )}
                      {hasPriceFilter && (
                        <button
                          onClick={clearPriceFilter}
                          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Effacer le prix
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Products */}
              {!loading && !error && products.length > 0 && (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {pagination.total} produit{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
                    {categoryParam && ` pour "${selectedCategory?.name || categoryParam}"`}
                    {(selectedColors.length > 0 || selectedSizes.length > 0 || hasPriceFilter) && (
                      <span className="font-medium"> avec les filtres:</span>
                    )}
                    {selectedColors.length > 0 && (
                      <span> Couleurs: {selectedColors.map(c => availableColors.find(ac => ac.value === c)?.name).join(', ')}</span>
                    )}
                    {selectedSizes.length > 0 && (
                      <span> • Tailles: {selectedSizes.join(', ')}</span>
                    )}
                    {hasPriceFilter && (
                      <span> • Prix: {
                        minPrice !== '' && maxPrice !== ''
                          ? `${formatPriceInFCFA(Number(minPrice))} - ${formatPriceInFCFA(Number(maxPrice))}`
                          : minPrice !== ''
                          ? `à partir de ${formatPriceInFCFA(Number(minPrice))}`
                          : maxPrice !== '' ? `jusqu'à ${formatPriceInFCFA(Number(maxPrice))}` : ''
                      }</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <ProductCardWithDesign
                        key={product.id}
                        product={product}
                        selectedColors={selectedColors}
                        onClick={() => {
                          // Ajouter à l'historique avant de naviguer
                          addToHistory(product);
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

            {/* Section Historique */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12 max-w-7xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900" style={{ fontStyle: 'italic' }}>
                    Historique
                  </h2>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm sm:text-base font-semibold">
                      {historyProducts.length}
                    </span>
                  </div>
                </div>
                {historyProducts.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 bg-cyan-400 text-white rounded-lg font-medium hover:bg-cyan-500 transition-colors flex items-center gap-1 sm:gap-2"
                  >
                    <span className="hidden sm:inline">Supprimer tout</span>
                    <span className="sm:hidden">Supprimer</span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Grille historique - Design original simple avec logique FIFO */}
              {historyProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-lg mb-2">Aucun produit dans l'historique</p>
                  <p className="text-gray-500 text-sm">Les produits que vous consultez apparaîtront ici</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {historyProducts.map((historyProduct) => (
                    <div
                      key={historyProduct.id}
                      className="group cursor-pointer relative"
                      onClick={() => navigate(`/vendor-product-detail/${historyProduct.id}`)}
                    >
                      {/* Utiliser SimpleProductPreview pour un affichage cohérent avec le même positionnement que le produit principal */}
                      <div className="aspect-square bg-white rounded-2xl overflow-hidden relative border border-gray-200 hover:shadow-lg transition-shadow">
                        <SimpleProductPreview
                          product={historyProduct}
                          showColorSlider={false}
                          showDelimitations={false}
                          onProductClick={() => {}}
                          hideValidationBadges={false}
                          imageObjectFit="contain"
                          initialColorId={(historyProduct as any).defaultColorId ?? historyProduct.selectedColors[0]?.id}
                        />

                        {/* Bouton supprimer en haut à droite */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(historyProduct.id);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Info produit */}
                      <div className="mt-3">
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">
                          {historyProduct.vendorName || historyProduct.adminProduct?.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="font-bold">{formatPrice(historyProduct.price)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ServiceFeatures section */}
      <ServiceFeatures />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FilteredArticlesPage;
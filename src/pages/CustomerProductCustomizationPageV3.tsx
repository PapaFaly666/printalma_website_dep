import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ShoppingCart,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Type,
  Save,
  Share2,
  Maximize,
  HelpCircle,
  Shirt,
  X,
  Search,
  Star,
  Flag,
  Cloud,
  CloudOff,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Sticker,
  Truck,
  ChevronRight,
  Check
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/use-toast';
import adminProductsService, { AdminProduct } from '../services/adminProductsService';
import designService from '../services/designService';
import customizationService from '../services/customizationService';
import categoryService from '../services/categoryService';
import { normalizeProductFromApi } from '../utils/productNormalization';
import { formatPrice } from '../utils/priceUtils';
import ProductDesignEditor, { ProductDesignEditorRef, FONTS, COLORS } from '../components/ProductDesignEditor';
import SizeQuantityModal from '../components/SizeQuantityModal';
import { useCart } from '../contexts/CartContext';
import Footer from '../components/Footer';
import AIImageGenerator from '../components/ai-image-generator/AIImageGenerator';
import SynchronizedStickerPreview from '../components/SynchronizedStickerPreview';
import ImageUploadModal from '../components/ImageUploadModal';

// Fonction debounce pour l'auto-sauvegarde
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

const CustomerProductCustomizationPageV3: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, openCart } = useCart();
  const editorRef = useRef<ProductDesignEditorRef>(null);

  // États du produit
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [selectedColorVariation, setSelectedColorVariation] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États de l'interface
  const [activeTab, setActiveTab] = useState<'designs' | 'text' | 'upload' | 'ai' | 'stickers'>('designs');
  const [showDesignLibrary, setShowDesignLibrary] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showProductLibrary, setShowProductLibrary] = useState(false);
  const [showStickerSelection, setShowStickerSelection] = useState(false); // 🆕 Afficher le choix de stickers dans la grille
  const [stickerType, setStickerType] = useState<'autocollant' | 'pare-chocs' | null>(null);
  const [stickerBorderColor, setStickerBorderColor] = useState<string>('transparent'); // 🆕 Couleur contour autocollant
  const [stickerSurface, setStickerSurface] = useState<'blanc-mat' | 'transparent'>('blanc-mat'); // 🆕 Surface autocollant
  const [stickerSize, setStickerSize] = useState<string>('10 mm x 12 mm'); // 🆕 Taille autocollant (minimum)
  const [showSizeSelector, setShowSizeSelector] = useState(false); // 🆕 Afficher le sélecteur de taille
  const [selectedStickerDesign, setSelectedStickerDesign] = useState<any>(null); // 🆕 Design sélectionné pour le sticker
  const [vendorDesigns, setVendorDesigns] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AdminProduct[]>([]);
  const [apiCategories, setApiCategories] = useState<any[]>([]); // 🆕 Catégories depuis l'API
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false); // 🆕
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | null>(null);
  const [selectedProductSubCategory, setSelectedProductSubCategory] = useState<string | null>(null); // 🆕 Sous-catégorie
  const [designSearch, setDesignSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  // 📝 État pour l'élément sélectionné (pour l'édition de texte)
  const [selectedElement, setSelectedElement] = useState<any>(null);

  // Récupérer l'élément sélectionné depuis l'éditeur
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (editorRef.current) {
        const element = editorRef.current.getSelectedElement();
        setSelectedElement(element || null);
      }
    }, 100); // Vérifier toutes les 100ms

    return () => clearInterval(intervalId);
  }, []);

  // Filtres pour les designs
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showAllAudience, setShowAllAudience] = useState(true);
  const [showAdaptableColor, setShowAdaptableColor] = useState(true);

  // Éléments de design - organisés par vue
  // Structure: { "colorId-viewId": [...elements] }
  const [designElementsByView, setDesignElementsByView] = useState<Record<string, any[]>>({});
  // Ref pour éviter les closures stale dans les callbacks async
  const designElementsByViewRef = useRef<Record<string, any[]>>({});

  // Flag pour éviter la sauvegarde pendant la restauration
  const isRestoringRef = useRef(false);
  // Flag pour tracker si la restauration initiale est complète
  const hasRestoredRef = useRef(false);

  // Synchroniser la ref avec le state
  useEffect(() => {
    designElementsByViewRef.current = designElementsByView;
  }, [designElementsByView]);

  // Modal de sélection taille/quantité
  const [showSizeModal, setShowSizeModal] = useState(false);

  // États de synchronisation avec la base de données
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const currentCustomizationIdRef = useRef<number | null>(null);

  // Catégories et sous-catégories depuis l'API (priorité) ou extraites des produits (fallback)
  const productCategoriesWithSub = useMemo(() => {
    // 🆕 Si on a des catégories depuis l'API, les utiliser
    if (apiCategories.length > 0) {
      return apiCategories
        .filter((cat: any) => cat.isActive !== false) // Filtrer les catégories actives
        .map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          subCategories: (cat.subCategories || [])
            .filter((sub: any) => sub.isActive !== false)
            .map((sub: any) => ({
              id: sub.id,
              name: sub.name,
              slug: sub.slug
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Fallback : Extraire depuis les produits (ancien comportement)
    const categoriesMap = new Map<string, Set<string>>();

    availableProducts.forEach(product => {
      const categoryName = product.category?.name;
      if (categoryName) {
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, new Set<string>());
        }

        // Ajouter la sous-catégorie si elle existe
        const subCategoryName = product.subCategory?.name;
        if (subCategoryName) {
          categoriesMap.get(categoryName)!.add(subCategoryName);
        }
      }
    });

    // Convertir en structure utilisable avec tri
    return Array.from(categoriesMap.entries())
      .map(([category, subCategories]) => ({
        name: category,
        subCategories: Array.from(subCategories).map(name => ({ name })).sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apiCategories, availableProducts]);

  // Liste simple des catégories (pour compatibilité)
  const productCategories = useMemo(() => {
    return productCategoriesWithSub.map(cat => cat.name);
  }, [productCategoriesWithSub]);

  // Sous-catégories de la catégorie sélectionnée
  const currentSubCategories = useMemo(() => {
    if (!selectedProductCategory) return [];
    const category = productCategoriesWithSub.find(cat => cat.name === selectedProductCategory);
    return category?.subCategories || [];
  }, [productCategoriesWithSub, selectedProductCategory]);

  // Produits filtrés par catégorie, sous-catégorie et recherche
  const filteredProducts = useMemo(() => {
    const filtered = availableProducts.filter(product => {
      const matchSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCategory = !selectedProductCategory ||
        (product.category?.name === selectedProductCategory);
      const matchSubCategory = !selectedProductSubCategory ||
        (product.subCategory?.name === selectedProductSubCategory);

      return matchSearch && matchCategory && matchSubCategory;
    });

    // Log de résumé uniquement
    console.log(`✅ [Filter] Filtrage:`, {
      total: availableProducts.length,
      filtered: filtered.length,
      selectedCategory: selectedProductCategory,
      selectedSubCategory: selectedProductSubCategory,
      products: filtered.map(p => ({
        name: p.name,
        category: p.category?.name,
        subCategory: p.subCategory?.name
      }))
    });

    return filtered;
  }, [availableProducts, productSearch, selectedProductCategory, selectedProductSubCategory]);

  // Fonction helper pour obtenir la clé de la vue actuelle
  const getCurrentViewKey = () => {
    if (!selectedColorVariation || !selectedView) return null;
    return `${selectedColorVariation.id}-${selectedView.id}`;
  };

  // Obtenir les éléments de la vue actuelle
  const getCurrentElements = () => {
    const viewKey = getCurrentViewKey();
    if (!viewKey) return [];
    return designElementsByView[viewKey] || [];
  };

  // Traduire le viewType en français
  const getViewName = (viewType: string, index: number, totalViews: number = 1): string => {
    const viewNames: Record<string, string> = {
      'FRONT': 'Devant',
      'BACK': 'Arrière',
      'LEFT': 'Gauche',
      'RIGHT': 'Droite',
      'TOP': 'Dessus',
      'BOTTOM': 'Dessous',
      'DETAIL': 'Détail',
      'OTHER': 'Autre'
    };

    // Si c'est 'OTHER' et qu'il n'y a qu'une seule vue, utiliser un nom plus descriptif
    if (viewType?.toUpperCase() === 'OTHER' && totalViews === 1) {
      return 'Personnalisation';
    }

    // Si le viewType est reconnu, l'utiliser
    const translatedName = viewNames[viewType?.toUpperCase()];
    if (translatedName) {
      return translatedName;
    }

    // Sinon, utiliser un nom générique avec l'index
    return `Vue ${index + 1}`;
  };

  // Obtenir les éléments pour une vue spécifique
  const getElementsForView = (colorId: number, viewId: number) => {
    const viewKey = `${colorId}-${viewId}`;
    return designElementsByView[viewKey] || [];
  };

  // Calculer le prix total des designs pour une vue spécifique (sans doublons)
  const getDesignsPriceForView = (colorId: number, viewId: number) => {
    const elements = getElementsForView(colorId, viewId);
    const uniqueDesigns = new Set();

    return elements
      .filter(element => {
        // Ne considérer que les images avec un designId et un prix
        if (element.type !== 'image' || !element.designId || !element.designPrice || element.designPrice <= 0) {
          return false;
        }

        // Éviter les doublons : ne compter que la première occurrence de chaque designId
        if (uniqueDesigns.has(element.designId)) {
          console.log(`🔄 [Customization] Design ${element.designId} déjà compté, ignoré`);
          return false;
        }

        uniqueDesigns.add(element.designId);
        console.log(`✅ [Customization] Design ${element.designId} ajouté avec prix: ${element.designPrice} FCFA`);
        return true;
      })
      .reduce((total, element) => total + (element.designPrice || 0), 0);
  };

  // Calculer le prix total des designs pour toutes les vues (sans doublons)
  const getTotalDesignsPrice = () => {
    if (!product || !selectedColorVariation) return 0;

    const uniqueDesigns = new Set();
    let totalDesignsPrice = 0;

    if (selectedColorVariation.images) {
      selectedColorVariation.images.forEach((view: any) => {
        const elements = getElementsForView(selectedColorVariation.id, view.id);

        elements.forEach(element => {
          if (element.type === 'image' && element.designId && element.designPrice && element.designPrice > 0) {
            if (!uniqueDesigns.has(element.designId)) {
              uniqueDesigns.add(element.designId);
              totalDesignsPrice += element.designPrice;
              console.log(`✅ [Customization] Vue ${view.id}: Design ${element.designId} ajouté au total: +${element.designPrice} FCFA`);
            } else {
              console.log(`🔄 [Customization] Vue ${view.id}: Design ${element.designId} déjà compté, ignoré`);
            }
          }
        });
      });
    }

    console.log(`💰 [Customization] Prix total des designs: ${totalDesignsPrice} FCFA (${uniqueDesigns.size} designs uniques)`);
    return totalDesignsPrice;
  };

  // Obtenir le prix du produit pour une taille spécifique
  const getPriceForSize = (sizeName: string): number => {
    if (!product) return 0;

    // Vérifier sizePricing d'abord
    if (product.sizePrices && product.sizePrices.length > 0) {
      const sizePrice = product.sizePrices.find(sp => sp.size === sizeName);
      if (sizePrice) {
        return sizePrice.salePrice || sizePrice.suggestedPrice;
      }
    }

    // Vérifier sizesWithPrices
    if (product.sizesWithPrices && product.sizesWithPrices.length > 0) {
      const sizePrice = product.sizesWithPrices.find(sp => sp.sizeName === sizeName);
      if (sizePrice) {
        return sizePrice.salePrice || sizePrice.suggestedPrice;
      }
    }

    // Fallback au prix de base
    return product.suggestedPrice || product.price || 0;
  };

  // Calculer le prix total (produit + designs) pour une taille spécifique
  const getTotalPriceForSize = (sizeName?: string) => {
    const basePrice = sizeName ? getPriceForSize(sizeName) : (product?.suggestedPrice || product?.price || 0);
    const designsPrice = getTotalDesignsPrice();
    return basePrice + designsPrice;
  };

  // Calculer le prix total (produit + designs) - utilise le prix de base par défaut
  const getTotalPrice = () => {
    return getTotalPriceForSize();
  };

  // Réinitialiser les flags de restauration quand l'ID du produit change
  useEffect(() => {
    console.log('🔄 [Customization] Changement de produit détecté, ID:', id);
    // Réinitialiser les flags pour permettre la restauration du nouveau produit
    hasRestoredRef.current = false;
    isRestoringRef.current = false;
    // Réinitialiser les éléments de design pour éviter de voir les anciens éléments
    setDesignElementsByView({});
  }, [id]);

  // Charger le produit
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const productData = await adminProductsService.getProductById(Number(id));
        const normalizedProduct = normalizeProductFromApi(productData);
        setProduct(normalizedProduct);

        if (productData.colorVariations && productData.colorVariations.length > 0) {
          const firstColor = productData.colorVariations[0];
          setSelectedColorVariation(firstColor);

          if (firstColor.images && firstColor.images.length > 0) {
            setSelectedView(firstColor.images[0]);
          }
        }
      } catch (err) {
        console.error('Erreur chargement produit:', err);
        setError('Impossible de charger le produit');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // ÉTAPE 1: Restaurer la couleur et la vue depuis localStorage au démarrage
  useEffect(() => {
    if (!id || !product || hasRestoredRef.current) return;

    try {
      const storageKey = `design-data-product-${id}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        console.log('📦 [Customization] Lecture localStorage pour couleur/vue...');
        const data = JSON.parse(saved);

        // TOUJOURS activer le flag avant de restaurer couleur/vue
        // pour éviter que la sauvegarde ne s'active pendant la restauration
        console.log('🔒 [Customization] Activation du flag de restauration');
        isRestoringRef.current = true;

        // Restaurer uniquement la couleur et la vue
        if (data.colorVariationId && product.colorVariations) {
          const savedColor = product.colorVariations.find(c => c.id === data.colorVariationId);
          if (savedColor) {
            console.log('🎨 [Customization] Restauration couleur:', savedColor);
            setSelectedColorVariation(savedColor);

            if (data.viewId && savedColor.images) {
              const savedView = savedColor.images.find(img => img.id === data.viewId);
              if (savedView) {
                console.log('🖼️ [Customization] Restauration vue:', savedView);
                setSelectedView(savedView);
              }
            }
          }
        }

        // Restaurer les éléments par vue
        if (data.elementsByView && typeof data.elementsByView === 'object') {
          console.log('📦 [Customization] Restauration éléments par vue:', Object.keys(data.elementsByView).length);
          setDesignElementsByView(data.elementsByView);
          hasRestoredRef.current = true;
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 1000);
        } else {
          // Aucune donnée par vue, marquer comme restauré
          hasRestoredRef.current = true;
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 1000);
        }
      } else {
        // Aucune donnée sauvegardée, marquer comme restauré
        hasRestoredRef.current = true;
      }
    } catch (err) {
      console.error('❌ [Customization] Erreur lecture localStorage (couleur/vue):', err);
      hasRestoredRef.current = true;
    }
  }, [id, product]);

  // Note: L'ÉTAPE 2 n'est plus nécessaire car on restaure tout dans l'ÉTAPE 1

  // ÉTAPE 1.5: Charger le draft depuis la base de données
  useEffect(() => {
    const loadDraftFromDatabase = async () => {
      if (!id || !product || !hasRestoredRef.current) return;

      try {
        console.log('🔍 [Customization] Recherche draft en base de données...');
        const draft = await customizationService.getProductDraft(Number(id));

        if (draft) {
          console.log('📦 [Customization] Draft trouvé en BDD:', {
            id: draft.id,
            elementsCount: draft.designElements?.length || 0,
            colorVariationId: draft.colorVariationId,
            viewId: draft.viewId
          });

          // Sauvegarder l'ID pour les mises à jour futures
          currentCustomizationIdRef.current = draft.id;

          // Si le localStorage est vide mais qu'on a un draft en BDD, le restaurer
          const storageKey = `design-data-product-${id}`;
          const localData = localStorage.getItem(storageKey);

          if (!localData || JSON.parse(localData).elementsByView === undefined) {
            console.log('💾 [Customization] Restauration depuis BDD vers localStorage');

            // Reconstruire le format elementsByView depuis le draft
            const viewKey = `${draft.colorVariationId}-${draft.viewId}`;
            let elementsToRestore = draft.designElements || [];

            // 🔍 DEBUG: Vérifier la structure des éléments restaurés
            console.log('🔍 DEBUG - Éléments depuis BDD:', {
              isArray: Array.isArray(elementsToRestore),
              length: elementsToRestore.length,
              firstIsArray: elementsToRestore.length > 0 ? Array.isArray(elementsToRestore[0]) : false
            });

            // 🚨 Corriger le double wrapping si détecté dans les données BDD
            if (elementsToRestore.length > 0 && Array.isArray(elementsToRestore[0])) {
              console.warn('⚠️ Correction du double wrapping détecté dans BDD');
              // Déballer le premier niveau si c'est un array imbriqué
              elementsToRestore = elementsToRestore[0];
            }

            const restoredElements = {
              [viewKey]: elementsToRestore
            };

            isRestoringRef.current = true;
            setDesignElementsByView(restoredElements);

            // Mettre à jour le localStorage
            localStorage.setItem(storageKey, JSON.stringify({
              elementsByView: restoredElements,
              colorVariationId: draft.colorVariationId,
              viewId: draft.viewId,
              timestamp: Date.now()
            }));

            setTimeout(() => {
              isRestoringRef.current = false;
            }, 500);
          }

          setLastSyncTime(new Date(draft.updatedAt));
        } else {
          console.log('ℹ️ [Customization] Aucun draft trouvé en BDD');
        }
      } catch (error) {
        console.error('❌ [Customization] Erreur chargement draft BDD:', error);
      }
    };

    loadDraftFromDatabase();
  }, [id, product, hasRestoredRef.current]);

  // Fonction pour sauvegarder en base de données
  const saveToDatabase = useCallback(async () => {
    if (!id || !product || !selectedColorVariation || !selectedView) {
      console.log('⏸️ [Customization] saveToDatabase ignoré - données manquantes');
      return;
    }

    const viewKey = `${selectedColorVariation.id}-${selectedView.id}`;

    // Utiliser la ref pour obtenir la valeur actuelle (évite stale closure)
    const elementsToSave = designElementsByViewRef.current;
    const currentElements = elementsToSave[viewKey] || [];

    // Validation: Ne pas sauvegarder si aucun élément et pas de customization existante
    if (currentElements.length === 0 && !currentCustomizationIdRef.current) {
      console.log('⏸️ [Customization] Aucun élément à sauvegarder');
      return;
    }

    // Validation supplémentaire des éléments
    if (currentElements.length > 0) {
      const hasInvalidElements = currentElements.some(el => !el.id || !el.type);
      if (hasInvalidElements) {
        console.error('❌ [Customization] Éléments invalides détectés:', currentElements);
        return;
      }
    }

    // 🔧 Nettoyer les Data URLs avant envoi en BDD (trop volumineuses)
    const cleanedElements = currentElements.map(element => {
      if (element.type === 'image' && element.imageUrl?.startsWith('data:')) {
        console.warn('⚠️ [Customization] Data URL détectée, conversion nécessaire pour:', element.id);
        // Pour les images uploadées, on garde un placeholder
        // Le backend devra gérer l'upload séparé de l'image
        return {
          ...element,
          imageUrl: element.imageUrl.substring(0, 100) + '...', // Tronquer pour éviter l'erreur
          _isDataUrl: true, // Marquer pour traitement spécial
        };
      }
      return element;
    });

    try {
      setIsSyncing(true);
      setSyncError(null);

      const customizationData = {
        productId: product.id,
        colorVariationId: selectedColorVariation.id,
        viewId: selectedView.id,
        designElements: cleanedElements,
        sessionId: customizationService.getOrCreateSessionId(),
      };

      // 🔍 DEBUG: Vérifier la structure avant envoi
      console.log('☁️ [Customization] Auto-sauvegarde BDD:', {
        viewKey,
        elementsCount: cleanedElements.length,
        isArray: Array.isArray(cleanedElements),
        firstIsArray: cleanedElements.length > 0 ? Array.isArray(cleanedElements[0]) : false,
        elements: cleanedElements.map(el => ({
          id: el?.id,
          type: el?.type,
          isArray: Array.isArray(el),
          hasDataUrl: el?._isDataUrl || false
        }))
      });

      // 🚨 Bloquer si double wrapping détecté
      if (cleanedElements.length > 0 && Array.isArray(cleanedElements[0])) {
        console.error('🚨 BUG BLOQUÉ: Tentative d\'envoi de données corrompues (array imbriqué)');
        setIsSyncing(false);
        return;
      }

      const result = await customizationService.saveCustomization(customizationData);
      currentCustomizationIdRef.current = result.id;
      setLastSyncTime(new Date());

      console.log('✅ [Customization] Sauvegardé en BDD, ID:', result.id);
    } catch (error: any) {
      console.error('❌ [Customization] Erreur auto-save BDD:', error);
      setSyncError(error.message || 'Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }, [id, product, selectedColorVariation, selectedView]);

  // Debounce la sauvegarde en BDD (3 secondes)
  const debouncedSaveToDatabase = useMemo(
    () => debounce(() => {
      saveToDatabase();
    }, 3000),
    [saveToDatabase]
  );

  // Callback quand les éléments changent dans l'éditeur
  const handleElementsChange = useCallback((newElements: any[]) => {
    const viewKey = getCurrentViewKey();
    if (!viewKey) {
      console.log('⚠️ [Customization] Pas de vue sélectionnée, ignoré');
      return;
    }

    // 🔍 DEBUG: Vérifier la structure des éléments reçus
    console.log('🔄 [Customization] Éléments changés pour la vue:', viewKey);
    console.log('🔍 DEBUG - newElements:', {
      isArray: Array.isArray(newElements),
      length: newElements.length,
      firstElementType: newElements.length > 0 ? typeof newElements[0] : 'N/A',
      firstIsArray: newElements.length > 0 ? Array.isArray(newElements[0]) : false,
      firstElement: newElements.length > 0 ? newElements[0] : null
    });

    // 🚨 Détecter le double wrapping
    if (newElements.length > 0 && Array.isArray(newElements[0])) {
      console.error('🚨 BUG DÉTECTÉ: newElements est un array imbriqué!', newElements);
      // Ne pas sauvegarder des données corrompues
      return;
    }

    console.log('🔄 [Customization] isRestoring:', isRestoringRef.current);

    // Ne pas écraser les éléments si on est en train de restaurer
    if (isRestoringRef.current) {
      console.log('⏸️ [Customization] Ignoré car en cours de restauration');
      return;
    }

    // Mettre à jour uniquement les éléments de la vue actuelle
    setDesignElementsByView(prev => ({
      ...prev,
      [viewKey]: newElements
    }));
  }, [selectedColorVariation, selectedView]);

  // 🔧 Fonction pour nettoyer les Data URLs des éléments avant sauvegarde localStorage
  const cleanElementsForStorage = (elementsByView: Record<string, any[]>) => {
    const cleaned: Record<string, any[]> = {};

    Object.entries(elementsByView).forEach(([viewKey, elements]) => {
      cleaned[viewKey] = elements.map(element => {
        // Si c'est une image avec une Data URL, ne pas la stocker (trop volumineuse)
        if (element.type === 'image' && element.imageUrl?.startsWith('data:')) {
          return {
            ...element,
            imageUrl: undefined, // Supprimer la Data URL
            _hasDataUrl: true, // Marquer qu'il y avait une Data URL
          };
        }
        return element;
      });
    });

    return cleaned;
  };

  // Sauvegarder automatiquement dans localStorage à chaque modification
  useEffect(() => {
    if (!id) return;

    console.log('📝 [Customization] useEffect sauvegarde déclenché:', {
      viewsCount: Object.keys(designElementsByView).length,
      isRestoring: isRestoringRef.current,
      hasRestored: hasRestoredRef.current,
      colorId: selectedColorVariation?.id,
      viewId: selectedView?.id
    });

    // Ne pas sauvegarder si on est en train de restaurer
    if (isRestoringRef.current) {
      console.log('⏸️ [Customization] Sauvegarde ignorée (restauration en cours)');
      return;
    }

    // Ne pas sauvegarder tant que la restauration initiale n'est pas complète
    if (!hasRestoredRef.current) {
      console.log('⏸️ [Customization] Sauvegarde ignorée (restauration non terminée)');
      return;
    }

    // 🔧 Nettoyer les Data URLs avant sauvegarde pour éviter QuotaExceededError
    const cleanedElements = cleanElementsForStorage(designElementsByView);

    // Sauvegarder tous les éléments par vue (sans les Data URLs)
    const storageKey = `design-data-product-${id}`;
    const dataToSave = {
      elementsByView: cleanedElements,
      colorVariationId: selectedColorVariation?.id,
      viewId: selectedView?.id,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log('💾 Auto-sauvegarde localStorage réussie (Data URLs exclues)');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('❌ Quota localStorage dépassé, nettoyage et réessai...');
        // Nettoyer les anciennes sauvegardes si quota dépassé
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('design-data-product-') && key !== storageKey) {
            localStorage.removeItem(key);
            console.log('🧹 Supprimé:', key);
          }
        });
        // Réessayer
        try {
          localStorage.setItem(storageKey, JSON.stringify(dataToSave));
          console.log('✅ Sauvegarde réussie après nettoyage');
        } catch (retryError) {
          console.error('❌ Impossible de sauvegarder même après nettoyage:', retryError);
        }
      } else {
        console.error('❌ Erreur sauvegarde localStorage:', error);
      }
    }

    // Déclencher aussi la sauvegarde en base de données (debounced)
    // La fonction utilise designElementsByViewRef pour avoir les données à jour
    debouncedSaveToDatabase();
  }, [designElementsByView, selectedColorVariation, selectedView, id, debouncedSaveToDatabase]);

  // Gérer le plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast({
          title: 'Mode plein écran activé',
          description: 'Appuyez sur Échap pour quitter'
        });
      }).catch((err) => {
        console.error('Erreur plein écran:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'activer le plein écran',
          variant: 'destructive'
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Écouter les changements de plein écran (Échap par exemple)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sauvegarder manuellement
  const handleSave = async () => {
    if (!id || !product || !selectedColorVariation || !selectedView) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une couleur et une vue',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      // Utiliser la ref pour obtenir les données actuelles
      const viewKey = `${selectedColorVariation.id}-${selectedView.id}`;
      const currentElements = designElementsByViewRef.current[viewKey] || [];

      // Validation des éléments
      if (currentElements.length === 0) {
        toast({
          title: 'Aucun élément',
          description: 'Ajoutez des éléments avant de sauvegarder',
          variant: 'default'
        });
        setIsSyncing(false);
        return;
      }

      // Vérifier la validité des éléments
      const invalidElements = currentElements.filter(el => !el.id || !el.type);
      if (invalidElements.length > 0) {
        console.error('❌ Éléments invalides:', invalidElements);
        toast({
          title: 'Erreur de données',
          description: 'Certains éléments sont invalides',
          variant: 'destructive'
        });
        setIsSyncing(false);
        return;
      }

      // Sauvegarder dans localStorage (backup)
      const storageKey = `design-data-product-${id}`;
      const dataToSave = {
        elementsByView: designElementsByViewRef.current,
        colorVariationId: selectedColorVariation.id,
        viewId: selectedView.id,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));

      // Sauvegarder dans le backend pour la vue actuelle
      const customizationData = {
        productId: product.id,
        colorVariationId: selectedColorVariation.id,
        viewId: selectedView.id,
        designElements: currentElements,
        sessionId: customizationService.getOrCreateSessionId(),
      };

      console.log('💾 [Customization] Sauvegarde manuelle:', {
        viewKey,
        elementsCount: currentElements.length,
        elements: currentElements.map(el => ({ id: el.id, type: el.type }))
      });

      const result = await customizationService.saveCustomization(customizationData);
      currentCustomizationIdRef.current = result.id;
      setLastSyncTime(new Date());

      console.log('✅ Personnalisation sauvegardée:', result);

      toast({
        title: '✅ Sauvegardé',
        description: `${currentElements.length} élément(s) sauvegardé(s) en base de données (ID: ${result.id})`,
        duration: 3000
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      setSyncError(error.message || 'Erreur de sauvegarde');
      toast({
        title: 'Erreur de sauvegarde',
        description: 'Impossible de sauvegarder sur le serveur. Les données sont sauvegardées localement.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Charger les designs vendeur
  const loadVendorDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const result = await designService.getPublicDesigns({
        limit: 50
      });
      setVendorDesigns(result.designs || []);
      setShowDesignLibrary(true);
    } catch (err) {
      console.error('Erreur chargement designs:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les designs',
        variant: 'destructive'
      });
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Charger les catégories depuis l'API
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categories = await categoryService.getAllCategories();
      setApiCategories(categories);

      console.log('📂 [Categories] Catégories chargées:', {
        total: categories.length,
        categories: categories.map((c: any) => ({ id: c.id, name: c.name, subCategoriesCount: c.subCategories?.length || 0 }))
      });
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      // Ne pas afficher d'erreur à l'utilisateur, continuer avec les catégories extraites des produits
    } finally {
      setLoadingCategories(false);
    }
  };

  // Charger les produits disponibles
  const loadAvailableProducts = async () => {
    try {
      setLoadingProducts(true);

      // 🔧 IMPORTANT: Charger les catégories AVANT les produits pour pouvoir enrichir
      let categories = apiCategories;
      if (categories.length === 0) {
        console.log('📂 [ProductLibrary] Chargement des catégories...');
        try {
          categories = await categoryService.getAllCategories();
          setApiCategories(categories);
          console.log('📂 [ProductLibrary] Catégories chargées:', categories.length);
        } catch (err) {
          console.error('❌ Erreur chargement catégories:', err);
        }
      }

      const result = await adminProductsService.getAllProducts();

      // Filtrer les produits avec au moins une variation de couleur et une image
      let validProducts = result.data.filter((p: AdminProduct) =>
        p.colorVariations &&
        p.colorVariations.length > 0 &&
        p.colorVariations[0].images &&
        p.colorVariations[0].images.length > 0
      );

      // 🆕 Enrichir les produits avec les infos de catégories
      if (categories.length > 0) {
        validProducts = validProducts.map((product: any) => {
          // Trouver la catégorie correspondante
          const category = categories.find((cat: any) => cat.id === product.categoryId);

          const enrichedProduct = {
            ...product,
            category: category ? {
              id: category.id,
              name: category.name,
              slug: category.slug
            } : product.category
          };

          console.log(`📦 [Enrich] ${product.name}:`, {
            categoryId: product.categoryId,
            foundCategory: category?.name,
            subCategory: product.subCategory?.name
          });

          return enrichedProduct;
        });

        console.log('✅ [ProductLibrary] Produits enrichis:', {
          productsWithCategory: validProducts.filter(p => p.category).length,
          total: validProducts.length
        });
      }

      setAvailableProducts(validProducts);
      setShowProductLibrary(true);

      console.log('🛍️ [ProductLibrary] Produits chargés:', {
        total: result.data.length,
        valid: validProducts.length,
        sample: validProducts.slice(0, 2).map(p => ({
          name: p.name,
          category: p.category?.name,
          subCategory: p.subCategory?.name
        }))
      });
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive'
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Gérer l'image générée par l'IA
  const handleAIImageGenerated = (imageUrl: string, description: string) => {
    console.log('🤖 [Customization] Image IA générée:', description);

    // Ajouter l'image générée à l'éditeur de design
    if (editorRef.current) {
      // Créer un objet de design pour l'image IA
      const aiDesign = {
        id: `ai-${Date.now()}`,
        name: description,
        imageUrl: imageUrl,
        price: 0, // Gratuit car généré par l'utilisateur
        isAI: true,
        description: description
      };

      // Utiliser la méthode addVendorDesign pour ajouter l'image IA
      editorRef.current.addVendorDesign(aiDesign);

      toast({
        title: '✅ Image IA ajoutée',
        description: 'Votre image générée par IA a été ajoutée au design',
        duration: 3000
      });
    }
  };

  // Gérer l'image uploadée par l'utilisateur
  const handleImageUpload = async (file: File, imageUrl: string) => {
    console.log('📤 [Customization] Image uploadée:', file.name);

    try {
      // 🆕 Upload immédiatement au serveur pour conservation
      toast({
        title: '⏳ Upload en cours...',
        description: `Upload de ${file.name} vers le serveur`,
        duration: 2000
      });

      const uploadResult = await customizationService.uploadImage(file);
      console.log('✅ [Customization] Image uploadée au serveur:', uploadResult.url);

      // Ajouter l'image uploadée à l'éditeur avec l'URL du serveur
      if (editorRef.current) {
        const uploadedDesign = {
          id: `upload-${Date.now()}`,
          name: file.name,
          imageUrl: uploadResult.url, // ✅ Utiliser l'URL du serveur
          price: 0, // Gratuit car uploadé par l'utilisateur
          isUpload: true,
          description: `Image uploadée: ${file.name}`,
          cloudinaryPublicId: uploadResult.publicId // Pour suppression éventuelle
        };

        // Utiliser la méthode addVendorDesign pour ajouter l'image uploadée
        editorRef.current.addVendorDesign(uploadedDesign);

        toast({
          title: '✅ Image ajoutée',
          description: `${file.name} a été ajoutée au design`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('❌ [Customization] Erreur upload image:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'uploader l\'image. Veuillez réessayer.',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  // Gérer le changement de produit avec conservation et adaptation des personnalisations
  const handleProductChange = (newProduct: AdminProduct) => {
    console.log('🔄 [ProductChange] Changement de produit:', {
      from: product?.id,
      to: newProduct.id,
      currentCustomizations: Object.keys(designElementsByViewRef.current).length
    });

    // 1️⃣ Récupérer les personnalisations actuelles
    const currentElements = designElementsByViewRef.current;
    const currentViewKey = getCurrentViewKey();

    if (!currentViewKey || !currentElements[currentViewKey] || currentElements[currentViewKey].length === 0) {
      console.log('⚠️ [ProductChange] Aucune personnalisation à transférer');
      // Naviguer vers le nouveau produit sans transfert
      navigate(`/product/${newProduct.id}/customize`);
      setShowProductLibrary(false);
      toast({
        title: '✅ Produit changé',
        description: `Vous personnalisez maintenant: ${newProduct.name}`,
        duration: 3000
      });
      return;
    }

    const elementsToTransfer = currentElements[currentViewKey];
    console.log('📦 [ProductChange] Éléments à transférer:', {
      count: elementsToTransfer.length,
      elements: elementsToTransfer.map(e => ({ type: e.type, id: e.id }))
    });

    // 2️⃣ Préparer les délimitations source et cible
    const sourceDelimitation = (selectedView as any)?.delimitations?.[0];
    const targetFirstColor = newProduct.colorVariations?.[0];
    const targetFirstView = targetFirstColor?.images?.[0];
    const targetDelimitation = (targetFirstView as any)?.delimitations?.[0];

    if (!sourceDelimitation || !targetDelimitation) {
      console.warn('⚠️ [ProductChange] Délimitations manquantes');
      navigate(`/product/${newProduct.id}/customize`);
      setShowProductLibrary(false);
      return;
    }

    // Obtenir les dimensions de référence (taille du canvas)
    const sourceReferenceWidth = sourceDelimitation.referenceWidth || 800;
    const sourceReferenceHeight = sourceDelimitation.referenceHeight || 800;
    const targetReferenceWidth = targetDelimitation.referenceWidth || 800;
    const targetReferenceHeight = targetDelimitation.referenceHeight || 800;

    console.log('📐 [ProductChange] Délimitations et canvas:', {
      source: {
        canvas: { width: sourceReferenceWidth, height: sourceReferenceHeight },
        delim: {
          x: sourceDelimitation.x,
          y: sourceDelimitation.y,
          width: sourceDelimitation.width,
          height: sourceDelimitation.height
        }
      },
      target: {
        canvas: { width: targetReferenceWidth, height: targetReferenceHeight },
        delim: {
          x: targetDelimitation.x,
          y: targetDelimitation.y,
          width: targetDelimitation.width,
          height: targetDelimitation.height
        }
      }
    });

    // 3️⃣ Adapter intelligemment les éléments aux nouvelles délimitations
    // Calculer le ratio de taille entre les délimitations
    const widthRatio = targetDelimitation.width / sourceDelimitation.width;
    const heightRatio = targetDelimitation.height / sourceDelimitation.height;

    // Utiliser le plus petit ratio pour que tout rentre dans la nouvelle délimitation
    const scaleRatio = Math.min(widthRatio, heightRatio);

    console.log('📊 [ProductChange] Ratios de délimitation:', {
      source: { width: sourceDelimitation.width, height: sourceDelimitation.height },
      target: { width: targetDelimitation.width, height: targetDelimitation.height },
      widthRatio: widthRatio.toFixed(2),
      heightRatio: heightRatio.toFixed(2),
      scaleRatio: scaleRatio.toFixed(2),
      adaptation: scaleRatio < 1 ? 'Réduction' : scaleRatio > 1 ? 'Agrandissement' : 'Aucune'
    });

    const adaptedElements = elementsToTransfer.map(element => {
      let adaptedElement = { ...element };

      // 🎯 ÉTAPE 1: Convertir les positions de "pourcentage du canvas" vers "position relative dans la délimitation"
      // Les positions x, y sont stockées comme: (delimX + posRelative * delimWidth) / canvasWidth
      // On doit retrouver posRelative

      // Position absolue en pixels dans le canvas source
      const absXInSourceCanvas = element.x * sourceReferenceWidth;
      const absYInSourceCanvas = element.y * sourceReferenceHeight;

      // Position relative dans la délimitation source (0-1)
      const relXInSourceDelim = (absXInSourceCanvas - sourceDelimitation.x) / sourceDelimitation.width;
      const relYInSourceDelim = (absYInSourceCanvas - sourceDelimitation.y) / sourceDelimitation.height;

      console.log(`🔄 Élément ${element.id}:`, {
        sourceCanvas: { x: element.x, y: element.y },
        sourceAbsolute: { x: absXInSourceCanvas, y: absYInSourceCanvas },
        sourceRelative: { x: relXInSourceDelim.toFixed(3), y: relYInSourceDelim.toFixed(3) }
      });

      // 🎯 ÉTAPE 2: Adapter les dimensions avec le scaleRatio
      if (element.width !== undefined) {
        adaptedElement.width = element.width * scaleRatio;
      }
      if (element.height !== undefined) {
        adaptedElement.height = element.height * scaleRatio;
      }
      if (element.scale !== undefined) {
        adaptedElement.scale = element.scale * scaleRatio;
      }
      if (element.type === 'text' && element.fontSize) {
        adaptedElement.fontSize = Math.round(element.fontSize * scaleRatio);
        adaptedElement.fontSize = Math.max(adaptedElement.fontSize, 10);
      }

      // 🎯 ÉTAPE 3: Reconvertir vers "pourcentage du canvas cible"
      // Position absolue dans le canvas cible
      const absXInTargetCanvas = targetDelimitation.x + (relXInSourceDelim * targetDelimitation.width);
      const absYInTargetCanvas = targetDelimitation.y + (relYInSourceDelim * targetDelimitation.height);

      // Position en pourcentage du canvas cible
      adaptedElement.x = absXInTargetCanvas / targetReferenceWidth;
      adaptedElement.y = absYInTargetCanvas / targetReferenceHeight;

      console.log(`✨ Adaptation complète:`, {
        targetAbsolute: { x: absXInTargetCanvas, y: absYInTargetCanvas },
        targetCanvas: { x: adaptedElement.x.toFixed(3), y: adaptedElement.y.toFixed(3) }
      });

      // La rotation reste inchangée

      return adaptedElement;
    });

    console.log('✨ [ProductChange] Éléments adaptés intelligemment:', {
      count: adaptedElements.length,
      scaleRatio: scaleRatio.toFixed(2),
      elements: adaptedElements.map(e => ({
        type: e.type,
        id: e.id,
        x: e.x,
        y: e.y,
        originalWidth: elementsToTransfer.find(el => el.id === e.id)?.width,
        adaptedWidth: e.width,
        originalScale: elementsToTransfer.find(el => el.id === e.id)?.scale,
        adaptedScale: e.scale
      }))
    });

    // 4️⃣ Créer la nouvelle structure de données pour le nouveau produit
    const newViewKey = `${targetFirstColor.id}-${targetFirstView.id}`;
    const newElementsByView = {
      [newViewKey]: adaptedElements
    };

    // 5️⃣ Sauvegarder dans localStorage pour le NOUVEAU produit
    const storageKey = `design-data-product-${newProduct.id}`;
    const dataToSave = {
      elementsByView: newElementsByView,
      colorVariationId: targetFirstColor.id,
      viewId: targetFirstView.id,
      timestamp: Date.now(),
      transferredFrom: product?.id // Pour traçabilité
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));

    console.log('💾 [ProductChange] Personnalisations transférées et sauvegardées:', {
      newProductId: newProduct.id,
      viewKey: newViewKey,
      elementsCount: adaptedElements.length,
      storageKey
    });

    // 6️⃣ Naviguer vers le nouveau produit
    navigate(`/product/${newProduct.id}/customize`);

    // 7️⃣ Afficher un message de succès avec info sur l'adaptation
    const adaptationMessage = scaleRatio < 1
      ? `Éléments réduits de ${Math.round((1 - scaleRatio) * 100)}% pour s'adapter`
      : scaleRatio > 1
      ? `Éléments agrandis de ${Math.round((scaleRatio - 1) * 100)}% pour s'adapter`
      : 'Éléments transférés sans modification';

    toast({
      title: '✅ Personnalisation transférée',
      description: `${adaptedElements.length} élément(s) - ${adaptationMessage}`,
      duration: 4000
    });

    // 8️⃣ Fermer le modal
    setShowProductLibrary(false);
  };

  // Ouvrir le modal de sélection
  const handleOpenSizeModal = () => {
    // Le client peut acheter sans personnalisation
    setShowSizeModal(true);
  };

  // 🆕 Fonction pour uploader une image Data URL vers le serveur
  const uploadDataUrlImage = async (dataUrl: string, filename: string): Promise<string> => {
    try {
      console.log('📤 [Upload] Conversion Data URL vers serveur:', { filename });

      // Convertir Data URL en Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Créer un fichier à partir du Blob
      const file = new File([blob], filename, { type: blob.type });

      // Upload vers le serveur en utilisant le service
      const uploadResult = await customizationService.uploadImage(file);

      console.log('✅ [Upload] Image uploadée avec succès:', uploadResult.url);
      return uploadResult.url;
    } catch (error) {
      console.error('❌ [Upload] Erreur upload image:', error);
      // En cas d'erreur, on retourne la Data URL (fallback)
      console.warn('⚠️ [Upload] Utilisation de la Data URL comme fallback');
      return dataUrl;
    }
  };

  // 🆕 Fonction pour traiter les éléments et uploader les images Data URL (fallback)
  // Note: Normalement les images sont déjà uploadées dans handleImageUpload,
  // mais cette fonction gère les cas où une Data URL persisterait
  const processElementsForUpload = async (elements: any[]): Promise<any[]> => {
    const processedElements = [];

    for (const element of elements) {
      if (element.type === 'image' && element.imageUrl?.startsWith('data:')) {
        // Cet élément contient encore une Data URL (cas rare), on doit l'uploader
        const filename = element.designName || `upload-${Date.now()}.png`;
        console.warn('⚠️ [Upload] Data URL détectée (devrait être déjà uploadée):', filename);

        try {
          const serverUrl = await uploadDataUrlImage(element.imageUrl, filename);
          processedElements.push({
            ...element,
            imageUrl: serverUrl,
            _wasDataUrl: true // Marquer que c'était une Data URL
          });
        } catch (error) {
          console.error('❌ [Upload] Échec upload, conservation Data URL:', error);
          processedElements.push(element);
        }
      } else {
        // Élément normal, pas de traitement
        processedElements.push(element);
      }
    }

    return processedElements;
  };

  const handleAddToCart = async (selections: Array<{ size: string; sizeId?: number; quantity: number }>) => {
    if (!id || !product) return;

    try {
      console.log('🛒 [Customization] Ajout au panier avec sélections:', selections);

      // 🔧 NOUVEAU: Sauvegarder SEULEMENT les vues de la couleur sélectionnée
      // Utiliser la ref pour obtenir les données actuelles
      const currentElementsByView = designElementsByViewRef.current;

      // 🔧 Filtrer pour ne garder que les vues de la couleur actuelle
      const viewsWithElements = Object.entries(currentElementsByView).filter(
        ([viewKey, elements]) => {
          const [colorId] = viewKey.split('-').map(Number);
          // Ne garder que les vues de la couleur sélectionnée qui ont des éléments
          return colorId === selectedColorVariation.id && elements.length > 0;
        }
      );

      console.log('📦 [Customization] Vues avec éléments (couleur actuelle uniquement):', {
        selectedColorId: selectedColorVariation.id,
        selectedColorName: selectedColorVariation.name,
        totalViews: Object.keys(currentElementsByView).length,
        viewsWithElements: viewsWithElements.length,
        views: viewsWithElements.map(([key, elements]) => ({
          viewKey: key,
          elementsCount: elements.length
        }))
      });

      // Si aucune vue n'a d'éléments, afficher un avertissement
      if (viewsWithElements.length === 0) {
        console.warn('⚠️ [Customization] Aucune personnalisation détectée');
        toast({
          title: '⚠️ Aucune personnalisation',
          description: 'Vous pouvez quand même ajouter le produit au panier',
          variant: 'default'
        });
      }

      // Sauvegarder chaque vue personnalisée en base de données
      const customizationIds: Record<string, number> = {};
      const designElementsByViewKey: Record<string, any[]> = {}; // 🆕 Organiser par vue

      for (const [viewKey, elements] of viewsWithElements) {
        // Parser la clé pour obtenir colorVariationId et viewId
        const [colorIdStr, viewIdStr] = viewKey.split('-');
        const colorId = parseInt(colorIdStr);
        const viewId = parseInt(viewIdStr);

        console.log(`💾 [Customization] Sauvegarde vue ${viewKey}:`, {
          colorId,
          viewId,
          elementsCount: elements.length
        });

        // 🆕 Traiter les éléments pour uploader les images Data URL
        const processedElements = await processElementsForUpload(elements);

        const customizationData = {
          productId: product.id,
          colorVariationId: colorId,
          viewId: viewId,
          designElements: processedElements, // Utiliser les éléments traités
          sizeSelections: selections,
          sessionId: customizationService.getOrCreateSessionId(),
        };

        try {
          const result = await customizationService.saveCustomization(customizationData);
          customizationIds[viewKey] = result.id;

          // 🆕 Stocker les éléments traités organisés par vue
          designElementsByViewKey[viewKey] = processedElements;

          console.log(`✅ [Customization] Vue ${viewKey} sauvegardée avec ID:`, result.id);
        } catch (error) {
          console.error(`❌ [Customization] Erreur sauvegarde vue ${viewKey}:`, error);
          // Continuer avec les autres vues
        }
      }

      console.log('✅ [Customization] Toutes les personnalisations sauvegardées:', customizationIds);

      // Sauvegarder les IDs dans localStorage pour référence
      localStorage.setItem(`customization-${product.id}`, JSON.stringify({
        customizationIds: customizationIds,
        selections: selections,
        timestamp: Date.now()
      }));

      // Obtenir les délimitations et infos de toutes les vues
      const allDelimitations: any[] = [];
      const viewImages: Record<number, string> = {}; // 🆕 URLs des images par viewId
      if (selectedColorVariation?.images) {
        selectedColorVariation.images.forEach((img: any) => {
          // Stocker l'URL de l'image pour cette vue
          viewImages[img.id] = img.url;

          if (img.delimitations) {
            allDelimitations.push(...img.delimitations.map((d: any) => ({
              ...d,
              viewId: img.id,
              viewType: img.viewType,
              imageUrl: img.url // 🆕 Ajouter l'URL de l'image
            })));
          }
        });
      }

      console.log('🔍 [Customization] Toutes les délimitations collectées:', {
        count: allDelimitations.length,
        delimitations: allDelimitations
      });

      // 🆕 NOUVEAU: Créer un article séparé pour CHAQUE taille sélectionnée
      const validSelections = selections.filter(s => s.quantity > 0);
      const totalItemsAdded = selections.reduce((sum, s) => sum + s.quantity, 0);

      if (validSelections.length > 0) {
        console.log('🛒 [Customization] Création d\'articles séparés pour chaque taille:', validSelections);

        // Créer un article pour chaque taille sélectionnée
        for (const sizeSelection of validSelections) {
          // Utiliser le prix spécifique à cette taille (produit + designs)
          const sizeTotalPrice = getTotalPriceForSize(sizeSelection.size);

          const cartItem = {
            id: `${product.id}-${selectedColorVariation?.name || 'default'}-${sizeSelection.size}`,
            productId: product.id,
            name: product.name,
            price: sizeTotalPrice,  // Utiliser le prix total pour cette taille (produit + designs)
            suggestedPrice: sizeTotalPrice,  // Utiliser le prix total pour cette taille (produit + designs)
            color: selectedColorVariation?.name || 'Défaut',
            colorCode: selectedColorVariation?.colorCode || '#000000',
            colorVariationId: selectedColorVariation?.id, // 🆕 ID de la couleur sélectionnée
            size: sizeSelection.size,
            sizeId: sizeSelection.sizeId,
            quantity: sizeSelection.quantity, // Quantité pour cette taille spécifique
            imageUrl: selectedView?.url || selectedColorVariation?.images?.[0]?.url || '',
            // 🔧 Stocker tous les IDs de personnalisation (maintenant filtrés par couleur)
            customizationIds: customizationIds,
            // Pour compatibilité, stocker aussi le premier ID comme customizationId
            customizationId: Object.values(customizationIds)[0] || undefined,
            // 🆕 Stocker les éléments organisés par vue (partagés entre toutes les tailles)
            designElementsByView: designElementsByViewKey,
            // Stocker toutes les délimitations (partagées entre toutes les tailles)
            delimitations: allDelimitations
          };

          console.log(`🛒 [Customization] Ajout article taille ${sizeSelection.size}:`, {
            size: sizeSelection.size,
            quantity: sizeSelection.quantity,
            price: sizeTotalPrice,
            customizationIds: customizationIds,
            designElementsByView: Object.keys(designElementsByViewKey),
            totalDelimitations: allDelimitations.length
          });

          addToCart(cartItem);
        }
      }

      console.log('🛒 [Customization] Articles ajoutés au panier:', {
        totalItemsAdded,
        sizesCount: validSelections.length,
        customizationIds: customizationIds,
        designElementsByView: Object.keys(designElementsByViewKey),
        viewsCount: viewsWithElements.length
      });

      toast({
        title: '✅ Ajouté au panier',
        description: `${totalItemsAdded} article(s) en ${validSelections.length} taille(s) avec ${viewsWithElements.length} vue(s) personnalisée(s)`,
      });

      // Fermer le modal
      setShowSizeModal(false);

      // Ouvrir automatiquement le drawer du panier
      setTimeout(() => {
        openCart();
      }, 300);

    } catch (error) {
      console.error('❌ [Customization] Erreur ajout au panier:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter au panier',
        variant: 'destructive'
      });
    }
  };

  // Fonction pour gérer la sélection d'un design pour sticker
  const handleStickerDesignSelected = (design: any) => {
    console.log('🎨 [Sticker] Design sélectionné:', { design: design.name, type: stickerType });

    // Stocker le design sélectionné
    setSelectedStickerDesign(design);

    // Fermer le modal de sélection de design
    setShowStickerSelection(false);

    toast({
      title: '✅ Design sélectionné',
      description: `${design.name} a été ajouté à votre sticker`,
      duration: 2000
    });
  };

  // Fonction pour ajouter le sticker au panier
  const handleAddStickerToCart = () => {
    try {
      if (!stickerType || !selectedStickerDesign) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un design pour votre sticker',
          variant: 'destructive'
        });
        return;
      }

      // Créer un produit sticker pour le panier
      const stickerPrice = stickerType === 'autocollant' ? 2.99 : 6.99;
      const designPrice = selectedStickerDesign.price || 0;
      const totalPrice = (stickerPrice + designPrice) * 655.96; // Convertir en FCFA

      const stickerProduct = {
        id: `sticker-${stickerType}-${selectedStickerDesign.id}-${Date.now()}`,
        productId: `sticker-${stickerType}`,
        name: `Sticker ${stickerType === 'autocollant' ? 'Autocollant' : 'Pare-chocs'} - ${selectedStickerDesign.name}`,
        price: Math.round(totalPrice),
        suggestedPrice: Math.round(totalPrice),
        color: 'Standard',
        colorCode: '#FFFFFF',
        size: stickerSize,
        quantity: 1,
        imageUrl: selectedStickerDesign.imageUrl || selectedStickerDesign.thumbnailUrl,
        // Métadonnées du sticker
        isSticker: true,
        stickerType: stickerType,
        stickerSurface: stickerSurface,
        stickerBorderColor: stickerBorderColor,
        stickerSize: stickerSize,
        designId: selectedStickerDesign.id,
        designName: selectedStickerDesign.name,
        designPrice: designPrice,
      };

      console.log('🛒 [Sticker] Ajout sticker au panier:', stickerProduct);

      // Ajouter au panier
      addToCart(stickerProduct);

      toast({
        title: '✅ Sticker ajouté au panier',
        description: `${stickerProduct.name} a été ajouté à votre panier`,
        duration: 3000
      });

      // Réinitialiser l'état du sticker
      setStickerType(null);
      setSelectedStickerDesign(null);
      setStickerBorderColor('transparent');
      setStickerSurface('blanc-mat');
      setStickerSize('83 mm x 100 mm');

      // Ouvrir le panier après un court délai
      setTimeout(() => {
        openCart();
      }, 300);
    } catch (error) {
      console.error('❌ [Sticker] Erreur ajout au panier:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le sticker au panier',
        variant: 'destructive'
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Produit introuvable'}</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const delimitation = selectedView?.delimitations?.[0];

  // Extraire les catégories pour les designs
  const categories = Array.from(
    new Set(vendorDesigns.map(d => d.category?.name).filter(Boolean))
  ).sort();

  const filteredDesigns = vendorDesigns.filter(design => {
    const matchSearch = design.name.toLowerCase().includes(designSearch.toLowerCase()) ||
                       design.creator?.shopName?.toLowerCase().includes(designSearch.toLowerCase());
    const matchCategory = !selectedCategory || design.category?.name === selectedCategory;
    const matchFreeOnly = !showFreeOnly || design.price === 0;
    return matchSearch && matchCategory && matchFreeOnly;
  });

  return (
    <>
      {/* Main Wrapper - Full height layout */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Main Content - Layout 3 colonnes professionnel */}
        <div className="flex-1 overflow-hidden">
          {/* Container aligné avec NavBar - 3 colonnes égales en hauteur */}
          <div className="h-full container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            <div className="h-full flex flex-col lg:flex-row lg:items-stretch gap-0">
            {/* LEFT SIDEBAR - Toolbar */}
            <div className="order-3 lg:order-1 fixed bottom-0 left-0 right-0 lg:static lg:w-16 xl:w-20 lg:h-full bg-white border-t lg:border-t-0 lg:border-r flex flex-row lg:flex-col items-center justify-around lg:justify-start py-2 lg:py-6 gap-1 sm:gap-2 lg:gap-4 z-30 shadow-lg lg:shadow-none">
            <button
              onClick={() => {
                setActiveTab('designs');
                loadAvailableProducts();
              }}
              disabled={loadingProducts}
              className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 lg:py-2.5 rounded-lg transition-all ${
                activeTab === 'designs' && showProductLibrary
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } ${loadingProducts ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Produits"
            >
              {loadingProducts ? (
                <Loader2 className="w-5 h-5 lg:w-5 lg:h-5 animate-spin" />
              ) : (
                <Shirt className="w-5 h-5 lg:w-5 lg:h-5" />
              )}
              <span className="text-[9px] sm:text-[10px] font-medium hidden xl:block">
                {loadingProducts ? 'Chargement...' : 'Produits'}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('designs');
                loadVendorDesigns();
              }}
              disabled={loadingDesigns}
              className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 lg:py-2.5 rounded-lg transition-all ${
                activeTab === 'designs' && showDesignLibrary
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } ${loadingDesigns ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Designs"
            >
              {loadingDesigns ? (
                <Loader2 className="w-5 h-5 lg:w-5 lg:h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5 lg:w-5 lg:h-5" />
              )}
              <span className="text-[9px] sm:text-[10px] font-medium hidden xl:block">
                {loadingDesigns ? 'Chargement...' : 'Designs'}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('text');
                editorRef.current?.addText();
              }}
              className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 lg:py-2.5 rounded-lg transition-all ${
                activeTab === 'text'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Texte"
            >
              <Type className="w-5 h-5 lg:w-5 lg:h-5" />
              <span className="text-[9px] sm:text-[10px] font-medium hidden xl:block">Texte</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('upload');
                setShowImageUploadModal(true);
              }}
              className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 lg:py-2.5 rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Importer"
            >
              <Upload className="w-5 h-5 lg:w-5 lg:h-5" />
              <span className="text-[9px] sm:text-[10px] font-medium hidden xl:block">Importer</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ai');
                setShowAIGenerator(true);
              }}
              className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 lg:py-2.5 rounded-lg transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
              }`}
              title="Générer par IA"
            >
              <Sparkles className="w-5 h-5 lg:w-5 lg:h-5" />
              <span className="text-[9px] sm:text-[10px] font-medium hidden xl:block">IA</span>
            </button>
          </div>

            {/* CENTER - Mockup Section */}
            <div className="order-1 lg:order-2 flex-1 lg:h-full flex flex-col pb-20 lg:pb-0 bg-gray-50">
              {/* Mockup Container */}
              <div className="flex-1 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
              {stickerType && selectedStickerDesign ? (
                /* Aperçu du sticker */
                <div className="w-full h-full flex items-center justify-center">
                  <div className="relative max-w-lg w-full">
                    {/* Titre */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Aperçu de votre sticker
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stickerType === 'autocollant' ? 'Autocollant avec contours découpés' : 'Sticker pare-chocs rectangulaire'}
                      </p>
                    </div>

                    {/* Zone d'aperçu - Fond gris pour mieux voir les bordures */}
                    <div className="bg-gray-200 rounded-xl p-8 lg:p-12">
                      <div className="flex items-center justify-center">
                        {stickerType === 'autocollant' ? (
                          /* Aperçu autocollant style CARTOON STICKER avec contour dynamique + grille dimensionnelle */
                          <div className="relative inline-block">
                            {/* Image du sticker avec effets */}
                            <img
                              src={selectedStickerDesign.imageUrl || selectedStickerDesign.thumbnailUrl}
                              alt={selectedStickerDesign.name}
                              className="max-w-xs max-h-xs object-contain"
                              style={{
                                display: 'block',
                                /* Contour dynamique selon le choix utilisateur */
                                filter: (() => {
                                  const filters = [];

                                  // Contour externe selon le choix
                                  if (stickerBorderColor !== 'transparent') {
                                    const borderColor = stickerBorderColor === 'glossy-white' ? 'white' : 'white';
                                    filters.push(
                                      `drop-shadow(1px 0 0 ${borderColor})`,
                                      `drop-shadow(-1px 0 0 ${borderColor})`,
                                      `drop-shadow(0 1px 0 ${borderColor})`,
                                      `drop-shadow(0 -1px 0 ${borderColor})`,
                                      `drop-shadow(2px 0 0 ${borderColor})`,
                                      `drop-shadow(-2px 0 0 ${borderColor})`,
                                      `drop-shadow(0 2px 0 ${borderColor})`,
                                      `drop-shadow(0 -2px 0 ${borderColor})`,
                                      `drop-shadow(3px 0 0 ${borderColor})`,
                                      `drop-shadow(-3px 0 0 ${borderColor})`,
                                      `drop-shadow(0 3px 0 ${borderColor})`,
                                      `drop-shadow(0 -3px 0 ${borderColor})`,
                                      `drop-shadow(2px 2px 0 ${borderColor})`,
                                      `drop-shadow(-2px -2px 0 ${borderColor})`,
                                      `drop-shadow(2px -2px 0 ${borderColor})`,
                                      `drop-shadow(-2px 2px 0 ${borderColor})`
                                    );

                                    // Contour gris foncé interne TRÈS FIN
                                    filters.push(
                                      'drop-shadow(0.3px 0 0 rgba(50, 50, 50, 0.7))',
                                      'drop-shadow(-0.3px 0 0 rgba(50, 50, 50, 0.7))',
                                      'drop-shadow(0 0.3px 0 rgba(50, 50, 50, 0.7))',
                                      'drop-shadow(0 -0.3px 0 rgba(50, 50, 50, 0.7))'
                                    );
                                  }

                                  // Ombre visible pour effet autocollant
                                  filters.push(
                                    'drop-shadow(2px 3px 5px rgba(0, 0, 0, 0.3))',
                                    'drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.25))',
                                    'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2))'
                                  );

                                  // Effet brillant MARQUÉ pour glossy-white
                                  if (stickerBorderColor === 'glossy-white') {
                                    // Surbrillance blanche intense pour effet brillant
                                    filters.push(
                                      'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))',
                                      'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
                                      'drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))',
                                      'brightness(1.15)',
                                      'contrast(1.1)'
                                    );
                                  } else {
                                    filters.push('brightness(1.02)', 'contrast(1.05)');
                                  }

                                  // Amélioration des couleurs pour effet cartoon/sticker
                                  filters.push('saturate(1.1)');

                                  return filters.join(' ');
                                })()
                              }}
                            />

                            {/* Grille dimensionnelle en overlay */}
                            {(() => {
                              // Parser la taille sélectionnée (ex: "83 mm x 100 mm")
                              const [widthStr, heightStr] = stickerSize.split(' x ').map(s => parseInt(s));
                              const gridSize = 10; // Taille de chaque cellule de grille en mm
                              const cellsX = Math.ceil(widthStr / gridSize);
                              const cellsY = Math.ceil(heightStr / gridSize);

                              return (
                                <svg
                                  className="absolute inset-0 w-full h-full pointer-events-none"
                                  style={{ opacity: 0.2 }}
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <defs>
                                    <pattern
                                      id="grid"
                                      width={`${100 / cellsX}%`}
                                      height={`${100 / cellsY}%`}
                                      patternUnits="userSpaceOnUse"
                                    >
                                      <path
                                        d={`M ${100 / cellsX} 0 L 0 0 0 ${100 / cellsY}`}
                                        fill="none"
                                        stroke="rgba(0, 0, 0, 0.3)"
                                        strokeWidth="0.5"
                                      />
                                    </pattern>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#grid)" />
                                </svg>
                              );
                            })()}
                          </div>
                        ) : (
                          /* Aperçu pare-chocs avec bordure blanche TRÈS LARGE et INTENSE */
                          <div className="bg-white p-10 shadow-2xl inline-block border-8 border-white" style={{
                            boxShadow: '0 0 0 4px #ffffff, 0 0 0 8px #f0f0f0, 0 8px 16px -2px rgba(0, 0, 0, 0.2), 0 4px 8px -2px rgba(0, 0, 0, 0.1)'
                          }}>
                            <img
                              src={selectedStickerDesign.imageUrl || selectedStickerDesign.thumbnailUrl}
                              alt={selectedStickerDesign.name}
                              className="max-w-xs max-h-xs object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Info du design */}
                      <div className="mt-6 pt-6 border-t text-center">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {selectedStickerDesign.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Taille : {stickerSize}
                        </p>
                      </div>
                    </div>

                    {/* Badge informatif */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 text-center">
                        💡 Personnalisez les options dans la barre latérale et ajoutez au panier quand vous êtes prêt
                      </p>
                    </div>
                  </div>
                </div>
              ) : stickerType ? (
                /* Message d'attente pour choisir un design */
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      {stickerType === 'autocollant' ? (
                        <Sticker className="w-12 h-12 text-gray-400" />
                      ) : (
                        <Flag className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Choisissez un design
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Configurez les options de votre {stickerType === 'autocollant' ? 'autocollant' : 'sticker pare-chocs'} dans la barre latérale, puis sélectionnez un design
                    </p>
                    <Button
                      onClick={() => {
                        loadVendorDesigns();
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Parcourir les designs
                    </Button>
                  </div>
                </div>
              ) : selectedView && delimitation ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ProductDesignEditor
                    key={`editor-${selectedColorVariation?.id}-${selectedView?.id}`}
                    ref={editorRef}
                    productImageUrl={selectedView.url}
                    delimitation={delimitation}
                    initialElements={getCurrentElements()}
                    onElementsChange={handleElementsChange}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {selectedView && (
                    <img
                      src={selectedView.url}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>

              {/* View Selector - Fixed at bottom - Masqué en mode sticker */}
              {!stickerType && selectedColorVariation && selectedColorVariation.images && selectedColorVariation.images.length > 1 && (
                <div className="flex gap-2 sm:gap-3 bg-white px-4 py-4 justify-center items-center overflow-x-auto flex-shrink-0 border-t">
              {selectedColorVariation.images.map((img: any, idx: number) => {
                const viewElements = getElementsForView(selectedColorVariation.id, img.id);
                const delimitation = img.delimitations?.[0];

                return (
                  <button
                    key={img.id}
                    onClick={() => {
                      console.log('🖼️ [Customization] Changement de vue:', getViewName(img.viewType, idx, selectedColorVariation.images.length));
                      // Le changement de vue sauvegarde automatiquement via useEffect
                      setSelectedView(img);
                    }}
                    className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg min-w-[70px] sm:min-w-[100px] transition-all flex-shrink-0 ${
                      selectedView?.id === img.id
                        ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                    }`}
                  >
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden bg-white border-2 border-gray-200">
                      {/* Image de fond */}
                      <img
                        src={img.url}
                        alt={getViewName(img.viewType, idx, selectedColorVariation.images.length)}
                        className="w-full h-full object-contain"
                      />

                      {/* Éléments de design superposés */}
                      {delimitation && viewElements.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {viewElements.map((element: any) => {
                            // Taille du conteneur miniature - Responsive
                            const isMobile = window.innerWidth < 640;
                            const thumbnailWidth = isMobile ? 48 : 64;
                            const thumbnailHeight = isMobile ? 48 : 64;

                            // Dimensions de référence de l'image produit
                            const refWidth = delimitation.referenceWidth || 800;
                            const refHeight = delimitation.referenceHeight || 800;

                            // Calculer le ratio de scale entre la miniature et l'image de référence
                            const scaleX = thumbnailWidth / refWidth;
                            const scaleY = thumbnailHeight / refHeight;

                            // Utiliser le plus petit ratio pour garder les proportions
                            const scale = Math.min(scaleX, scaleY);

                            // Calculer la position en pixels dans la miniature
                            const left = element.x * thumbnailWidth;
                            const top = element.y * thumbnailHeight;

                            // Appliquer le scale aux dimensions de l'élément
                            const scaledWidth = element.width * scale;
                            const scaledHeight = element.height * scale;

                            // Calculer la taille de police scalée
                            const scaledFontSize = element.type === 'text'
                              ? (element.fontSize || 24) * scale
                              : 0;

                            return (
                              <div
                                key={element.id}
                                style={{
                                  position: 'absolute',
                                  left: `${left}px`,
                                  top: `${top}px`,
                                  width: `${scaledWidth}px`,
                                  height: `${scaledHeight}px`,
                                  transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                                  transformOrigin: 'center center',
                                  zIndex: element.zIndex,
                                }}
                              >
                                {element.type === 'text' ? (
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: element.textAlign || 'center',
                                      fontSize: `${scaledFontSize}px`,
                                      fontFamily: element.fontFamily || 'Arial',
                                      color: element.color || '#000000',
                                      fontWeight: element.fontWeight || 'normal',
                                      fontStyle: element.fontStyle || 'normal',
                                      textDecoration: element.textDecoration || 'none',
                                      textAlign: element.textAlign || 'center',
                                      whiteSpace: 'normal',
                                      overflow: 'hidden',
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {element.text.split('\n').map((line, index) => (
                                      <React.Fragment key={index}>
                                        {line}
                                        {index < element.text.split('\n').length - 1 && <br />}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                ) : element.type === 'image' ? (
                                  <img
                                    src={element.imageUrl}
                                    alt="Design"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                    }}
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Badge compteur d'éléments */}
                      {viewElements.length > 0 && (
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center text-[8px] sm:text-[10px]">
                          {viewElements.length}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">
                      {getViewName(img.viewType, idx, selectedColorVariation.images.length)}
                    </span>
                  </button>
                );
              })}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR - Product Info / Text Editor */}
            <div className="order-2 lg:order-3 w-full lg:w-80 xl:w-96 lg:h-full bg-white border-t lg:border-t-0 lg:border-l overflow-y-auto shadow-xl lg:shadow-none">
              <div className="h-full flex flex-col p-4 sm:p-5 lg:p-6">
                {/* Afficher l'éditeur de texte si un élément texte est sélectionné */}
                {selectedElement && selectedElement.type === 'text' ? (
                  <>
                    {/* En-tête de l'éditeur de texte - Desktop uniquement */}
                    <div className="hidden lg:block mb-6 pb-4 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Modifier le texte</h2>
                        <button
                          onClick={() => {
                            // Désélectionner l'élément
                            setSelectedElement(null);
                          }}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Fermer l'éditeur"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">Personnalisez votre texte ci-dessous</p>
                    </div>

                    {/* En-tête compact pour mobile */}
                    <div className="lg:hidden mb-4 pb-3 border-b">
                      <h2 className="text-lg font-bold text-gray-900">Édition du texte</h2>
                    </div>

                    {/* Champ de texte */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Texte</label>
                      <textarea
                        value={selectedElement.text}
                        onChange={(e) => editorRef.current?.updateText(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                        rows={3}
                        placeholder="Entrez votre texte..."
                      />
                    </div>

                    {/* Police et taille */}
                    <div className="mb-6 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Police</label>
                        <select
                          value={selectedElement.fontFamily}
                          onChange={(e) => editorRef.current?.updateTextProperty('fontFamily', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        >
                          {FONTS.map(font => (
                            <option key={font.value} value={font.value}>{font.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Taille</label>
                        <input
                          type="number"
                          value={selectedElement.fontSize}
                          onChange={(e) => editorRef.current?.updateTextProperty('fontSize', parseInt(e.target.value))}
                          min="10"
                          max="100"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        />
                      </div>
                    </div>

                    {/* Couleur */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Couleur du texte</label>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => editorRef.current?.updateTextProperty('color', color)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                              selectedElement.color === color ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Style de texte */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Style</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editorRef.current?.updateTextProperty('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all ${
                            selectedElement.fontWeight === 'bold'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Bold className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => editorRef.current?.updateTextProperty('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all ${
                            selectedElement.fontStyle === 'italic'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Italic className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => editorRef.current?.updateTextProperty('textDecoration', selectedElement.textDecoration === 'underline' ? 'none' : 'underline')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all ${
                            selectedElement.textDecoration === 'underline'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Underline className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                    </div>

                    {/* Alignement */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Alignement</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editorRef.current?.updateTextProperty('textAlign', 'left')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all ${
                            selectedElement.textAlign === 'left'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <AlignLeft className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => editorRef.current?.updateTextProperty('textAlign', 'center')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all ${
                            selectedElement.textAlign === 'center'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <AlignCenter className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => editorRef.current?.updateTextProperty('textAlign', 'right')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all ${
                            selectedElement.textAlign === 'right'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <AlignRight className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                    </div>

                    {/* Message info desktop */}
                    <div className="hidden lg:block mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 font-medium mb-2">ℹ️ Mode édition</p>
                      <p className="text-xs text-blue-800">
                        Terminez l'édition de votre texte pour continuer. Cliquez en dehors du texte pour désélectionner.
                      </p>
                    </div>

                    {/* Spacer pour desktop */}
                    <div className="hidden lg:block flex-1"></div>

                    {/* CTA Section - Desktop uniquement - BOUTON DÉSACTIVÉ */}
                    <div className="hidden lg:block mt-auto space-y-4 pt-4 border-t">
                      <Button
                        disabled
                        className="w-full py-4 sm:py-6 lg:py-7 text-base sm:text-lg lg:text-xl font-semibold opacity-50 cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                        <span className="hidden sm:inline">Choisir la quantité & taille</span>
                        <span className="sm:hidden">Ajouter au panier</span>
                      </Button>
                    </div>

                    {/* MOBILE: Badge indicateur mode édition */}
                    <div className="lg:hidden fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
                      <div className="bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Mode édition</span>
                      </div>
                    </div>

                    {/* MOBILE: Bouton flottant de validation */}
                    <div className="lg:hidden fixed bottom-20 right-4 z-40">
                      <button
                        onClick={() => {
                          // Désélectionner l'élément
                          setSelectedElement(null);
                          toast({
                            title: '✅ Texte validé',
                            description: 'Votre personnalisation a été enregistrée'
                          });
                        }}
                        className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-2xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold pr-1">Valider</span>
                      </button>
                    </div>
                  </>
                ) : stickerType ? (
                  <>
                    {/* Bouton retour */}
                    <button
                      onClick={() => {
                        setStickerType(null);
                        setSelectedStickerDesign(null);
                      }}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm font-medium">Retour aux produits</span>
                    </button>

                    {/* Interface de configuration Sticker */}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                      {stickerType === 'autocollant' ? 'Autocollant' : 'Sticker pare-chocs'}
                    </h2>

                    {/* Livraison */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
                      <Truck className="w-4 h-4" />
                      <span>Livraison : 15 - 29 janv.</span>
                    </div>

                    {/* Options de produit */}
                    <div className="space-y-6 mb-6">
                      {/* Procédé d'impression */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Procédé d'impression</h3>
                        <div className="inline-flex px-3 py-1.5 bg-gray-100 rounded-full">
                          <span className="text-sm text-gray-900">Sticker</span>
                        </div>
                      </div>

                      {/* Couleur du contour - Uniquement pour autocollant */}
                      {stickerType === 'autocollant' && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Couleur du contour</h3>
                          <div className="flex gap-3">
                            {/* Transparent */}
                            <button
                              onClick={() => setStickerBorderColor('transparent')}
                              className={`w-16 h-16 rounded-lg border-2 transition-all relative ${
                                stickerBorderColor === 'transparent'
                                  ? 'border-gray-900 ring-2 ring-gray-300'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{
                                backgroundColor: 'white',
                                backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                                backgroundSize: '10px 10px',
                                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                              }}
                              title="Transparent"
                            >
                              {stickerBorderColor === 'transparent' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                  <Check className="w-5 h-5 text-gray-900" />
                                </div>
                              )}
                            </button>

                            {/* Blanc mat */}
                            <button
                              onClick={() => setStickerBorderColor('#FFFFFF')}
                              className={`w-16 h-16 rounded-lg border-2 transition-all relative ${
                                stickerBorderColor === '#FFFFFF'
                                  ? 'border-gray-900 ring-2 ring-gray-300'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: '#FFFFFF' }}
                              title="Blanc mat"
                            >
                              {stickerBorderColor === '#FFFFFF' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-gray-900" />
                                </div>
                              )}
                            </button>

                            {/* Blanc brillant */}
                            <button
                              onClick={() => setStickerBorderColor('glossy-white')}
                              className={`w-16 h-16 rounded-lg border-2 transition-all relative ${
                                stickerBorderColor === 'glossy-white'
                                  ? 'border-gray-900 ring-2 ring-gray-300'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
                                boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.1)'
                              }}
                              title="Blanc brillant"
                            >
                              {stickerBorderColor === 'glossy-white' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-gray-900" />
                                </div>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            {stickerBorderColor === 'transparent' ? 'Transparent' :
                             stickerBorderColor === '#FFFFFF' ? 'Blanc mat' :
                             'Blanc brillant'}
                          </p>
                        </div>
                      )}

                      {/* Taille du sticker */}
                      {stickerType && (
                        <div>
                          <button
                            onClick={() => setShowSizeSelector(!showSizeSelector)}
                            className="w-full flex items-center justify-between py-3 border-t border-b hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">Modifier la taille</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{stickerSize}</span>
                              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showSizeSelector ? 'rotate-90' : ''}`} />
                            </div>
                          </button>

                          {/* Sélecteur de taille */}
                          {showSizeSelector && (
                            <div className="py-3 px-2 bg-gray-50 border-b space-y-2">
                              {[
                                '10 mm x 12 mm',
                                '20 mm x 20 mm',
                                '30 mm x 30 mm',
                                '50 mm x 50 mm',
                                '75 mm x 75 mm',
                                '83 mm x 100 mm',
                                '100 mm x 100 mm',
                                '120 mm x 120 mm',
                                '150 mm x 150 mm',
                                '200 mm x 200 mm'
                              ].map((size) => (
                                <button
                                  key={size}
                                  onClick={() => {
                                    setStickerSize(size);
                                    setShowSizeSelector(false);
                                    toast({
                                      title: 'Taille modifiée',
                                      description: `Nouvelle taille: ${size}`,
                                      duration: 2000
                                    });
                                  }}
                                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                                    stickerSize === size
                                      ? 'bg-primary text-white font-medium'
                                      : 'bg-white hover:bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">{size}</span>
                                    {stickerSize === size && (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bouton Choisir un design */}
                      <div>
                        <button
                          onClick={() => {
                            // Ouvrir la bibliothèque de designs
                            loadVendorDesigns();
                          }}
                          className={`w-full py-4 px-4 rounded-lg font-medium transition-all ${
                            selectedStickerDesign
                              ? 'bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                        >
                          {selectedStickerDesign ? (
                            <div className="flex items-center justify-between">
                              <span>✓ Design sélectionné</span>
                              <span className="text-xs">Changer</span>
                            </div>
                          ) : (
                            <span>Choisir un design</span>
                          )}
                        </button>

                        {/* Aperçu du design sélectionné */}
                        {selectedStickerDesign && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <img
                                src={selectedStickerDesign.imageUrl || selectedStickerDesign.thumbnailUrl}
                                alt={selectedStickerDesign.name}
                                className="w-12 h-12 object-contain bg-white rounded border"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {selectedStickerDesign.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {selectedStickerDesign.price > 0 ? formatPrice(selectedStickerDesign.price) : 'Gratuit'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prix */}
                    {selectedStickerDesign && (
                      <div className="border-t pt-4 mb-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Sticker {stickerType === 'autocollant' ? 'autocollant' : 'pare-chocs'}</span>
                            <span className="text-base font-medium text-gray-900">
                              {formatPrice((stickerType === 'autocollant' ? 2.99 : 6.99) * 655.96)}
                            </span>
                          </div>
                          {selectedStickerDesign.price > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Design</span>
                              <span className="text-base font-medium text-blue-600">
                                +{formatPrice(selectedStickerDesign.price)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-base font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-gray-900">
                              {formatPrice(((stickerType === 'autocollant' ? 2.99 : 6.99) * 655.96) + (selectedStickerDesign.price || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* CTA */}
                    <div className="mt-auto pt-4 border-t">
                      <Button
                        onClick={handleAddStickerToCart}
                        disabled={!selectedStickerDesign}
                        className="w-full py-6 text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Ajouter au panier
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Affichage normal des informations du produit */}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">{product.name}</h2>

                    <div className="flex items-center gap-2 mb-4 lg:mb-6">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-400 text-sm lg:text-base">★</span>
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm lg:text-base text-gray-600">(0 avis)</span>
                    </div>

                    {product.description && (
                      <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6 lg:mb-8">{product.description}</p>
                    )}

                    {/* Color Selection */}
                    {product.colorVariations && product.colorVariations.length > 1 && (
                      <div className="mb-6 lg:mb-8">
                        <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-base lg:text-lg">Couleur</h3>
                        <div className="flex flex-wrap gap-2 lg:gap-3">
                          {product.colorVariations.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => {
                                console.log('🎨 [Customization] Changement de couleur:', color.name);

                                // 🔧 NOUVEAU: Copier les personnalisations de l'ancienne couleur vers la nouvelle
                                if (selectedColorVariation && selectedColorVariation.id !== color.id) {
                                  console.log('📋 [Customization] Copie des personnalisations vers la nouvelle couleur');

                                  // Récupérer les éléments de toutes les vues de l'ancienne couleur
                                  const oldColorViews = selectedColorVariation.images || [];
                                  const newColorViews = color.images || [];

                                  // Créer une copie du state actuel
                                  const newElementsByView = { ...designElementsByViewRef.current };

                                  // Pour chaque vue de l'ancienne couleur, copier vers la vue correspondante de la nouvelle couleur
                                  oldColorViews.forEach((oldView: any, index: number) => {
                                    const oldViewKey = `${selectedColorVariation.id}-${oldView.id}`;
                                    const elements = newElementsByView[oldViewKey];

                                    // Si cette vue a des éléments et qu'il y a une vue correspondante dans la nouvelle couleur
                                    if (elements && elements.length > 0 && newColorViews[index]) {
                                      const newView = newColorViews[index];
                                      const newViewKey = `${color.id}-${newView.id}`;

                                      console.log(`✨ [Customization] Copie ${elements.length} éléments de ${oldViewKey} vers ${newViewKey}`);

                                      // Copier les éléments vers la nouvelle vue
                                      newElementsByView[newViewKey] = [...elements];
                                    }
                                  });

                                  // Mettre à jour le state avec les nouvelles copies
                                  setDesignElementsByView(newElementsByView);
                                }

                                // Le changement de couleur sauvegarde automatiquement via useEffect
                                setSelectedColorVariation(color);
                                if (color.images && color.images.length > 0) {
                                  setSelectedView(color.images[0]);
                                }
                              }}
                              className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-all ${
                                selectedColorVariation?.id === color.id
                                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color.colorCode }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4 sm:pt-6 lg:pt-8 mb-4 sm:mb-6 lg:mb-8">
                      <div className="space-y-2 lg:space-y-3">
                        {/* Prix par taille */}
                        <div className="mb-3">
                          <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 block mb-2">Prix par taille :</span>
                          <div className="space-y-1.5">
                            {(product.sizePrices || product.sizesWithPrices || []).map((sizePrice: any, idx: number) => {
                              const sizeName = sizePrice.size || sizePrice.sizeName || `Taille ${idx + 1}`;
                              const price = sizePrice.salePrice || sizePrice.suggestedPrice || sizePrice.price;
                              const totalPriceWithDesigns = price + getTotalDesignsPrice();
                              return (
                                <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                                  <span className="text-gray-600">{sizeName}</span>
                                  <span className="font-medium text-gray-900">{formatPrice(totalPriceWithDesigns)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Prix des designs (si applicable) */}
                        {getTotalDesignsPrice() > 0 && (
                          <div className="flex items-center justify-between pt-2 border-t border-dashed">
                            <span className="text-xs sm:text-sm lg:text-base text-gray-600">
                              Design{getTotalDesignsPrice() > (product.suggestedPrice || product.price) ? 's' : ''}
                            </span>
                            <span className="text-base sm:text-lg lg:text-xl font-medium text-blue-600">
                              +{formatPrice(getTotalDesignsPrice())}
                            </span>
                          </div>
                        )}

                        {/* Prix total (avec prix de base) */}
                        <div className="flex items-center justify-between pt-2 lg:pt-3 border-t">
                          <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Total</span>
                          <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                            {formatPrice(getTotalPrice())}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Spacer pour pousser le bouton en bas */}
                    <div className="flex-1"></div>

                    {/* CTA Section - Fixed at bottom */}
                    <div className="mt-auto space-y-4 pt-4 border-t">
                      <Button
                        onClick={handleOpenSizeModal}
                        className="w-full py-4 sm:py-6 lg:py-7 text-base sm:text-lg lg:text-xl font-semibold"
                      >
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                        <span className="hidden sm:inline">Choisir la quantité & taille</span>
                        <span className="sm:hidden">Ajouter au panier</span>
                      </Button>

                      <div className="p-3 sm:p-4 lg:p-5 bg-blue-50 rounded-lg hidden sm:block">
                        <p className="text-sm lg:text-base text-blue-900 font-medium mb-2">💡 Comment utiliser:</p>
                        <ul className="text-xs lg:text-sm text-blue-800 space-y-1">
                          <li>• Utilisez la barre latérale pour ajouter des designs ou du texte</li>
                          <li>• Cliquez et glissez pour déplacer les éléments</li>
                          <li>• Utilisez les poignées pour redimensionner et pivoter</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panneau latéral Bibliothèque de designs - Responsive */}
        {showDesignLibrary && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDesignLibrary(false)}
          />

          {/* Panneau - Full screen on mobile, large sidebar on desktop */}
          <div className="relative ml-auto w-full lg:max-w-6xl xl:max-w-7xl bg-white shadow-2xl flex flex-col">
            {/* Header - Responsive */}
            <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">Choisissez un design</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDesignLibrary(false)}
                >
                  <X className="w-5 h-5 lg:w-6 lg:h-6" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Sidebar gauche - Filtres - Hidden on mobile, visible on desktop */}
              <div className="hidden lg:block lg:w-80 xl:w-96 border-r bg-gray-50 p-4 lg:p-6 overflow-y-auto">
                {/* Recherche */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={designSearch}
                      onChange={(e) => setDesignSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                {/* Interrupteurs de filtres */}
                <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm lg:text-base text-gray-700">Designs gratuits</span>
                    <button
                      onClick={() => setShowFreeOnly(!showFreeOnly)}
                      className={`relative inline-flex h-6 w-11 lg:h-7 lg:w-12 items-center rounded-full transition-colors ${
                        showFreeOnly ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 lg:h-5 lg:w-5 transform rounded-full bg-white transition-transform ${
                          showFreeOnly ? 'translate-x-6 lg:translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm lg:text-base text-gray-700">Designs tout public</span>
                    <button
                      onClick={() => setShowAllAudience(!showAllAudience)}
                      className={`relative inline-flex h-6 w-11 lg:h-7 lg:w-12 items-center rounded-full transition-colors ${
                        showAllAudience ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 lg:h-5 lg:w-5 transform rounded-full bg-white transition-transform ${
                          showAllAudience ? 'translate-x-6 lg:translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm lg:text-base text-gray-700">Couleur adaptable</span>
                    <button
                      onClick={() => setShowAdaptableColor(!showAdaptableColor)}
                      className={`relative inline-flex h-6 w-11 lg:h-7 lg:w-12 items-center rounded-full transition-colors ${
                        showAdaptableColor ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 lg:h-5 lg:w-5 transform rounded-full bg-white transition-transform ${
                          showAdaptableColor ? 'translate-x-6 lg:translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Labels associés */}
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 lg:mb-4">Labels associés</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Bouton "Tous" */}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                        selectedCategory === null
                          ? 'bg-primary text-white border border-primary'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      Tous
                    </button>
                    {/* Boutons de catégories */}
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                          selectedCategory === category
                            ? 'bg-primary text-white border border-primary'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contenu principal - Grille de designs - Responsive */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile: Barre de recherche */}
                <div className="lg:hidden px-3 py-2 border-b bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un design..."
                      value={designSearch}
                      onChange={(e) => setDesignSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                {/* Résultats et info */}
                <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-white">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} trouvé{filteredDesigns.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grille scrollable - Responsive Grid with better desktop layout */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
                  {loadingDesigns ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredDesigns.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                      {filteredDesigns.map((design) => (
                        <div
                          key={design.id}
                          className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                          onClick={() => {
                            // Fermer le modal immédiatement
                            setShowDesignLibrary(false);

                            // Si on est en mode sticker, sélectionner pour le sticker
                            if (stickerType) {
                              handleStickerDesignSelected(design);
                            } else {
                              // Sinon, ajouter au produit normal
                              editorRef.current?.addVendorDesign(design);
                              toast({
                                title: 'Design ajouté',
                                description: `${design.name} a été ajouté`
                              });
                            }
                          }}
                        >
                          {/* Actions en haut - Hidden on mobile */}
                          <div className="hidden sm:flex absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Ajouté aux favoris' });
                              }}
                            >
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Design signalé' });
                              }}
                            >
                              <Flag className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                            </button>
                          </div>

                          {/* Label gratuit - Responsive */}
                          {design.price === 0 && (
                            <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-green-500 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded z-10">
                              Gratuit
                            </div>
                          )}

                          {/* Image - Responsive Padding */}
                          <div className="aspect-square bg-gray-50 p-2 sm:p-4 lg:p-6">
                            <img
                              src={design.imageUrl || design.thumbnailUrl}
                              alt={design.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                            />
                          </div>

                          {/* Info - Responsive */}
                          <div className="p-2 sm:p-3 lg:p-4 border-t">
                            <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 mb-1 line-clamp-1">
                              {design.name}
                            </p>
                            <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-sm">
                              <span className="text-gray-600 truncate hidden sm:inline">
                                {design.creator?.shopName}
                              </span>
                              <span className="font-bold text-primary whitespace-nowrap ml-auto">
                                {design.price > 0 ? formatPrice(design.price) : 'Gratuit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-500">
                      Aucun design trouvé
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Modal de sélection taille/quantité */}
        <SizeQuantityModal
          isOpen={showSizeModal}
          onClose={() => setShowSizeModal(false)}
          productPrice={getTotalPrice()}  // Utiliser le prix total (produit + designs)
          productName={product.name}
          productSizes={product.sizes || []}
          sizePricing={product.sizePrices}
          onAddToCart={handleAddToCart}
        />

        {/* Panneau du générateur d'images IA */}
        {showAIGenerator && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowAIGenerator(false)}
            />

            {/* Panneau */}
            <div className="relative ml-auto w-full lg:max-w-3xl xl:max-w-4xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
              <AIImageGenerator
                onImageGenerated={handleAIImageGenerated}
                onClose={() => setShowAIGenerator(false)}
                className="m-6"
              />
            </div>
          </div>
        )}

        {/* Panneau latéral Bibliothèque de produits */}
        {showProductLibrary && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowProductLibrary(false)}
            />

            {/* Panneau - Full screen on mobile, large sidebar on desktop */}
            <div className="relative ml-auto w-full lg:max-w-6xl xl:max-w-7xl bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Choisissez un produit à personnaliser
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProductLibrary(false)}
                  >
                    <X className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Button>
                </div>
              </div>

              {/* Contenu avec sidebar filtres */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Sidebar gauche - Filtres - Hidden on mobile, visible on desktop */}
                <div className="hidden lg:block lg:w-80 xl:w-96 border-r bg-white p-4 lg:p-6 overflow-y-auto">
                  {/* Recherche */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Titre de section avec compteur */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <h3 className="text-base font-bold text-gray-900">Produits</h3>
                    <span className="text-sm text-gray-500">{filteredProducts.length}</span>
                  </div>

                  {/* Liste de catégories verticale */}
                  <nav className="space-y-1">
                    {/* Catégorie "Tous les produits" */}
                    <button
                      onClick={() => {
                        setSelectedProductCategory(null);
                        setSelectedProductSubCategory(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        selectedProductCategory === null
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>Tous les produits</span>
                    </button>

                    {/* Catégories dynamiques avec sous-catégories repliables */}
                    {productCategoriesWithSub.map((category) => (
                      <div key={category.id || category.name}>
                        {/* Bouton de catégorie principale */}
                        <button
                          onClick={() => {
                            if (selectedProductCategory === category.name) {
                              // Si déjà sélectionné, déplier/replier
                              setSelectedProductCategory(null);
                              setSelectedProductSubCategory(null);
                            } else {
                              setSelectedProductCategory(category.name);
                              setSelectedProductSubCategory(null);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            selectedProductCategory === category.name
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{category.name}</span>
                          {category.subCategories && category.subCategories.length > 0 && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`transition-transform ${
                                selectedProductCategory === category.name ? 'rotate-180' : ''
                              }`}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          )}
                        </button>

                        {/* Sous-catégories (affichées seulement si la catégorie est sélectionnée) */}
                        {selectedProductCategory === category.name && category.subCategories && category.subCategories.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {category.subCategories.map((subCategory: any) => (
                              <button
                                key={subCategory.id || subCategory.name}
                                onClick={() => setSelectedProductSubCategory(subCategory.name)}
                                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                  selectedProductSubCategory === subCategory.name
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {subCategory.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Catégorie Stickers (sans sous-catégories, lien simple) */}
                    <button
                      onClick={() => {
                        setShowProductLibrary(false);
                        setShowStickerSelection(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                    >
                      <span>Stickers</span>
                    </button>
                  </nav>
                </div>

                {/* Contenu principal - Grille de produits */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Mobile: Barre de recherche */}
                  <div className="lg:hidden px-3 py-2 border-b bg-white">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  {/* Résultats et info */}
                  <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-white">
                    <p className="text-xs sm:text-sm text-gray-600">
                      {filteredProducts.length + 1} produit{(filteredProducts.length + 1) > 1 ? 's' : ''} disponible{(filteredProducts.length + 1) > 1 ? 's' : ''} (dont stickers)
                    </p>
                  </div>

                  {/* Grille scrollable */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
                    {loadingProducts ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                        {/* 🛍️ PRODUITS */}
                        {filteredProducts.map((productItem) => {
                          const firstColor = productItem.colorVariations?.[0];
                          const firstImage = firstColor?.images?.[0];

                          return (
                            <div
                              key={productItem.id}
                              className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                              onClick={() => handleProductChange(productItem)}
                            >
                              {/* Badge produit actuel */}
                              {product?.id === productItem.id && (
                                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-primary text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded z-10">
                                  Actuel
                                </div>
                              )}

                              {/* Image */}
                              <div className="aspect-square bg-gray-50 p-2 sm:p-4 lg:p-6">
                                {firstImage ? (
                                  <img
                                    src={firstImage.url}
                                    alt={productItem.name}
                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Shirt className="w-12 h-12 sm:w-16 sm:h-16" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="p-2 sm:p-3 lg:p-4 border-t">
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 mb-1 line-clamp-2">
                                  {productItem.name}
                                </p>
                                <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-sm">
                                  <span className="text-gray-600">
                                    {productItem.colorVariations?.length || 0} couleur{(productItem.colorVariations?.length || 0) > 1 ? 's' : ''}
                                  </span>
                                  <span className="font-bold text-primary whitespace-nowrap ml-auto">
                                    {formatPrice(productItem.suggestedPrice || productItem.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                          })}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Panneau de sélection de stickers */}
        {showStickerSelection && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowStickerSelection(false)}
            />

            {/* Panneau - Full screen on mobile, large sidebar on desktop */}
            <div className="relative ml-auto w-full lg:max-w-2xl bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Choisissez votre type de sticker
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStickerSelection(false)}
                  >
                    <X className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Button>
                </div>
              </div>

              {/* Contenu - Choix des stickers */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Autocollant */}
                  <button
                    onClick={() => {
                      setStickerType('autocollant');
                      setShowStickerSelection(false);
                    }}
                    className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
                  >
                    {/* Zone image preview */}
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-300">
                        {/* Placeholder vide ou icône minimaliste */}
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <Sticker className="w-12 h-12 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Info produit */}
                    <div className="p-4 text-left">
                      <h3 className="text-base font-medium text-gray-900 mb-1">
                        Autocollant
                      </h3>
                      <p className="text-sm text-gray-600">
                        À partir de 2,99 € pour un produit acheté
                      </p>
                    </div>
                  </button>

                  {/* Pare-chocs */}
                  <button
                    onClick={() => {
                      setStickerType('pare-chocs');
                      setShowStickerSelection(false);
                    }}
                    className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
                  >
                    {/* Zone image preview */}
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-300">
                        {/* Placeholder vide ou icône minimaliste */}
                        <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                          <Flag className="w-10 h-10 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Info produit */}
                    <div className="p-4 text-left">
                      <h3 className="text-base font-medium text-gray-900 mb-1">
                        Sticker pare-chocs
                      </h3>
                      <p className="text-sm text-gray-600">
                        À partir de 6,99 € pour un produit acheté
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Footer - Outside main wrapper */}
      <Footer />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageUploadModal}
        onClose={() => setShowImageUploadModal(false)}
        onImageSelect={handleImageUpload}
      />
    </>
  );
};

export default CustomerProductCustomizationPageV3;

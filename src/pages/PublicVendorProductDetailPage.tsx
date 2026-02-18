import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Loader2, Check, Heart } from 'lucide-react';
import vendorProductsService, { VendorProduct, ProductGenre } from '../services/vendorProductsService';
import designService from '../services/designService';
import { SimpleProductPreview } from '../components/vendor/SimpleProductPreview';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { formatPrice } from '../utils/priceUtils';
import ServiceFeatures from './ServiceFeatures ';
import Footer from '../components/Footer';  
import { publicStickerService, PublicSticker } from '../services/publicStickerService';

const PublicVendorProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extraire l'ID du produit depuis l'URL en fallback
  const getProductIdFromUrl = (): { id: string | null; isSticker: boolean } => {
    // Essayer useParams d'abord
    if (productId) {
      console.log('✅ [PublicVendorProductDetailPage] ID trouvé via useParams:', productId);
      const isStickerRoute = location.pathname.includes('/public-sticker/');
      return { id: productId, isSticker: isStickerRoute };
    }

    // Fallback: extraire depuis le pathname
    const pathnameParts = location.pathname.split('/');

    // Vérifier si c'est une route sticker
    const stickerIndex = pathnameParts.indexOf('public-sticker');
    if (stickerIndex !== -1 && pathnameParts[stickerIndex + 1]) {
      const extractedId = pathnameParts[stickerIndex + 1];
      console.log('🔧 [PublicVendorProductDetailPage] ID sticker extrait depuis pathname:', extractedId);
      return { id: extractedId, isSticker: true };
    }

    // Vérifier si c'est une route produit vendeur
    const vendorProductDetailIndex = pathnameParts.indexOf('vendor-product-detail');
    if (vendorProductDetailIndex !== -1 && pathnameParts[vendorProductDetailIndex + 1]) {
      const extractedId = pathnameParts[vendorProductDetailIndex + 1];
      console.log('🔧 [PublicVendorProductDetailPage] ID produit extrait depuis pathname:', extractedId);
      return { id: extractedId, isSticker: false };
    }

    console.log('❌ [PublicVendorProductDetailPage] Impossible de trouver l\'ID du produit');
    return { id: null, isSticker: false };
  };

  const { id: actualProductId, isSticker: isStickerRoute } = getProductIdFromUrl();

  // Mettre à jour l'état isSticker
  useEffect(() => {
    setIsSticker(isStickerRoute);
  }, [isStickerRoute]);

  // Debug: Afficher les informations de routage
  console.log('🔍 [PublicVendorProductDetailPage] Infos routage:', {
    pathname: location.pathname,
    productIdFromParams: productId,
    extractedProductId: actualProductId,
    isSticker: isStickerRoute,
    allParams: useParams(),
    search: location.search,
    hash: location.hash
  });

  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [sticker, setSticker] = useState<PublicSticker | null>(null);
  const [isSticker, setIsSticker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<{ id: number; sizeName: string } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // États pour les produits avec le même design
  const [sameDesignProducts, setSameDesignProducts] = useState<VendorProduct[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<ProductGenre | null>(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [errorSimilar, setErrorSimilar] = useState<string | null>(null);

  // États pour les designs du vendeur
  const [vendorDesigns, setVendorDesigns] = useState<Array<{ id: number; imageUrl: string; name: string }>>([]);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);
  const [loadingVendorDesigns, setLoadingVendorDesigns] = useState(false);

  // États pour l'historique
  const [historyProducts, setHistoryProducts] = useState<VendorProduct[]>([]);

  // 🆕 États pour le zoom interactif
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  // 🆕 États pour les notifications favoris
  const [showFavoriteNotification, setShowFavoriteNotification] = useState(false);
  const [favoriteNotificationMessage, setFavoriteNotificationMessage] = useState('');

  const { addToCart, openCart } = useCart();
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavorites();

  // 🆕 Gestionnaire de zoom interactif
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  // 🆕 Fonction pour récupérer le prix de la taille sélectionnée
  const getPriceForSelectedSize = (): number => {
    if (!product || !selectedSize) {
      return product?.price || 0;
    }

    // Chercher le prix dans sizePricing d'abord
    if (product.sizePricing && product.sizePricing.length > 0) {
      const sizePrice = product.sizePricing.find(sp => sp.size === selectedSize.sizeName);
      if (sizePrice) {
        return sizePrice.salePrice;
      }
    }

    // Chercher dans sizesWithPrices ensuite
    if (product.sizesWithPrices && product.sizesWithPrices.length > 0) {
      const sizePrice = product.sizesWithPrices.find(sp => sp.sizeName === selectedSize.sizeName);
      if (sizePrice) {
        return sizePrice.salePrice;
      }
    }

    // Fallback: utiliser le prix de base du produit
    return product.price;
  };

  // ============ GESTION DES FAVORIS ============
  // Basculer le statut favori avec notification
  const handleToggleFavorite = () => {
    if (!product) return;

    const wasAlreadyFavorite = checkIsFavorite(product.id);

    // Appeler la fonction du contexte
    toggleFavorite(product);

    // Mettre à jour le message de notification
    if (wasAlreadyFavorite) {
      setFavoriteNotificationMessage('💔 Produit retiré des favoris');
    } else {
      setFavoriteNotificationMessage('❤️ Produit ajouté aux favoris');
    }

    // Afficher la notification
    setShowFavoriteNotification(true);

    // Masquer la notification après 3 secondes
    setTimeout(() => {
      setShowFavoriteNotification(false);
    }, 3000);
  };

  // ============ GESTION DE L'HISTORIQUE ============
  const HISTORY_STORAGE_KEY = 'vendor_products_history';
  const MAX_HISTORY_ITEMS = 12;

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

  // Ajouter un produit à l'historique
  const addToHistory = (product: VendorProduct) => {
    const currentHistory = loadHistory();

    // Supprimer le produit s'il existe déjà (pour éviter les doublons)
    const filteredHistory = currentHistory.filter(p => p.id !== product.id);

    // Ajouter le produit en tête de liste
    const newHistory = [product, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    saveHistory(newHistory);
    setHistoryProducts(newHistory);

    console.log('✅ Produit ajouté à l\'historique:', product.id);
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

  // Ajouter le produit actuel à l'historique quand il est chargé
  useEffect(() => {
    if (product) {
      addToHistory(product);
    }
  }, [product?.id]);

  // Timeout de sécurité pour éviter le chargement infini
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ [PublicVendorProductDetailPage] Timeout de sécurité déclenché');
        setLoading(false);
        setError('Le chargement prend trop de temps. Veuillez réessayer.');
      }
    }, 15000); // 15 secondes

    return () => clearTimeout(timeout);
  }, [loading]);

  // Charger les détails du produit ou du sticker
  useEffect(() => {
    const loadProduct = async () => {
      if (!actualProductId) {
        console.log('❌ [PublicVendorProductDetailPage] Pas de actualProductId');
        setError('ID de produit manquant');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const productIdNum = parseInt(actualProductId);

        // Si c'est un sticker, charger depuis l'API stickers
        if (isStickerRoute) {
          console.log('🔍 [PublicVendorProductDetailPage] Chargement sticker:', {
            stickerId: actualProductId,
            stickerIdNum: productIdNum,
            url: `/public/stickers/${productIdNum}`
          });

          const response = await publicStickerService.getPublicSticker(productIdNum);

          console.log('📡 [PublicVendorProductDetailPage] Réponse API sticker:', {
            success: response.success,
            hasData: !!response.data,
          });

          if (response.success && response.data) {
            const foundSticker = response.data;
            console.log('✅ [PublicVendorProductDetailPage] Sticker trouvé:', {
              id: foundSticker.id,
              name: foundSticker.name,
              price: foundSticker.price
            });

            setSticker(foundSticker);
            // Convertir le sticker en format VendorProduct pour réutiliser les composants
            const convertedProduct = publicStickerService.convertToVendorProduct(foundSticker);
            setProduct(convertedProduct);

            // Pour les stickers, définir la quantité minimale
            setQuantity(foundSticker.minimumOrder || 1);
          } else {
            console.log('❌ [PublicVendorProductDetailPage] Sticker non trouvé');
            setError('Sticker non trouvé');
          }
        } else {
          // Sinon, charger un produit vendeur normal
          console.log('🔍 [PublicVendorProductDetailPage] Chargement produit:', {
            productId: actualProductId,
            productIdNum,
            url: `/public/vendor-products/${productIdNum}`
          });

          // Utiliser l'API individuelle pour récupérer les détails du produit
          const response = await vendorProductsService.getProductById(productIdNum);

          console.log('📡 [PublicVendorProductDetailPage] Réponse API:', {
            success: response.success,
            hasData: !!response.data,
            message: response.message
          });

          if (response.success && response.data) {
            const foundProduct = response.data;
            console.log('✅ [PublicVendorProductDetailPage] Produit trouvé:', {
              id: foundProduct.id,
              name: foundProduct.vendorName,
              hasDesign: foundProduct.designApplication.hasDesign,
              designPositions: foundProduct.designPositions?.length || 0,
              colors: foundProduct.selectedColors.length
            });

            setProduct(foundProduct);

            // 🎨 Sélectionner la couleur par défaut (defaultColorId) ou la première couleur
            if (foundProduct.selectedColors && foundProduct.selectedColors.length > 0) {
            // Priorité 1: defaultColorId si défini
            const defaultColorId = (foundProduct as any).defaultColorId;
            if (defaultColorId) {
              const defaultColor = foundProduct.selectedColors.find(c => c.id === defaultColorId);
              if (defaultColor) {
                setSelectedColorId(defaultColor.id);
                console.log('🎨 [PublicVendorProductDetailPage] ✅ Couleur par défaut (defaultColorId) sélectionnée:', {
                  colorId: defaultColor.id,
                  colorName: defaultColor.name,
                  colorCode: defaultColor.colorCode
                });
              } else {
                // Fallback si defaultColorId n'existe pas dans selectedColors
                setSelectedColorId(foundProduct.selectedColors[0].id);
                console.warn('⚠️ [PublicVendorProductDetailPage] defaultColorId introuvable, utilisation de la première couleur');
              }
            } else {
              // Priorité 2: Première couleur si pas de defaultColorId
              setSelectedColorId(foundProduct.selectedColors[0].id);
              console.log('🎨 [PublicVendorProductDetailPage] ⚪ Pas de defaultColorId, première couleur sélectionnée:', foundProduct.selectedColors[0].id);
            }
          }

            // Sélectionner la première taille par défaut
            if (foundProduct.selectedSizes && foundProduct.selectedSizes.length > 0) {
              setSelectedSize(foundProduct.selectedSizes[0]);
              console.log('📏 [PublicVendorProductDetailPage] Taille par défaut sélectionnée:', foundProduct.selectedSizes[0]);
            }
          } else {
            console.log('❌ [PublicVendorProductDetailPage] Produit non trouvé ou erreur:', response.message);
            setError(response.message || 'Produit non trouvé');
          }
        }
      } catch (err) {
        console.error('❌ [PublicVendorProductDetailPage] Erreur complète:', err);
        setError(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      } finally {
        console.log('🏁 [PublicVendorProductDetailPage] Fin du chargement, setLoading(false)');
        setLoading(false);
      }
    };

    loadProduct();
  }, [actualProductId]);

  // 🔍 Logs de diagnostic pour le positionnement du design
  useEffect(() => {
    if (product) {
      console.log('🎨 [PublicVendorProductDetailPage] Diagnostic produit chargé:', {
        productId: product.id,
        vendorName: product.vendorName,
        hasDesign: product.designApplication?.hasDesign,
        designUrl: product.designApplication?.designUrl,
        designId: product.designId,
        designPositions: product.designPositions,
        designTransforms: product.designTransforms,
        adminProduct: {
          id: product.adminProduct?.id,
          name: product.adminProduct?.name,
          colorVariations: product.adminProduct?.colorVariations?.length || 0,
          firstColorImages: product.adminProduct?.colorVariations?.[0]?.images || []
        },
        selectedColors: product.selectedColors,
        selectedSizes: product.selectedSizes,
        images: product.images
      });

      // Log détaillé des délimitations pour chaque couleur
      if (product.adminProduct?.colorVariations) {
        product.adminProduct.colorVariations.forEach((colorVar, idx) => {
          console.log(`🎨 [Couleur ${idx + 1}] ${colorVar.name}:`, {
            colorId: colorVar.id,
            colorCode: colorVar.colorCode,
            images: colorVar.images.map(img => ({
              id: img.id,
              viewType: img.viewType,
              url: img.url,
              delimitations: img.delimitations
            }))
          });
        });
      }

      // 🎯 Définir le genre par défaut en fonction du produit actuel
      if (!selectedGenre && product.adminProduct?.genre) {
        const productGenre = product.adminProduct.genre as ProductGenre;
        setSelectedGenre(productGenre);
        console.log('🎯 [PublicVendorProductDetailPage] Genre par défaut défini:', productGenre);
      }
    }
  }, [product, selectedGenre]);

  // Charger les produits avec le même design via l'API /public/vendor-products/{id}/same-design, filtrés par genre
  useEffect(() => {
    const loadSameDesignProducts = async () => {
      if (!actualProductId || !selectedGenre) {
        console.log('⏭️ [PublicVendorProductDetailPage] Pas de productId ou genre, skip chargement');
        setSameDesignProducts([]);
        return;
      }

      setLoadingSimilar(true);
      setErrorSimilar(null);

      try {
        console.log('🔍 [PublicVendorProductDetailPage] Chargement produits même design:', {
          productId: actualProductId,
          genre: selectedGenre
        });

        // ✅ Utiliser le nouvel endpoint dédié
        const response = await vendorProductsService.getProductsWithSameDesign(Number(actualProductId));

        if (!response.success || !response.data) {
          console.warn('⚠️ [PublicVendorProductDetailPage] Aucun produit avec le même design');
          setSameDesignProducts([]);
          setLoadingSimilar(false);
          return;
        }

        console.log('🎨 [PublicVendorProductDetailPage] Produits même design récupérés:', {
          designId: response.data.designId,
          designName: response.data.designName,
          totalProducts: response.data.total
        });

        // Filtrer par genre sélectionné et exclure le produit actuel
        const filteredProducts = response.data.products.filter(p => {
          const productGenre = p.adminProduct?.genre as ProductGenre;
          return productGenre === selectedGenre && p.id !== Number(actualProductId);
        });

        // Limiter à 4 produits
        const displayedProducts = filteredProducts.slice(0, 4);

        setSameDesignProducts(displayedProducts);

        console.log('✅ [PublicVendorProductDetailPage] Produits filtrés et affichés:', {
          total: filteredProducts.length,
          displayed: displayedProducts.length,
          genre: selectedGenre
        });
      } catch (err) {
        console.error('❌ [PublicVendorProductDetailPage] Erreur chargement produits même design:', err);
        setErrorSimilar('Erreur lors du chargement des produits');
      } finally {
        setLoadingSimilar(false);
      }
    };

    loadSameDesignProducts();
  }, [selectedGenre, actualProductId]);

  // Charger les designs du vendeur
  useEffect(() => {
    const loadVendorDesigns = async () => {
      if (!product?.vendor?.id) return;

      setLoadingVendorDesigns(true);

      try {
        console.log('🔍 [PublicVendorProductDetailPage] Chargement designs du vendeur:', product.vendor.id);

        const response = await vendorProductsService.searchProducts({
          vendorId: product.vendor.id,
          limit: 20
        });

        console.log('📡 [PublicVendorProductDetailPage] Réponse designs vendeur:', {
          success: response.success,
          count: response.data?.length || 0
        });

        if (response.success && response.data) {
          // Extraire les designs uniques (basé sur designUrl)
          const designsMap = new Map<string, { id: number; imageUrl: string; name: string }>();

          response.data.forEach(p => {
            if (p.designApplication?.hasDesign && p.designApplication.designUrl && p.design?.id) {
              const designKey = p.designApplication.designUrl;
              if (!designsMap.has(designKey)) {
                designsMap.set(designKey, {
                  id: p.design.id,
                  imageUrl: p.designApplication.designUrl,
                  name: p.design.name || p.vendorName
                });
              }
            }
          });

          const uniqueDesigns = Array.from(designsMap.values());
          setVendorDesigns(uniqueDesigns);
          console.log('✅ [PublicVendorProductDetailPage] Designs du vendeur chargés:', uniqueDesigns.length);
        }
      } catch (err) {
        console.error('❌ [PublicVendorProductDetailPage] Erreur chargement designs vendeur:', err);
      } finally {
        setLoadingVendorDesigns(false);
      }
    };

    loadVendorDesigns();
  }, [product?.vendor?.id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleColorChange = (colorId: number) => {
    setSelectedColorId(colorId);
  };

  const handleAddToCart = async () => {
    // Pour les stickers, vérifier seulement le produit et la quantité
    if (isSticker) {
      if (!product || !sticker) {
        console.error('❌ [PublicVendorProduct] Sticker non chargé');
        return;
      }

      const minQuantity = sticker.minimumOrder || 1;
      const maxQuantity = sticker.maximumOrder || 10000;

      if (quantity < minQuantity) {
        console.error(`❌ [PublicVendorProduct] Quantité insuffisante: ${quantity} < ${minQuantity}`);
        return;
      }

      if (quantity > maxQuantity) {
        console.error(`❌ [PublicVendorProduct] Quantité trop élevée: ${quantity} > ${maxQuantity}`);
        return;
      }

      console.log('✅ [PublicVendorProduct] Validation sticker OK:', {
        quantity,
        minQuantity,
        maxQuantity,
        stickerId: sticker.id
      });
    } else {
      // Pour les produits normaux, vérifier couleur et taille
      if (!product || !selectedColorId || !selectedSize) {
        console.error('Produit, couleur ou taille non sélectionnée');
        return;
      }
    }

    const selectedColor = product.selectedColors?.find(c => c.id === selectedColorId);
    if (!selectedColor && !isSticker) {
      console.error('Couleur sélectionnée non trouvée');
      return;
    }

    setIsAddingToCart(true);

    try {
      // Simuler un petit délai pour l'effet visuel
      await new Promise(resolve => setTimeout(resolve, 800));

      // 🆕 Collecter TOUTES les délimitations de TOUTES les vues de la couleur sélectionnée
      const allDelimitations: any[] = [];
      const customizationIds: Record<string, number> = {};
      const designElementsByView: Record<string, any[]> = {};

      if (product.adminProduct && product.adminProduct.colorVariations) {
        const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === selectedColorId);
        if (colorVariation && colorVariation.images && colorVariation.images.length > 0) {
          // 🔄 Parcourir TOUTES les images/vues de cette couleur
          colorVariation.images.forEach((img, viewIndex) => {
            if (img.delimitations && img.delimitations.length > 0) {
              img.delimitations.forEach(delim => {
                // Ajouter les informations de vue à chaque délimitation
                allDelimitations.push({
                  ...delim,
                  viewId: img.id,
                  viewType: img.viewType,
                  imageUrl: img.url,
                  referenceWidth: delim.referenceWidth || img.naturalWidth || 1200,
                  referenceHeight: delim.referenceHeight || img.naturalHeight || 1200
                });
              });

              // 🆕 Créer la clé vue (colorId-viewId)
              const viewKey = `${selectedColorId}-${img.id}`;

              // 🆕 Pour les produits vendeurs, on n'a pas de vrais customizationIds du backend
              // On utilise une valeur factice ou on génère un ID basé sur le produit
              customizationIds[viewKey] = product.id * 1000 + viewIndex;

              // 🆕 Extraire les éléments de design depuis designTransforms ou créer un élément image du design
              if (product.designApplication?.hasDesign && product.designApplication.designUrl) {
                // Calculer la position du design pour cette vue
                const designPosition = product.designPositions && product.designPositions.length > 0
                  ? product.designPositions[0].position
                  : { x: 0.5, y: 0.5, scale: 0.8, rotation: 0 };

                // Vérifier si designPosition a les propriétés designWidth et designHeight
                const designWidth = 'designWidth' in designPosition ? (designPosition as any).designWidth : 200;
                const designHeight = 'designHeight' in designPosition ? (designPosition as any).designHeight : 200;

                // Créer un élément image pour le design
                designElementsByView[viewKey] = [{
                  id: `design-${product.id}-view-${viewIndex}`,
                  type: 'image',
                  imageUrl: product.designApplication.designUrl,
                  x: designPosition.x || 0.5,
                  y: designPosition.y || 0.5,
                  width: (designWidth || 200) * (designPosition.scale || 0.8),
                  height: (designHeight || 200) * (designPosition.scale || 0.8),
                  rotation: designPosition.rotation || 0,
                  zIndex: 1
                }];
              }
            }
          });
        }
      }

      console.log('🎨 [PublicVendorProduct] Données panier préparées:', {
        allDelimitationsCount: allDelimitations.length,
        customizationIdsKeys: Object.keys(customizationIds),
        designElementsByViewKeys: Object.keys(designElementsByView),
        selectedColorId,
        colorVariationImagesCount: product.adminProduct?.colorVariations?.find(cv => cv.id === selectedColorId)?.images.length
      });

      // Obtenir l'image mockup de la couleur sélectionnée
      let mockupUrl = product.images.primaryImageUrl;
      if (product.adminProduct && product.adminProduct.colorVariations) {
        const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === selectedColorId);
        if (colorVariation && colorVariation.images && colorVariation.images.length > 0) {
          const mockupImage = colorVariation.images.find(img => img.viewType === 'FRONT') || colorVariation.images[0];
          if (mockupImage) {
            mockupUrl = mockupImage.url;
          }
        }
      }

      // Extraire les positions du design si disponibles
      const designPositions = product.designPositions && product.designPositions.length > 0
        ? product.designPositions[0].position
        : undefined;

      // Préparer les métadonnées du design si un design est appliqué
      const designMetadata = product.designApplication?.hasDesign
        ? {
            designName: product.design?.name || product.vendorName || 'Design personnalisé',
            designCategory: 'CUSTOM',
            designImageUrl: product.designApplication?.designUrl,
            appliedAt: new Date().toISOString()
          }
        : undefined;

      // Extraire la première délimitation pour la sauvegarde (compatibilité)
      const delimitation = allDelimitations.length > 0 ? allDelimitations[0] : undefined;

      // Préparer les données du produit pour le formulaire de commande
      const productData: any = {
        id: product.id,
        productId: product.id, // ✅ Ajouter productId explicitement
        name: product.vendorName || product.adminProduct?.name || 'Produit sans nom',
        price: isSticker && sticker ? sticker.price : getPriceForSelectedSize(),
        imageUrl: isSticker && sticker ? sticker.imageUrl : mockupUrl, // ✅ Utiliser l'image du sticker
        vendorName: product.vendor?.shop_name || product.vendor?.fullName,
        quantity: quantity, // ✅ Quantité sélectionnée
      };

      // ✅ Pour les stickers : données simplifiées SANS vendorProductId
      if (isSticker && sticker) {
        productData.productType = 'STICKER';
        productData.stickerId = sticker.id;
        productData.color = 'N/A'; // Pas de couleur pour les stickers
        productData.colorCode = '#FFFFFF';
        // sticker.size est déjà une string au format "10x10cm"
        productData.size = typeof sticker.size === 'string' ? sticker.size : 'Standard';
        productData.designUrl = sticker.design?.imageUrl;
        productData.designId = sticker.design?.id;
        // ⚠️ NE PAS ajouter vendorProductId pour les stickers

        console.log('🎨 [PublicVendorProduct] Données sticker pour panier:', productData);
      } else {
        // ✅ Pour les produits normaux : ajouter vendorProductId
        productData.vendorProductId = product.id;
        // ✅ Pour les produits normaux : données complètes avec couleur/taille
        productData.color = selectedColor.name;
        productData.colorCode = selectedColor.colorCode;
        productData.colorVariationId = selectedColorId;
        productData.size = selectedSize.sizeName;
        productData.designUrl = product.designApplication?.designUrl;
        productData.designId = product.designId || undefined;
        productData.adminProductId = product.adminProduct?.id;
        productData.designScale = product.designApplication?.scale;
        productData.delimitations = allDelimitations;
        productData.selectedSize = selectedSize;
        productData.sizeId = selectedSize.id;
        productData.sizeName = selectedSize.sizeName;
        productData.mockupUrl = mockupUrl;
        productData.designPositions = designPositions;
        productData.designMetadata = designMetadata;
        productData.delimitation = delimitation;
        productData.customizationIds = Object.keys(customizationIds).length > 0 ? customizationIds : undefined;
        productData.designElementsByView = Object.keys(designElementsByView).length > 0 ? designElementsByView : undefined;

        console.log('🎨 [PublicVendorProduct] Données produit pour panier:', productData);
      }

      console.log('✅ [PublicVendorProduct] Produit ajouté au panier:', productData);

      // Ajouter au panier et ouvrir le panier latéral
      addToCart(productData);
      openCart();

    } catch (error) {
      console.error('Erreur lors de la préparation de la commande:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-gray-600">Chargement du produit...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Produit non trouvé'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const currentColor = product.selectedColors?.find(c => c.id === selectedColorId);

  return (
    <div className="min-h-screen bg-white">
      {/* Notification Favoris - Position fixe en haut */}
      {showFavoriteNotification && (
        <div
          className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out"
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          <div className="bg-white border-2 border-gray-900 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-3 min-w-[280px]">
            <div className="flex-shrink-0">
              <Heart className={`w-6 h-6 ${product && checkIsFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {favoriteNotificationMessage}
              </p>
            </div>
            <button
              onClick={() => setShowFavoriteNotification(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors">
            Accueil
          </button>
          <span>&gt;</span>
          <button onClick={() => navigate('/personnalisation')} className="hover:text-gray-900 transition-colors">
            Personnalisation
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">
            {product.vendorName || product.adminProduct?.name || 'Produit sans nom'}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Colonne gauche : Images du produit */}
          <div className="space-y-6">
            {/* Image principale avec zoom interactif */}
            <div
              className={`rounded-2xl aspect-square flex items-center justify-center border-0 relative ${
                isSticker ? 'bg-gray-200' : 'bg-white p-8'
              }`}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{
                overflow: 'hidden',
                cursor: isZooming ? 'zoom-in' : 'default'
              }}
            >
              {isSticker && sticker ? (
                // Pour les stickers : afficher l'image générée avec bordures
                <img
                  src={sticker.imageUrl}
                  alt={sticker.name}
                  className="w-full h-full object-cover transition-transform duration-200 ease-out"
                  style={{
                    transform: isZooming ? 'scale(2)' : 'scale(1)',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                  }}
                />
              ) : product.finalImages && product.finalImages.length > 0 ? (
                // ✅ Utiliser les finalImages si disponibles (produit + design déjà appliqué)
                (() => {
                  const finalImage = product.finalImages.find(fi => fi.colorId === selectedColorId) || product.finalImages[0];
                  return (
                    <img
                      src={finalImage.finalImageUrl}
                      alt={`${product.vendorName} - ${finalImage.colorName}`}
                      className="w-full h-full object-contain transition-transform duration-200 ease-out"
                      style={{
                        transform: isZooming ? 'scale(2)' : 'scale(1)',
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                      }}
                    />
                  );
                })()
              ) : (
                // Fallback : utiliser SimpleProductPreview
                <div
                  className="w-full h-full transition-transform duration-200 ease-out"
                  style={{
                    transform: isZooming ? 'scale(2)' : 'scale(1)',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                  }}
                >
                  <SimpleProductPreview
                    product={product}
                    onColorChange={handleColorChange}
                    showColorSlider={false}
                    showDelimitations={false}
                    onProductClick={() => {}}
                    hideValidationBadges={false}
                    initialColorId={selectedColorId}
                    imageObjectFit="contain"
                  />
                </div>
              )}

              {/* Indicateur de zoom */}
              <div
                className={`absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs transition-opacity duration-200 pointer-events-none flex items-center gap-1.5 ${
                  isZooming ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
                Zoom x2
              </div>
            </div>

            {/* Miniatures des vues */}
            <div className="grid grid-cols-6 gap-3">
              {isSticker && sticker ? (
                // Pour les stickers : miniature du sticker et du design source
                <>
                  {/* Miniature du sticker avec bordures */}
                  <div className="relative aspect-square">
                    <div className="w-full h-full bg-white rounded-lg overflow-hidden border-2 border-blue-500 ring-2 ring-blue-200">
                      <img
                        src={sticker.imageUrl}
                        alt={sticker.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    {/* Indicateur de sélection principale */}
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center z-20">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* Miniature du design source (sans bordures) */}
                  {sticker.design?.imageUrl && (
                    <div className="aspect-square bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center relative overflow-hidden">
                      <div className="w-full h-full relative bg-white p-4">
                        <img
                          src={sticker.design.imageUrl}
                          alt="Design original"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : product.finalImages && product.finalImages.length > 0 ? (
                // ✅ Pour les produits normaux : utiliser les finalImages
                product.finalImages.map((finalImage, index) => (
                  <div
                    key={finalImage.id}
                    className={`relative aspect-square cursor-pointer ${
                      selectedColorId === finalImage.colorId
                        ? 'border-2 border-blue-500 ring-2 ring-blue-200'
                        : 'border-2 border-gray-200 hover:border-gray-300'
                    } rounded-lg overflow-hidden`}
                    onClick={() => handleColorChange(finalImage.colorId)}
                  >
                    <img
                      src={finalImage.finalImageUrl}
                      alt={`${product.vendorName} - ${finalImage.colorName}`}
                      className="w-full h-full object-contain bg-white"
                    />
                    {selectedColorId === finalImage.colorId && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center z-20">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Fallback : miniatures classiques avec SimpleProductPreview
                <>
                  <div className="relative aspect-square">
                    <SimpleProductPreview
                      product={product}
                      showColorSlider={false}
                      showDelimitations={false}
                      onProductClick={() => {}}
                      hideValidationBadges={false}
                      initialColorId={selectedColorId}
                      imageObjectFit="contain"
                      className="border-2 border-blue-500 ring-2 ring-blue-200"
                    />
                    {/* Indicateur de sélection principale */}
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center z-20">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* Miniature du design seul */}
                  {product.designApplication?.hasDesign && product.designApplication.designUrl && (
                    <div className="aspect-square bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center relative overflow-hidden">
                      <div className="w-full h-full relative bg-white p-4">
                        <img
                          src={product.designApplication.designUrl}
                          alt="Design"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Colonne droite : Détails du produit */}
          <div className="space-y-6">
            {/* En-tête produit */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3" style={{ fontStyle: 'italic' }}>
                {product.vendorName || product.adminProduct?.name || 'Produit sans nom'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mb-2" style={{ fontStyle: 'italic' }}>Détails</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4].map((star) => (
                    <span key={star} className="text-yellow-400 text-xs sm:text-sm md:text-base">★</span>
                  ))}
                  <span className="text-gray-300 text-xs sm:text-sm md:text-base">★</span>
                </div>
                <span className="text-xs text-gray-500">1.2k (ou 200) Les top avis</span>
              </div>
            </div>

            {/* Prix */}
            <div className="pb-6">
              <div className="mb-2">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900" style={{ fontStyle: 'italic' }}>
                  {formatPrice(isSticker && sticker ? sticker.price : getPriceForSelectedSize())}
                </p>
                {selectedSize && product?.sizePricing && product.sizePricing.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1" style={{ fontStyle: 'italic' }}>
                    Prix pour la taille {selectedSize.sizeName}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500" style={{ fontStyle: 'italic' }}>
                {isSticker ? 'Prix unitaire' : 'Prix de base, hors personnalisation'}
              </p>
            </div>

            {/* Couleur sélectionnée - masquée pour les stickers */}
            {!isSticker && (
              <div className="pb-6">
                <p className="text-xs sm:text-sm text-gray-700 mb-4" style={{ fontStyle: 'italic' }}>
                  couleur selectionnée : <span className="text-gray-900 font-semibold">{currentColor?.name?.toUpperCase() || 'SÉLECTIONNEZ UNE COULEUR'}</span>
                </p>

                {/* Section avec checkbox */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-900 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-gray-900">
                    Couleur selectionnée : <span className="font-semibold">{currentColor?.name?.toUpperCase() || 'BLEU'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {product.selectedColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorChange(color.id)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all relative ${
                        color.id === selectedColorId
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    >
                      {color.id === selectedColorId && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Taille - masquée pour les stickers */}
            {!isSticker && (
              <div className="pb-6">
                {/* Section avec checkbox */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-900 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-gray-900">
                    Taille selectionnée : <span className="font-semibold">{selectedSize?.sizeName || 'Sélectionner une taille'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {product.selectedSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg border-2 font-medium transition-all ${
                        selectedSize?.id === size.id
                          ? 'border-blue-500 bg-blue-400 text-white'
                          : 'border-gray-900 bg-white text-gray-900'
                      }`}
                    >
                      {size.sizeName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantité - uniquement pour les stickers */}
            {isSticker && sticker && (
              <div className="pb-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-900 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-gray-900">
                    Quantité : <span className="font-semibold">{quantity}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(sticker.minimumOrder || 1, quantity - 1))}
                    disabled={quantity <= (sticker.minimumOrder || 1)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-xl transition-colors ${
                      quantity <= (sticker.minimumOrder || 1)
                        ? 'border-gray-300 text-gray-300 cursor-not-allowed'
                        : 'border-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => {
                      const maxQuantity = sticker.maximumOrder || 10000;
                      setQuantity(Math.min(maxQuantity, quantity + 1));
                    }}
                    disabled={quantity >= (sticker.maximumOrder || 10000)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-xl transition-colors ${
                      quantity >= (sticker.maximumOrder || 10000)
                        ? 'border-gray-300 text-gray-300 cursor-not-allowed'
                        : 'border-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    +
                  </button>
                </div>

                {/* Informations min/max */}
                <div className="mt-3 space-y-1">
                  {sticker.minimumOrder > 1 && (
                    <p className="text-xs text-gray-600">
                      Minimum : <span className="font-semibold">{sticker.minimumOrder}</span> unité{sticker.minimumOrder > 1 ? 's' : ''}
                    </p>
                  )}
                  {sticker.maximumOrder && sticker.maximumOrder < 10000 && (
                    <p className="text-xs text-gray-600">
                      Maximum : <span className="font-semibold">{sticker.maximumOrder}</span> unités
                    </p>
                  )}
                  {quantity > 1 && (
                    <p className="text-sm text-gray-900 font-medium mt-2">
                      Total : <span className="text-primary">{formatPrice(sticker.price * quantity)}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Boutons commander et favoris */}
            <div className="pt-4 space-y-3">
              {/* Bouton Ajouter au panier */}
              <button
                onClick={handleAddToCart}
                disabled={
                  isAddingToCart ||
                  (!isSticker && (!selectedColorId || !selectedSize)) ||
                  (isSticker && sticker && (
                    quantity < (sticker.minimumOrder || 1) ||
                    quantity > (sticker.maximumOrder || 10000)
                  ))
                }
                className={`w-full flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                  isAddingToCart
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : (!isSticker && (!selectedColorId || !selectedSize)) ||
                      (isSticker && sticker && (
                        quantity < (sticker.minimumOrder || 1) ||
                        quantity > (sticker.maximumOrder || 10000)
                      ))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 shadow-md hover:shadow-lg'
                }`}
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Préparation de la commande...</span>
                    <span className="sm:hidden">En cours...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    <span className="hidden sm:inline">Ajouter au panier</span>
                    <span className="sm:hidden">Ajouter</span>
                  </>
                )}
              </button>

              {/* Bouton Ajouter aux Favoris */}
              <button
                onClick={handleToggleFavorite}
                className={`w-full flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                  product && checkIsFavorite(product.id)
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg'
                    : 'bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 shadow-md hover:shadow-lg'
                }`}
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-all ${
                    product && checkIsFavorite(product.id) ? 'fill-white' : 'fill-none'
                  }`}
                />
                <span className="hidden sm:inline">
                  {product && checkIsFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </span>
                <span className="sm:hidden">
                  {product && checkIsFavorite(product.id) ? 'Favoris ✓' : 'Favoris'}
                </span>
              </button>

              {/* Messages d'erreur */}
              {!isSticker && !selectedColorId && (
                <p className="text-red-500 text-xs sm:text-sm mt-2">
                  Veuillez sélectionner une couleur
                </p>
              )}

              {!isSticker && !selectedSize && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">
                  Veuillez sélectionner une taille
                </p>
              )}

              {isSticker && sticker && (
                <>
                  {quantity < (sticker.minimumOrder || 1) && (
                    <p className="text-red-500 text-xs sm:text-sm mt-2">
                      ⚠️ Quantité minimale : {sticker.minimumOrder} unités
                    </p>
                  )}
                  {quantity > (sticker.maximumOrder || 10000) && (
                    <p className="text-red-500 text-xs sm:text-sm mt-2">
                      ⚠️ Quantité maximale : {sticker.maximumOrder} unités
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Description / Caractéristiques / Avis - Pleine largeur */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-12">
          <div className="flex gap-6 border-b border-gray-200 mb-6">
            <button className="pb-3 px-2 border-b-2 border-blue-500 text-blue-600 font-semibold">
              Description
            </button>
            <button className="pb-3 px-2 text-gray-600 hover:text-gray-900 transition-colors">
              Caractéristiques du produit
            </button>
            <button className="pb-3 px-2 text-gray-600 hover:text-gray-900 transition-colors">
              Avis
            </button>
          </div>

          <div className="text-gray-600 text-sm leading-relaxed space-y-4">
            <p>
              {product.adminProduct?.description ||
              "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit."}
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam.
            </p>
          </div>
        </div>

        {/* Section Trouver sur d'autres produits - Pleine largeur */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6" style={{ fontStyle: 'italic' }}>
              Trouver sur d'autres produits
            </h2>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
              <button
                onClick={() => setSelectedGenre('HOMME')}
                className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedGenre === 'HOMME'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Homme
              </button>
              <button
                onClick={() => setSelectedGenre('FEMME')}
                className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedGenre === 'FEMME'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">Femme</span>
                <span className="sm:hidden">F</span>
              </button>
              <button
                onClick={() => setSelectedGenre('BEBE')}
                className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedGenre === 'BEBE'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">Bébés</span>
                <span className="sm:hidden">B</span>
              </button>
              <button
                onClick={() => setSelectedGenre('UNISEXE')}
                className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedGenre === 'UNISEXE'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">Unisexe</span>
                <span className="sm:hidden">U</span>
              </button>
              <button
                onClick={() => setSelectedGenre('AUTOCOLLANT')}
                className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedGenre === 'AUTOCOLLANT'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">Autocollants</span>
                <span className="sm:hidden">A</span>
              </button>
              <button
                onClick={() => setSelectedGenre('TABLEAU')}
                className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedGenre === 'TABLEAU'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">Tableaux</span>
                <span className="sm:hidden">T</span>
              </button>
            </div>

            {/* Grille de produits */}
            {loadingSimilar ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-gray-600">Chargement des produits...</span>
                </div>
              </div>
            ) : errorSimilar ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{errorSimilar}</p>
              </div>
            ) : sameDesignProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun autre produit avec ce design pour le genre {selectedGenre}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {sameDesignProducts.map((sameDesignProduct) => (
                  <div
                    key={sameDesignProduct.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/vendor-product-detail/${sameDesignProduct.id}`)}
                  >
                    {/* ✅ Utiliser finalUrlImage depuis colorVariations ou finalImages, sinon SimpleProductPreview */}
                    <div className="aspect-square bg-white rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-hidden relative border border-gray-200 hover:shadow-lg transition-shadow">
                      {(() => {
                        // 1. Essayer finalImages d'abord
                        if (sameDesignProduct.finalImages && sameDesignProduct.finalImages.length > 0) {
                          return (
                            <img
                              src={sameDesignProduct.finalImages[0]?.finalImageUrl}
                              alt={`${sameDesignProduct.vendorName} - ${sameDesignProduct.finalImages[0]?.colorName}`}
                              className="w-full h-full object-contain"
                            />
                          );
                        }

                        // 2. Essayer finalUrlImage depuis la première colorVariation
                        const firstColorVariation = sameDesignProduct.adminProduct?.colorVariations?.[0];
                        if ((firstColorVariation as any)?.finalUrlImage) {
                          return (
                            <img
                              src={(firstColorVariation as any).finalUrlImage}
                              alt={`${sameDesignProduct.vendorName} - ${firstColorVariation.name}`}
                              className="w-full h-full object-contain"
                            />
                          );
                        }

                        // 3. Fallback sur SimpleProductPreview
                        return (
                          <SimpleProductPreview
                            product={sameDesignProduct}
                            showColorSlider={false}
                            showDelimitations={false}
                            onProductClick={() => {}}
                            hideValidationBadges={false}
                            imageObjectFit="contain"
                            initialColorId={(sameDesignProduct as any).defaultColorId ?? sameDesignProduct.selectedColors[0]?.id}
                          />
                        );
                      })()}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">
                      {sameDesignProduct.vendorName || sameDesignProduct.adminProduct?.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      <span className="font-bold">{formatPrice(sameDesignProduct.price)}</span>
                    </p>
                    {/* Description du produit */}
                    {sameDesignProduct.adminProduct?.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {sameDesignProduct.adminProduct.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Détails du design */}
        {product.designApplication?.hasDesign && product.design && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <h2 className="text-2xl lg:text-3xl font-bold mb-8" style={{ color: '#00A5E0', fontStyle: 'italic' }}>
              Détails du design
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Colonne gauche - Info du design */}
              <div>
                <div className="flex gap-6 mb-6">
                  {/* Miniature du design */}
                  <div className="w-32 h-32 flex-shrink-0">
                    <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative border-2 border-gray-200">
                      {product.designApplication.designUrl ? (
                        <img
                          src={product.designApplication.designUrl}
                          alt={product.design.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 border-2 border-gray-300" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info du design */}
                  <div className="flex-1">
                    <p className="text-base text-gray-700 mb-1">Nom du design</p>
                    <p className="text-base font-bold text-gray-900 mb-2" style={{ fontStyle: 'italic' }}>
                      {product.design.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Designer : <span style={{ color: '#FF1493' }}>{product.vendor?.shop_name || product.vendor?.fullName}</span>
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {product.design.description || "Description du design non disponible."}
                  </p>
                  {product.design.tags && product.design.tags.length > 0 && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Tags: {product.design.tags.join(', ')}
                    </p>
                  )}
                </div>

                {/* Tags clients */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Les clients ont également recherché :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Amour', 'Chérie', 'Sport', 'Nichop', 'Anniversaire', 'Date', 'Amour', 'Chérie', 'Sport', 'Nichop', 'Anniversaire', 'Date'].map((tag, index) => (
                      <button
                        key={index}
                        className="px-4 py-1.5 border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colonne droite - Grande image du design avec slider */}
              <div>
                <div className="w-full aspect-square bg-white rounded-2xl overflow-hidden relative border-2 border-gray-200">
                  {loadingVendorDesigns ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : vendorDesigns.length > 0 ? (
                    <>
                      {/* Image du design actuel */}
                      <img
                        src={vendorDesigns[currentDesignIndex].imageUrl}
                        alt={vendorDesigns[currentDesignIndex].name}
                        className="w-full h-full object-contain p-8"
                      />

                      {/* Texte en bas à droite */}
                      <div className="absolute bottom-6 right-6 text-right bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <p className="text-white text-sm mb-1">plus de design fait par:</p>
                        <p className="text-white text-base font-semibold underline cursor-pointer hover:text-white/90 transition-colors">
                          {product.vendor?.shop_name || product.vendor?.fullName}
                        </p>
                      </div>

                      {/* Boutons de navigation - seulement si plusieurs designs */}
                      {vendorDesigns.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentDesignIndex((prev) => (prev === 0 ? vendorDesigns.length - 1 : prev - 1))}
                            className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15 18l-6-6 6-6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setCurrentDesignIndex((prev) => (prev === vendorDesigns.length - 1 ? 0 : prev + 1))}
                            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>

                          {/* Indicateurs de pagination */}
                          <div className="absolute bottom-6 left-6 flex gap-2">
                            {vendorDesigns.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentDesignIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentDesignIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-500">Aucun autre design du vendeur</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Historique */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
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

          {/* Grille historique */}
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
                  {/* ✅ Utiliser finalImage si disponible, sinon SimpleProductPreview */}
                  <div className="aspect-square bg-white rounded-2xl overflow-hidden relative border border-gray-200 hover:shadow-lg transition-shadow">
                    {historyProduct.finalImages && historyProduct.finalImages.length > 0 ? (
                      <img
                        src={historyProduct.finalImages[0]?.finalImageUrl}
                        alt={`${historyProduct.vendorName} - ${historyProduct.finalImages[0]?.colorName}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <SimpleProductPreview
                        product={historyProduct}
                        showColorSlider={false}
                        showDelimitations={false}
                        onProductClick={() => {}}
                        hideValidationBadges={false}
                        imageObjectFit="contain"
                        initialColorId={(historyProduct as any).defaultColorId ?? historyProduct.selectedColors[0]?.id}
                      />
                    )}

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
      </div>

      {/* ServiceFeatures section */}
      <ServiceFeatures />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicVendorProductDetailPage;
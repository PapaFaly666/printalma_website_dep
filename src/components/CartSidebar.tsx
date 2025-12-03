import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem } from '../types/cart';
import DesignPositionService from '../services/DesignPositionService';
import { useAuth } from '../contexts/AuthContext';
import { vendorProductService } from '../services/vendorProductService';
import { formatPriceInFRF as formatPrice } from '../utils/priceUtils';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

// Interface pour les délimitations (similaire à SimpleProductPreview)
interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

// Interface pour les métriques d'image
interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
}

// Composant pour afficher un produit avec design (similaire à SimpleProductPreview)
const ProductWithDesign: React.FC<{
  item: CartItem;
  user: any;
}> = ({ item, user }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);

  // 🆕 État pour gérer la vue sélectionnée
  const [selectedViewIndex, setSelectedViewIndex] = useState(0);

  // 🆕 Récupérer toutes les vues disponibles depuis les customizationIds
  // 🔧 Filtrer par couleur sélectionnée et dédupliquer par viewId
  const availableViews = React.useMemo(() => {
    if (!item.customizationIds) return [];

    // Map pour dédupliquer par viewId
    const uniqueViewsMap = new Map<number, {
      viewKey: string;
      colorId: number;
      viewId: number;
      viewType: string;
      delimitation: any;
    }>();

    Object.keys(item.customizationIds).forEach(viewKey => {
      const [colorId, viewId] = viewKey.split('-').map(Number);

      // 🔧 Si colorVariationId est défini, filtrer pour ne garder que cette couleur
      if (item.colorVariationId && colorId !== item.colorVariationId) {
        console.log(`🎨 [CartSidebar] Vue ${viewKey} ignorée (couleur ${colorId} != ${item.colorVariationId})`);
        return;
      }

      // Ne garder que la première occurrence de chaque viewId
      if (!uniqueViewsMap.has(viewId)) {
        // Trouver la délimitation correspondante
        const delimitation = item.delimitations?.find((d: any) => d.viewId === viewId);

        uniqueViewsMap.set(viewId, {
          viewKey,
          colorId,
          viewId,
          viewType: delimitation?.viewType || 'OTHER',
          delimitation
        });

        console.log(`✅ [CartSidebar] Vue ${viewKey} ajoutée (${delimitation?.viewType || 'OTHER'})`);
      }
    });

    const result = Array.from(uniqueViewsMap.values());
    console.log(`📦 [CartSidebar] ${result.length} vue(s) disponible(s) pour la couleur ${item.colorVariationId || 'toutes'}`);
    return result;
  }, [item.customizationIds, item.delimitations, item.colorVariationId]);

  // Vue actuellement sélectionnée
  const currentView = availableViews[selectedViewIndex];

  // 🆕 Récupérer les éléments de design pour la vue actuelle uniquement
  const getCurrentViewElements = () => {
    if (!currentView) return [];

    // Utiliser le nouveau système organisé par vue
    if (item.designElementsByView) {
      // 🔧 Chercher les éléments pour cette vue, peu importe la couleur
      // Essayer d'abord avec le viewKey exact
      let elements = item.designElementsByView[currentView.viewKey];

      // Si pas trouvé, chercher par viewId dans tous les viewKey disponibles
      if (!elements || elements.length === 0) {
        for (const [key, value] of Object.entries(item.designElementsByView)) {
          const [, viewId] = key.split('-').map(Number);
          if (viewId === currentView.viewId && value.length > 0) {
            elements = value;
            break;
          }
        }
      }

      return elements || [];
    }

    // Fallback sur l'ancien système (pour compatibilité)
    return item.designElements || [];
  };

  // Traduire le viewType en français
  const getViewName = (viewType: string, totalViews: number = 1): string => {
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

    // Sinon, utiliser le viewType tel quel ou 'Vue' par défaut
    return viewType || 'Vue';
  };

  // Calculer les métriques d'image
  const calculateImageMetrics = () => {
    if (!imgRef.current || !containerRef.current) return null;

    const img = imgRef.current;
    const container = containerRef.current;

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const containerRect = container.getBoundingClientRect();

    // Calculer les dimensions d'affichage (object-fit: contain)
    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = originalWidth / originalHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageRatio > containerRatio) {
      // Image plus large que le container
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imageRatio;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      // Image plus haute que le container
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imageRatio;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }

    const scale = displayWidth / originalWidth;

    return {
      originalWidth,
      originalHeight,
      displayWidth,
      displayHeight,
      canvasScale: scale,
      canvasOffsetX: offsetX,
      canvasOffsetY: offsetY
    };
  };

  
  // Obtenir la position du design depuis localStorage (EXACTEMENT comme SimpleProductPreview)
  const getDesignPosition = () => {
    console.log('🎨 [CartSidebar] getDesignPosition - Début de la fonction', {
      designId: item.designId,
      adminProductId: item.adminProductId,
      userId: user?.id
    });

    if (!item.designId || !user?.id || !item.adminProductId) {
      console.log('📍 [CartSidebar] Informations manquantes, position par défaut');
      return {
        x: 0,
        y: 0,
        scale: item.designScale || 0.8,
        rotation: 0,
        designWidth: undefined,
        designHeight: undefined,
        designScale: item.designScale || 0.8,
        constraints: {},
        source: 'default',
        sizeId: item.selectedSize?.id || item.sizeId,
        sizeName: item.selectedSize?.sizeName || item.sizeName || item.size
      };
    }

    // Utiliser la taille pour récupérer la position spécifique à cette taille
    const sizeId = item.selectedSize?.id || item.sizeId;
    const sizeName = item.selectedSize?.sizeName || item.sizeName || item.size;

    // Essayer localStorage directement (dans le panier, on n'a pas accès aux données API directement)
    const localStorageData = DesignPositionService.getPosition(item.designId, item.adminProductId, user.id);
    if (localStorageData && localStorageData.position) {
      const localPosition = localStorageData.position as any;
      console.log('📍 [CartSidebar] Position depuis localStorage:', localPosition);

      const result = {
        x: localPosition.x || 0,
        y: localPosition.y || 0,
        scale: localPosition.scale || item.designScale || 0.8,
        rotation: localPosition.rotation || 0,
        designWidth: localPosition.designWidth,
        designHeight: localPosition.designHeight,
        designScale: localPosition.designScale || item.designScale || 0.8,
        constraints: localPosition.constraints || {},
        source: 'localStorage',
        sizeId,
        sizeName
      };

      // Synchroniser vers la base de données si on a un ID de produit vendeur
      if (item.id && typeof item.id === 'number') {
        console.log('🔄 [CartSidebar] DÉCLENCHEMENT de la synchronisation automatique...');
        // syncLocalStorageToDatabase(item.id, item.designId, result); // TODO: Implementer si nécessaire
      }

      return result;
    }

    console.log('📍 [CartSidebar] Position par défaut (pas de données localStorage)');
    return {
      x: 0,
      y: 0,
      scale: item.designScale || 0.8,
      rotation: 0,
      designWidth: undefined,
      designHeight: undefined,
      designScale: item.designScale || 0.8,
      constraints: {},
      source: 'default',
      sizeId,
      sizeName
    };
  };

  // Convertir les coordonnées de délimitation vers les coordonnées d'affichage
  const computePxPosition = (delim: DelimitationData) => {
    if (!imageMetrics || !containerRef.current) return { left: 0, top: 0, width: 0, height: 0 };

    // Détection automatique du type de coordonnées
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = imageMetrics.originalWidth || 1200;
    const imgH = imageMetrics.originalHeight || 1200;

    // Conversion en pourcentage si nécessaire
    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    // Utiliser les dimensions du conteneur
    const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

    // Calcul responsive
    const imgRatio = imgW / imgH;
    const contRatio = contW / contH;

    let dispW: number, dispH: number, offsetX: number, offsetY: number;
    if (imgRatio > contRatio) {
      dispW = contW;
      dispH = contW / imgRatio;
      offsetX = 0;
      offsetY = (contH - dispH) / 2;
    } else {
      dispH = contH;
      dispW = contH * imgRatio;
      offsetX = (contW - dispW) / 2;
      offsetY = 0;
    }

    return {
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };
  };

  // Observer les changements
  useEffect(() => {
    if (imgRef.current && imageLoaded && containerRef.current) {
      const metrics = calculateImageMetrics();
      setImageMetrics(metrics);
    }
  }, [imageLoaded]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (imageLoaded) {
        const metrics = calculateImageMetrics();
        setImageMetrics(metrics);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [imageLoaded]);

  const designPosition = getDesignPosition();
  const currentViewElements = getCurrentViewElements();
  const currentDelimitation = currentView?.delimitation;

  // 🆕 Obtenir l'URL de l'image pour la vue actuelle
  const currentImageUrl = currentDelimitation?.imageUrl || item.imageUrl;

  // Log de débogage pour le design
  useEffect(() => {
    console.log('🔍 [CartSidebar] ProductWithDesign - Item:', {
      id: item.id,
      availableViewsCount: availableViews.length,
      selectedViewIndex,
      currentView: currentView ? {
        viewKey: currentView.viewKey,
        viewType: currentView.viewType,
        hasDelimitation: !!currentView.delimitation
      } : null,
      hasDesignElementsByView: !!item.designElementsByView,
      currentViewElementsCount: currentViewElements.length,
      customizationIds: item.customizationIds
    });

    if (currentViewElements.length > 0) {
      console.log('🎨 [CartSidebar] Current View Elements:', {
        viewKey: currentView?.viewKey,
        count: currentViewElements.length,
        elements: currentViewElements.map((el, idx) => ({
          index: idx,
          type: el.type,
          text: el.text?.substring(0, 20),
          x: el.x,
          y: el.y
        }))
      });
    }
  }, [item, currentView, currentViewElements, selectedViewIndex]);

  return (
    <div className="relative flex flex-col gap-1">
      {/* Conteneur principal de l'image */}
      <div className="relative w-32 h-32 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
        <div
          ref={containerRef}
          className="relative w-full h-full"
        >
          {/* Image du produit - Vue actuelle */}
          <img
            key={currentImageUrl} // 🆕 Force reload quand on change de vue
            ref={imgRef}
            src={currentImageUrl}
            alt={item.name}
            className="w-full h-full object-contain rounded"
            onLoad={() => setImageLoaded(true)}
          />

        {/* 🆕 Personnalisations superposées - Par vue */}
        {currentViewElements.length > 0 && currentDelimitation && (() => {
          if (!containerRef.current) return null;

          const rect = containerRef.current.getBoundingClientRect();
          console.log('🎨 [CartSidebar] Affichage personnalisations vue actuelle');
          console.log('📐 [CartSidebar] Canvas rect:', { width: rect.width, height: rect.height });

          // Dimensions de référence de l'image produit
          const refWidth = currentDelimitation.referenceWidth || 800;
          const refHeight = currentDelimitation.referenceHeight || 800;

          // Calculer le ratio de scale
          const scaleX = rect.width / refWidth;
          const scaleY = rect.height / refHeight;
          const scale = Math.min(scaleX, scaleY);

          console.log('🔲 [CartSidebar] Scale calculation:', {
            viewKey: currentView?.viewKey,
            containerSize: { width: rect.width, height: rect.height },
            referenceSize: { width: refWidth, height: refHeight },
            scale: scale.toFixed(3)
          });

          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 2,
              }}
            >
              {currentViewElements.map((element: any, idx: number) => {
                // Position absolue en pixels dans le conteneur
                const left = element.x * rect.width;
                const top = element.y * rect.height;

                // Appliquer le scale aux dimensions de l'élément
                const scaledWidth = element.width * scale;
                const scaledHeight = element.height * scale;

                // Calculer la taille de police scalée
                const scaledFontSize = element.type === 'text'
                  ? (element.fontSize || 24) * scale
                  : 0;

                const rotation = element.rotation || 0;

                console.log(`🎨 [CartSidebar] Élément ${idx} (responsive):`, {
                  type: element.type,
                  position: { x: element.x.toFixed(3), y: element.y.toFixed(3) },
                  pixelPosition: { left: left.toFixed(1), top: top.toFixed(1) },
                  originalSize: { w: element.width, h: element.height },
                  scaledSize: { w: scaledWidth.toFixed(1), h: scaledHeight.toFixed(1) },
                  fontSize: element.type === 'text' ? scaledFontSize.toFixed(1) : 'N/A',
                  rotation
                });

                return (
                  <div
                    key={`element-${idx}`}
                    style={{
                      position: 'absolute',
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${scaledWidth}px`,
                      height: `${scaledHeight}px`,
                      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      zIndex: element.zIndex || 0,
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
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          lineHeight: 1,
                        }}
                      >
                        {element.text}
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
          );
        })()}

        </div>
      </div>

      {/* 🆕 Navigation entre les vues (si plusieurs vues disponibles) */}
      {availableViews.length > 1 && (
        <div className="flex items-center justify-center gap-1">
          {availableViews.map((view, index) => (
            <button
              key={view.viewKey}
              onClick={() => setSelectedViewIndex(index)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                selectedViewIndex === index
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={getViewName(view.viewType, availableViews.length)}
            >
              {getViewName(view.viewType, availableViews.length)}
            </button>
          ))}
        </div>
      )}

      {/* Badge pour indiquer les personnalisations */}
      {availableViews.length > 0 && (
        <div className="text-center text-[10px] text-gray-500">
          {availableViews.length} vue{availableViews.length > 1 ? 's' : ''} personnalisée{availableViews.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const { user } = useAuth();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Overlay avec fond semi-transparent et backdrop blur */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panier latéral avec animation slide */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* En-tête du panier */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-2xl">
                <ShoppingCart className="w-5 h-5 text-gray-900" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Mon Panier ({totalItems})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-2xl transition-all duration-200 hover:scale-110"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Liste des produits */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {items.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-lg font-semibold mb-2">Votre panier est vide</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Découvrez nos produits et designs personnalisés pour commencer vos achats
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-2.5 rounded-2xl font-semibold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Découvrir les produits
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
                    <div className="flex gap-4">
                      {/* Image du produit avec design intégré */}
                      <ProductWithDesign item={item} user={user} />

                      {/* Détails du produit */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                          {item.name}
                        </h3>
                        {item.vendorName && (
                          <p className="text-xs text-gray-500 mb-1">
                            Par {item.vendorName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                              style={{ backgroundColor: item.colorCode }}
                            />
                            <span className="truncate">{item.color}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="truncate">
                            Taille {item.selectedSize?.sizeName || item.sizeName || item.size}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 text-base">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Contrôles */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                          aria-label="Supprimer l'article"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>

                        <div className="flex items-center gap-1 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-l-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3 text-gray-600" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-r-xl transition-colors"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    </div>
                ))}
              </div>
            )}
          </div>

          {/* Pied du panier */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
              {/* Résumé du total */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})</span>
                  <span className="text-base font-semibold text-gray-900">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="space-y-3">
                <button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-3.5 rounded-2xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Commander maintenant
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-white text-gray-700 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
                >
                  Continuer mes achats
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Paiement sécurisé • Frais de port calculés à l'étape suivante
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
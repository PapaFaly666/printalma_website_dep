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
        syncLocalStorageToDatabase(item.id, item.designId, result);
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
  const delimitations = item.delimitations || [];

  // Log de débogage pour le design (comme SimpleProductPreview)
  useEffect(() => {
    console.log('🔍 [CartSidebar] ProductWithDesign - Item:', {
      id: item.id,
      hasDesign: !!item.designUrl,
      designUrl: item.designUrl,
      designId: item.designId,
      delimitations: delimitations.length,
      imageMetrics: !!imageMetrics,
      hasDesignElements: !!item.designElements,
      designElementsCount: item.designElements?.length || 0,
      customizationId: item.customizationId
    });

    // Log détaillé pour les designElements (nouveau système)
    if (item.designElements && item.designElements.length > 0) {
      console.log('🎨 [CartSidebar] DesignElements (nouveau système):', {
        count: item.designElements.length,
        elements: item.designElements.map((el, idx) => ({
          index: idx,
          type: el.type,
          text: el.text?.substring(0, 20),
          imageUrl: el.imageUrl?.substring(0, 50),
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height
        })),
        delimitations: delimitations,
        firstDelimitation: delimitations[0]
      });
    }

    // Log pour l'ancien système
    if (item.designUrl && delimitations.length > 0) {
      console.log('🎨 [CartSidebar] DesignUrl (ancien système):', {
        designPosition,
        delimitations,
        firstDelimitation: delimitations[0]
      });
    }
  }, [item, imageMetrics, designPosition, delimitations]);

  return (
    <div className="relative w-32 h-32 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
      {/* Conteneur principal */}
      <div
        ref={containerRef}
        className="relative w-full h-full"
      >
        {/* Image du produit */}
        <img
          ref={imgRef}
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-contain rounded"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Personnalisations superposées (designElements) - Avec vraies délimitations */}
        {item.designElements && item.designElements.length > 0 && (() => {
          if (!containerRef.current) return null;

          const rect = containerRef.current.getBoundingClientRect();
          console.log('🎨 [CartSidebar] Affichage des personnalisations - Avec délimitations réelles');
          console.log('📐 [CartSidebar] Canvas rect:', { width: rect.width, height: rect.height });

          // Utiliser les vraies délimitations du produit
          const delimitation = delimitations[0];
          if (!delimitation) {
            console.log('⚠️ [CartSidebar] Pas de délimitation trouvée, utilisation du mode fallback');
            return null;
          }

          // Calculer les dimensions de la délimitation en pixels (comme ProductDesignEditor)
          const scaleX = rect.width / delimitation.referenceWidth;
          const scaleY = rect.height / delimitation.referenceHeight;

          const delimitationPixels = {
            x: delimitation.x * scaleX,
            y: delimitation.y * scaleY,
            width: delimitation.width * scaleX,
            height: delimitation.height * scaleY
          };

          console.log('🔲 [CartSidebar] Délimitation:', {
            reference: { width: delimitation.referenceWidth, height: delimitation.referenceHeight },
            delimitation: { x: delimitation.x, y: delimitation.y, width: delimitation.width, height: delimitation.height },
            scaleFactors: { x: scaleX.toFixed(2), y: scaleY.toFixed(2) },
            pixels: delimitationPixels
          });

          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 2,
              }}
            >
              {/* Conteneur de la délimitation */}
              <div
                className="absolute overflow-hidden"
                style={{
                  left: `${delimitationPixels.x}px`,
                  top: `${delimitationPixels.y}px`,
                  width: `${delimitationPixels.width}px`,
                  height: `${delimitationPixels.height}px`,
                }}
              >
                {item.designElements.map((element: any, idx: number) => {
                  // Position dans le système de coordonnées de la délimitation (0-1)
                  const elementX = element.x * delimitationPixels.width;
                  const elementY = element.y * delimitationPixels.height;

                  // Dimensions responsive basées sur la délimitation
                  const responsiveWidth = element.width * scaleX;
                  const responsiveHeight = element.height * scaleY;

                  // Taille de police responsive
                  const responsiveFontSize = element.type === 'text'
                    ? element.fontSize * scaleX
                    : undefined;

                  const rotation = element.rotation || 0;

                  console.log(`🎨 [CartSidebar] Élément ${idx} (avec délimitations):`, {
                    type: element.type,
                    relativePos: { x: element.x.toFixed(3), y: element.y.toFixed(3) },
                    delimitationPos: { x: elementX.toFixed(1), y: elementY.toFixed(1) },
                    originalSize: { w: element.width, h: element.height },
                    responsiveSize: { w: responsiveWidth.toFixed(1), h: responsiveHeight.toFixed(1) },
                    delimitationSize: { w: delimitationPixels.width.toFixed(1), h: delimitationPixels.height.toFixed(1) },
                    rotation,
                    responsiveFontSize: responsiveFontSize?.toFixed(1)
                  });

                  if (element.type === 'text') {
                    return (
                      <div
                        key={`element-${idx}`}
                        className="absolute pointer-events-none select-none"
                        style={{
                          left: `${elementX}px`,
                          top: `${elementY}px`,
                          transform: `translate(-50%, -50%)`,
                          zIndex: element.zIndex || 0,
                        }}
                      >
                        {/* Conteneur avec rotation */}
                        <div
                          className="relative"
                          style={{
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center',
                            width: `${responsiveWidth}px`,
                            height: `${responsiveHeight}px`,
                            fontSize: `${responsiveFontSize}px`,
                            color: element.color || '#000',
                            fontFamily: element.fontFamily || 'Arial',
                            fontWeight: element.fontWeight || 'normal',
                            fontStyle: element.fontStyle || 'normal',
                            textDecoration: element.textDecoration || 'none',
                            textAlign: element.textAlign || 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                          }}
                        >
                          {element.text || ''}
                        </div>
                      </div>
                    );
                  } else if (element.type === 'image') {
                    return (
                      <div
                        key={`element-${idx}`}
                        className="absolute pointer-events-none select-none"
                        style={{
                          left: `${elementX}px`,
                          top: `${elementY}px`,
                          transform: `translate(-50%, -50%)`,
                          zIndex: element.zIndex || 0,
                        }}
                      >
                        {/* Conteneur avec rotation */}
                        <div
                          className="relative"
                          style={{
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center',
                            width: `${responsiveWidth}px`,
                            height: `${responsiveHeight}px`,
                          }}
                        >
                          <img
                            src={element.imageUrl}
                            alt="Design element"
                            className="w-full h-full object-contain"
                            style={{
                              pointerEvents: 'none',
                              userSelect: 'none',
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })()}

        {/* Design vendeur (ancien système) */}
        {item.designUrl && !item.designElements && imageMetrics && delimitations.length > 0 && (() => {
          console.log('🎨 [CartSidebar] Affichage du design vendeur - Conditions vérifiées');

          const delimitation = delimitations[0];
          if (!delimitation) {
            console.log('🎨 [CartSidebar] Pas de délimitation, pas d\'affichage');
            return null;
          }

          const pos = computePxPosition(delimitation);
          console.log('🎨 [CartSidebar] Position calculée:', pos);

          if (pos.width <= 0 || pos.height <= 0) {
            console.log('🎨 [CartSidebar] Dimensions invalides, pas d\'affichage');
            return null;
          }

          const { x, y, scale, rotation } = designPosition;
          // Utiliser un ratio CONSTANT de la délimitation (comme SimpleProductPreview)
          const designScale = scale || 0.8;
          const actualDesignWidth = pos.width * designScale;
          const actualDesignHeight = pos.height * designScale;

          // Contraintes de positionnement (comme SimpleProductPreview)
          const maxX = (pos.width - actualDesignWidth) / 2;
          const minX = -(pos.width - actualDesignWidth) / 2;
          const maxY = (pos.height - actualDesignHeight) / 2;
          const minY = -(pos.height - actualDesignHeight) / 2;
          const adjustedX = Math.max(minX, Math.min(x, maxX));
          const adjustedY = Math.max(minY, Math.min(y, maxY));

          console.log('🎨 [CartSidebar] Positionnement exact:', {
            originalCoords: { x, y, scale, rotation },
            dimensions: { actualDesignWidth, actualDesignHeight },
            delimitation,
            pos,
            adjustedCoords: { adjustedX, adjustedY },
            constraints: { maxX, minX, maxY, minY }
          });

          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 2,
                overflow: 'visible'
              }}
            >
              {/* Conteneur délimité */}
              <div
                className="absolute overflow-hidden"
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: pos.width,
                  height: pos.height,
                  pointerEvents: 'none',
                }}
              >
                {/* Conteneur du design */}
                <div
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: actualDesignWidth,
                    height: actualDesignHeight,
                    transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.1s ease-out',
                  }}
                >
                  {/* Image du design */}
                  <img
                    src={item.designUrl}
                    alt="Design"
                    className="object-contain pointer-events-none select-none"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
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
                    {(totalPrice / 100).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {(totalPrice / 100).toLocaleString('fr-FR')} FCFA
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
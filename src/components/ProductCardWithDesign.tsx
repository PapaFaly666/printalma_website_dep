import React, { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { VendorProduct } from '../services/vendorProductsService';
import DesignPositionService from '../services/DesignPositionService';
import { useAuth } from '../contexts/AuthContext';
import { vendorProductService } from '../services/vendorProductService';
import { formatPrice } from '../utils/priceUtils';

interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType?: 'PERCENTAGE' | 'PIXEL';
}

interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
}

interface ProductCardWithDesignProps {
  product: VendorProduct;
  onClick?: () => void;
}

export const ProductCardWithDesign: React.FC<ProductCardWithDesignProps> = ({
  product,
  onClick
}) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Déterminer si le produit a un design
  const hasDesign = product.designApplication?.hasDesign && product.designApplication?.designUrl;

  // Obtenir l'image principale et les délimitations
  const primaryImage = product.images?.primaryImageUrl ||
                       product.images?.adminReferences?.[0]?.adminImageUrl;

  const getDelimitations = (): DelimitationData[] => {
    if (!product.adminProduct?.colorVariations) return [];

    const firstColor = product.adminProduct.colorVariations[0];
    if (!firstColor?.images?.[0]?.delimitations) return [];

    return firstColor.images[0].delimitations as DelimitationData[];
  };

  const delimitations = getDelimitations();

  // Calculer les métriques d'image
  const calculateImageMetrics = (): ImageMetrics | null => {
    if (!imgRef.current || !containerRef.current) return null;

    const img = imgRef.current;
    const container = containerRef.current;

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const containerRect = container.getBoundingClientRect();

    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = originalWidth / originalHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageRatio > containerRatio) {
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imageRatio;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
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

  // Calculer la position en pixels d'une délimitation
  const computePxPosition = (delim: DelimitationData) => {
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = imageMetrics?.originalWidth || 1200;
    const imgH = imageMetrics?.originalHeight || 1200;

    // Conversion en pourcentage si nécessaire
    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    const { width: contW, height: contH } = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

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

  // Observer le chargement de l'image
  useEffect(() => {
    if (imgRef.current && imageLoaded && containerRef.current) {
      const metrics = calculateImageMetrics();
      setImageMetrics(metrics);
    }
  }, [imageLoaded]);

  // Observer les changements de taille
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

  // Fonction pour synchroniser les données localStorage vers la base de données
  const syncLocalStorageToDatabase = async (vendorProductId: number, designId: number, enrichedData: any) => {
    if (!user?.id) return;

    try {
      // Vérifier si les données ont été enrichies depuis localStorage
      if (enrichedData.source === 'localStorage' || enrichedData.designWidth || enrichedData.designHeight) {
        console.log('🔄 [ProductCardWithDesign] Synchronisation des données enrichies vers la base de données...', {
          vendorProductId,
          designId,
          data: {
            x: enrichedData.x,
            y: enrichedData.y,
            scale: enrichedData.scale,
            rotation: enrichedData.rotation,
            designWidth: enrichedData.designWidth,
            designHeight: enrichedData.designHeight,
            constraints: enrichedData.constraints
          }
        });

        // VRAIE SYNCHRONISATION vers la base de données
        const positionPayload = {
          x: enrichedData.x,
          y: enrichedData.y,
          scale: enrichedData.scale,
          rotation: enrichedData.rotation || 0,
          designWidth: enrichedData.designWidth,
          designHeight: enrichedData.designHeight
        };

        // Sauvegarder via l'API vendorProductService
        await vendorProductService.saveDesignPosition(vendorProductId, designId, positionPayload);

        console.log('✅ [ProductCardWithDesign] Données synchronisées avec succès vers la base de données !');
      }
    } catch (error) {
      console.error('❌ [ProductCardWithDesign] Erreur lors de la synchronisation vers la base de données:', error);
    }
  };

  // Obtenir la position du design depuis l'API ET localStorage (EXACTEMENT comme SimpleProductPreview)
  const getDesignPosition = () => {
    console.log('🎨 [ProductCardWithDesign] getDesignPosition - Début de la fonction');
    console.log('🎨 [ProductCardWithDesign] product.designPositions:', product.designPositions);
    console.log('🎨 [ProductCardWithDesign] product.designTransforms:', product.designTransforms);

    // 1. Essayer d'abord designPositions depuis l'API
    if (product.designPositions && product.designPositions.length > 0) {
      const designPos = product.designPositions[0];
      console.log('📍 [ProductCardWithDesign] Position depuis designPositions:', designPos.position);

      // Enrichir avec localStorage si designWidth/designHeight manquent
      let enrichedPosition: any = {
        ...designPos.position,
        constraints: (designPos.position as any).constraints || {}
      };

      if ((!enrichedPosition.designWidth || !enrichedPosition.designHeight) && product.designId && user?.id && product.adminProduct?.id) {
        const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
        if (localStorageData && localStorageData.position) {
          const localPos = localStorageData.position as any;
          enrichedPosition.designWidth = localPos.designWidth || enrichedPosition.designWidth;
          enrichedPosition.designHeight = localPos.designHeight || enrichedPosition.designHeight;
          console.log('📍 [ProductCardWithDesign] Enrichi avec localStorage:', {
            designWidth: enrichedPosition.designWidth,
            designHeight: enrichedPosition.designHeight,
            from: 'localStorage'
          });

          // Synchroniser les données enrichies vers la base de données
          console.log('🔄 [ProductCardWithDesign] DÉCLENCHEMENT de la synchronisation automatique...');
          syncLocalStorageToDatabase(product.id, product.designId, enrichedPosition);
        }
      }

      const result = {
        x: enrichedPosition.x || 0,
        y: enrichedPosition.y || 0,
        scale: enrichedPosition.scale || 0.8,
        rotation: enrichedPosition.rotation || 0,
        designWidth: enrichedPosition.designWidth,
        designHeight: enrichedPosition.designHeight,
        designScale: enrichedPosition.designScale,
        constraints: enrichedPosition.constraints || {},
        source: 'designPositions'
      };

      console.log('🎨 [ProductCardWithDesign] Résultat designPositions:', result);
      return result;
    }

    // 2. Essayer designTransforms depuis l'API
    if (product.designTransforms && product.designTransforms.length > 0) {
      const designTransform = product.designTransforms[0];
      const transform = designTransform.transforms['0']; // Délimitation 0
      if (transform) {
        console.log('📍 [ProductCardWithDesign] Position depuis designTransforms:', transform);

        // Enrichir avec localStorage si designWidth/designHeight manquent
        let enrichedTransform: any = {
          ...transform,
          constraints: (transform as any).constraints || {}
        };

        if ((!enrichedTransform.designWidth || !enrichedTransform.designHeight) && product.designId && user?.id && product.adminProduct?.id) {
          const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
          if (localStorageData && localStorageData.position) {
            const localPos = localStorageData.position as any;
            enrichedTransform.designWidth = localPos.designWidth || enrichedTransform.designWidth;
            enrichedTransform.designHeight = localPos.designHeight || enrichedTransform.designHeight;
            console.log('📍 [ProductCardWithDesign] Enrichi avec localStorage:', {
              designWidth: enrichedTransform.designWidth,
              designHeight: enrichedTransform.designHeight,
              from: 'localStorage'
            });

            // Synchroniser les données enrichies vers la base de données
            console.log('🔄 [ProductCardWithDesign] DÉCLENCHEMENT de la synchronisation automatique (transform)...');
            syncLocalStorageToDatabase(product.id, product.designId, enrichedTransform);
          }
        }

        const result = {
          x: enrichedTransform.x || 0,
          y: enrichedTransform.y || 0,
          scale: enrichedTransform.scale || 0.8,
          rotation: enrichedTransform.rotation || 0,
          designWidth: enrichedTransform.designWidth,
          designHeight: enrichedTransform.designHeight,
          designScale: enrichedTransform.designScale,
          constraints: enrichedTransform.constraints || {},
          source: 'designTransforms'
        };

        console.log('🎨 [ProductCardWithDesign] Résultat designTransforms:', result);
        return result;
      }
    }

    // 3. Essayer localStorage directement
    if (product.designId && user?.id && product.adminProduct?.id) {
      const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
      if (localStorageData && localStorageData.position) {
        console.log('📍 [ProductCardWithDesign] Position complète depuis localStorage:', localStorageData.position);

        const localPosition = localStorageData.position as any;
        return {
          x: localPosition.x || 0,
          y: localPosition.y || 0,
          scale: localPosition.scale || 0.8,
          rotation: localPosition.rotation || 0,
          designWidth: localPosition.designWidth,
          designHeight: localPosition.designHeight,
          designScale: localPosition.designScale,
          constraints: localPosition.constraints || {},
          source: 'localStorage'
        };
      }
    }

    // 4. Fallback sur designApplication.scale
    console.log('📍 [ProductCardWithDesign] Position par défaut avec scale:', product.designApplication?.scale);
    return {
      x: 0,
      y: 0,
      scale: product.designApplication?.scale || 0.8,
      rotation: 0,
      designWidth: undefined,
      designHeight: undefined,
      designScale: undefined,
      constraints: {},
      source: 'designApplication'
    };
  };

  const designPosition = getDesignPosition();

  // 🆕 Log complet pour debug - comme SimpleProductPreview
  useEffect(() => {
    console.log('🔍 ProductCardWithDesign - Produit reçu:', product.id, {
      hasDesign: product.designApplication?.hasDesign,
      designUrl: product.designApplication?.designUrl,
      designPositions: product.designPositions,
      designTransforms: product.designTransforms
    });

    if (hasDesign) {
      console.log('🎨 ProductCardWithDesign - Informations design:', {
        hasDesign,
        designUrl: product.designApplication?.designUrl,
        delimitations: delimitations.length,
        designPosition,
        imageMetrics: !!imageMetrics
      });

      // Analyser les délimitations en détail
      if (delimitations.length > 0) {
        const firstDelimitation = delimitations[0];
        console.log('🎯 ProductCardWithDesign - Première délimitation détaillée:', {
          raw: firstDelimitation,
          type: firstDelimitation.coordinateType,
          inPixels: firstDelimitation.coordinateType === 'PERCENTAGE' ? {
            x: (firstDelimitation.x / 100) * (imageMetrics?.originalWidth || 1200),
            y: (firstDelimitation.y / 100) * (imageMetrics?.originalHeight || 1200),
            width: (firstDelimitation.width / 100) * (imageMetrics?.originalWidth || 1200),
            height: (firstDelimitation.height / 100) * (imageMetrics?.originalHeight || 1200)
          } : firstDelimitation
        });
      }
    }
  }, [product, hasDesign, delimitations, designPosition, imageMetrics]);

  if (!primaryImage) {
    return (
      <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500">Image non disponible</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className="relative aspect-square flex items-center justify-center bg-gray-100 overflow-hidden"
      >
        {/* Image du produit - cachée au hover s'il y a un design */}
        {(!hasDesign || !isHovered) && (
          <img
            ref={imgRef}
            src={primaryImage}
            alt={product.vendorName || product.adminProduct?.name || 'Produit sans nom'}
            className={`w-full h-full object-cover transition-all duration-300 ${hasDesign && isHovered ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {/* Design superposé - Affichage normal OU affichage plein écran au hover */}
        {hasDesign && (
          <>
            {/* Affichage normal (pas de hover) */}
            {!isHovered && imageMetrics && delimitations.length > 0 && (
              (() => {
                console.log('🎨 ProductCardWithDesign - Affichage du design - Conditions vérifiées:', {
                  hasDesign,
                  designUrl: product.designApplication?.designUrl,
                  imageMetrics: !!imageMetrics,
                  delimitations: delimitations.length
                });

                const { x, y, scale, rotation } = designPosition;
                const delimitation = delimitations[0];
                const pos = computePxPosition(delimitation);

                console.log('🎨 ProductCardWithDesign - delimitation:', delimitation);
                console.log('🎨 ProductCardWithDesign - pos calculé:', pos);

                if (pos.width <= 0 || pos.height <= 0) {
                  console.log('🎨 ProductCardWithDesign - Dimensions invalides, pas d\'affichage');
                  return null;
                }

                // 🎯 SYSTÈME identique à SimpleProductPreview : Utiliser un ratio CONSTANT de la délimitation
                const designScale = scale || 0.8; // Ratio constant par défaut : 80% de la délimitation
                const actualDesignWidth = pos.width * designScale;
                const actualDesignHeight = pos.height * designScale;

                // 🆕 Contraintes de positionnement comme dans SimpleProductPreview
                const maxX = (pos.width - actualDesignWidth) / 2;
                const minX = -(pos.width - actualDesignWidth) / 2;
                const maxY = (pos.height - actualDesignHeight) / 2;
                const minY = -(pos.height - actualDesignHeight) / 2;
                const adjustedX = Math.max(minX, Math.min(x, maxX));
                const adjustedY = Math.max(minY, Math.min(y, maxY));

                console.log('🎨 ProductCardWithDesign - Positionnement exact:', {
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
                    {/* Conteneur délimité EXACTEMENT comme dans SimpleProductPreview */}
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
                      {/* Conteneur du design EXACTEMENT comme dans SimpleProductPreview */}
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
                        {/* Image du design EXACTEMENT comme dans SimpleProductPreview */}
                        <img
                          src={product.designApplication.designUrl}
                          alt="Design"
                          className="object-contain pointer-events-none select-none"
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            transform: 'scale(1)', // Pas de scale supplémentaire
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Affichage plein écran au hover (style Spreadshirt) */}
            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center bg-white transition-all duration-300 ease-in-out">
                <div className="w-full h-full flex items-center justify-center p-6 sm:p-8">
                  <img
                    src={product.designApplication.designUrl}
                    alt="Design"
                    className="max-w-full max-h-full object-contain transition-all duration-300 ease-in-out transform group-hover:scale-110"
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Bouton favori - caché au hover si design */}
        {(!hasDesign || !isHovered) && (
          <button
            className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md z-10 transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Badge vendeur - MASQUÉ */}
        {false && product.vendor && (!hasDesign || !isHovered) && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium z-10">
            {product.vendor.shop_name || product.vendor.fullName}
          </div>
        )}
      </div>

      {/* Informations du produit - cachées au hover si design */}
      {(!hasDesign || !isHovered) && (
        <div className="p-3 transition-opacity duration-300">
          <h3 className="font-bold italic text-base mb-0.5 truncate">
            {product.vendorName || product.adminProduct?.name || 'Produit sans nom'}
          </h3>
          <p className="text-sm font-bold">
            {formatPrice(product.price)}
          </p>

          {/* Couleurs disponibles - MASQUÉES */}
          {false && product.selectedColors && product.selectedColors.length > 0 && (
            <div className="flex gap-1 mt-2">
              {product.selectedColors.slice(0, 4).map((color) => (
                <div
                  key={color.id}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.colorCode }}
                  title={color.name}
                />
              ))}
              {product.selectedColors.length > 4 && (
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-medium">
                  +{product.selectedColors.length - 4}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

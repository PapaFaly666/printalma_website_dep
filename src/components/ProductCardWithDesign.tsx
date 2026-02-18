import React, { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { VendorProduct } from '../services/vendorProductsService';
import DesignPositionService from '../services/DesignPositionService';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
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
  selectedColor?: string | null;
  selectedColors?: string[];
}

export const ProductCardWithDesign: React.FC<ProductCardWithDesignProps> = ({
  product,
  onClick,
  selectedColor,
  selectedColors
}) => {
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isProductFavorite = isFavorite(product.id);

  // Déterminer si le produit a un design
  const hasDesign = product.designApplication?.hasDesign && product.designApplication?.designUrl;

  // Déterminer si c'est un sticker
  const isSticker = (product as any).isSticker === true;

  // Fonction pour obtenir l'image en fonction de la ou des couleurs sélectionnées
  const getImageForColor = () => {
    // Priorité aux couleurs sélectionnées multiples (filtres utilisateur)
    const colorsToCheck = selectedColors || (selectedColor ? [selectedColor] : []);

    // Si des couleurs sont filtrées, les utiliser en priorité
    if (colorsToCheck.length > 0 && product.adminProduct?.colorVariations) {
      // Mapping des noms de couleurs vers les codes
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

      // Fonction pour normaliser les noms de couleurs
      const normalizeColorName = (colorName: string): string => {
        return colorName.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .trim();
      };

      // Chercher une variation correspondante pour chaque couleur sélectionnée
      for (const selectedColor of colorsToCheck) {
        const selectedColorNormalized = normalizeColorName(selectedColor);
        const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];

        const colorVariation = product.adminProduct.colorVariations.find((variation: any) => {
          const variationName = normalizeColorName(variation.name);

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

        if (colorVariation?.images?.length > 0) {
          // ✅ PRIORITÉ: Utiliser finalUrlImage (image finale générée avec design) si disponible
          if ((colorVariation as any)?.finalUrlImage) {
            console.log(`🖼️ [ProductCardWithDesign] ✅ Utilisation de finalUrlImage pour ${selectedColor}:`, (colorVariation as any).finalUrlImage.substring(0, 60) + '...');
            return (colorVariation as any).finalUrlImage;
          }
          // Fallback sur l'image mockup admin
          console.log(`🎨 [ProductCardWithDesign] Couleur trouvée pour produit ${product.id}: ${selectedColor} -> ${colorVariation.name}`);
          return colorVariation.images[0].url;
        }
      }
    }

    // Si aucune couleur n'est filtrée, utiliser defaultColorId si disponible
    const defaultColorId = (product as any).defaultColorId;
    if (defaultColorId && product.adminProduct?.colorVariations) {
      console.log(`🎨 [ProductCardWithDesign] Utilisation de defaultColorId: ${defaultColorId} pour produit ${product.id}`);
      const defaultColorVariation = product.adminProduct.colorVariations.find(
        (variation: any) => variation.id === defaultColorId
      );

      if (defaultColorVariation?.images?.length > 0) {
        // ✅ PRIORITÉ: Utiliser finalUrlImage (image finale générée avec design) si disponible
        if ((defaultColorVariation as any)?.finalUrlImage) {
          console.log(`🖼️ [ProductCardWithDesign] ✅ Utilisation de finalUrlImage pour couleur par défaut:`, (defaultColorVariation as any).finalUrlImage.substring(0, 60) + '...');
          return (defaultColorVariation as any).finalUrlImage;
        }
        console.log(`🎨 [ProductCardWithDesign] ✅ Couleur par défaut trouvée: ${defaultColorVariation.name} (ID: ${defaultColorId})`);
        return defaultColorVariation.images[0].url;
      } else {
        console.warn(`⚠️ [ProductCardWithDesign] defaultColorId ${defaultColorId} non trouvé dans colorVariations`);
      }
    }

    // ✅ Fallback: Essayer finalUrlImage de la première colorVariation avant d'utiliser le mockup
    if (product.adminProduct?.colorVariations && product.adminProduct.colorVariations.length > 0) {
      const firstColorVariation = product.adminProduct.colorVariations[0];
      if ((firstColorVariation as any)?.finalUrlImage) {
        console.log(`🖼️ [ProductCardWithDesign] ✅ Utilisation de finalUrlImage (première variation):`, (firstColorVariation as any).finalUrlImage.substring(0, 60) + '...');
        return (firstColorVariation as any).finalUrlImage;
      }
    }

    // Dernier fallback vers l'image par défaut (mockup)
    console.log(`🎨 [ProductCardWithDesign] Fallback vers primaryImageUrl pour produit ${product.id}`);
    return product.images?.primaryImageUrl ||
           product.images?.adminReferences?.[0]?.adminImageUrl;
  };

  const primaryImage = getImageForColor();

  // ✅ Détecter si on utilise finalUrlImage (image finale avec design déjà appliqué)
  const isUsingFinalUrlImage = (() => {
    const colorsToCheck = selectedColors || (selectedColor ? [selectedColor] : []);

    if (colorsToCheck.length > 0 && product.adminProduct?.colorVariations) {
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

      const normalizeColorName = (colorName: string): string => {
        return colorName.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
      };

      for (const selectedColor of colorsToCheck) {
        const selectedColorNormalized = normalizeColorName(selectedColor);
        const possibleNames = colorMapping[selectedColorNormalized] || [selectedColorNormalized];

        const colorVariation = product.adminProduct.colorVariations.find((variation: any) => {
          const variationName = normalizeColorName(variation.name);
          const match = possibleNames.some(name => {
            const normalizedPossible = normalizeColorName(name);
            return variationName === normalizedPossible ||
                   variationName.includes(normalizedPossible) ||
                   normalizedPossible.includes(variationName);
          });
          const colorCodeMatch = variation.colorCode.toLowerCase().includes(selectedColorNormalized);
          return match || colorCodeMatch;
        });

        if (colorVariation && (colorVariation as any)?.finalUrlImage) {
          return true;
        }
      }
    }

    const defaultColorId = (product as any).defaultColorId;
    if (defaultColorId && product.adminProduct?.colorVariations) {
      const defaultColorVariation = product.adminProduct.colorVariations.find(
        (variation: any) => variation.id === defaultColorId
      );
      if (defaultColorVariation && (defaultColorVariation as any)?.finalUrlImage) {
        return true;
      }
    }

    // ✅ Fallback: Vérifier finalUrlImage de la première colorVariation
    if (product.adminProduct?.colorVariations && product.adminProduct.colorVariations.length > 0) {
      const firstColorVariation = product.adminProduct.colorVariations[0];
      if ((firstColorVariation as any)?.finalUrlImage) {
        return true;
      }
    }

    return false;
  })();

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
      const enrichedPosition: any = {
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
        const enrichedTransform: any = {
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
      className={`bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group ${
        isSticker ? 'border-0' : 'border border-gray-200'
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className={`relative aspect-square flex items-center justify-center overflow-hidden ${
          isSticker ? 'bg-white' : 'bg-gray-100'
        }`}
      >
        {/* Image du produit - cachée au hover s'il y a un design (sauf si finalUrlImage est utilisé) */}
        {(!hasDesign || !isHovered || isUsingFinalUrlImage) && (
          <img
            ref={imgRef}
            src={primaryImage}
            alt={product.vendorName || product.adminProduct?.name || 'Produit sans nom'}
            className={`w-full h-full transition-all duration-300 ${
              isSticker ? 'object-contain' : 'object-cover'
            } ${hasDesign && isHovered && !isUsingFinalUrlImage ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {/* Design superposé - Affichage normal OU affichage plein écran au hover (SAUF si finalUrlImage est utilisé) */}
        {hasDesign && !isUsingFinalUrlImage && (
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
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                isSticker ? 'bg-gray-200' : 'bg-white'
              }`}>
                <div className={`w-full h-full flex items-center justify-center ${
                  isSticker ? '' : 'p-6 sm:p-8'
                }`}>
                  <img
                    src={product.designApplication.designUrl}
                    alt="Design"
                    className={`max-w-full max-h-full object-contain transition-all duration-300 ease-in-out ${
                      isSticker ? '' : 'transform group-hover:scale-110'
                    }`}
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Bouton favori - toujours visible */}
        <button
          className={`absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md transition-all duration-300 ${
            isProductFavorite ? 'bg-pink-50' : ''
          }`}
          style={{ zIndex: 50 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product);
            console.log('💖 [ProductCard] Toggle favori:', product.id, product.vendorName);
          }}
          title={isProductFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isProductFavorite ? 'text-pink-500 fill-pink-500' : 'text-gray-600'
            }`}
          />
        </button>

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
          <h3 className="font-bold italic text-lg mb-1 truncate">
            {product.vendorName || product.adminProduct?.name || 'Produit sans nom'}
          </h3>
          <p className="text-base font-bold mb-1">
            {formatPrice(product.price)}
          </p>

          {/* Description du produit */}
          {product.adminProduct?.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.adminProduct.description}
            </p>
          )}

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

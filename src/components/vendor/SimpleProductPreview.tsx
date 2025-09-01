import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// 🆕 Import du service localStorage pour les positions
import DesignPositionService from '../../services/DesignPositionService';
import { useAuth } from '../../contexts/AuthContext';
// 🆕 Import du service API pour synchroniser vers la base de données
import { vendorProductService } from '../../services/vendorProductService';

// Interface basée sur l'API /vendor/products et la documentation
interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

interface VendorProductFromAPI {
  id: number;
  vendorName: string;
  price: number;
  status: string;
  adminProduct: {
    id: number;
    name: string;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        viewType: string;
        delimitations: DelimitationData[];
      }>;
    }>;
  };
  designApplication: {
    hasDesign: boolean;
    designUrl: string;
    positioning: string;
    scale: number;
  };
  designPositions: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      constraints?: any;
      designWidth?: number;
      designHeight?: number;
      designScale?: number;
    };
  }>;
  designTransforms: Array<{
    id: number;
    designUrl: string;
    transforms: {
      [key: string]: {
        x: number;
        y: number;
        scale: number;
        rotation?: number;
        designWidth?: number;
        designHeight?: number;
        designScale?: number;
        constraints?: any;
      };
    };
  }>;
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  designId: number;
}

interface SimpleProductPreviewProps {
  product: VendorProductFromAPI;
  showColorSlider?: boolean;
  className?: string;
  onColorChange?: (colorId: number) => void;
  showDelimitations?: boolean;
}

// Interface pour les métriques d'image (comme dans useFabricCanvas)
interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
}

export const SimpleProductPreview: React.FC<SimpleProductPreviewProps> = ({
  product,
  showColorSlider = true,
  className = '',
  onColorChange,
  showDelimitations = false
}) => {
  // 🆕 Accès au contexte d'authentification
  const { user } = useAuth();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);

  // 🆕 Logs de diagnostic pour l'incorporation du design
  console.log('🎨 SimpleProductPreview - Produit reçu:', product.id);
  console.log('🎨 SimpleProductPreview - designApplication:', product.designApplication);
  console.log('🎨 SimpleProductPreview - designPositions:', product.designPositions);
  console.log('🎨 SimpleProductPreview - Premier colorVariation:', product.adminProduct.colorVariations[0]);
  console.log('🎨 SimpleProductPreview - Premier image:', product.adminProduct.colorVariations[0]?.images[0]);
  console.log('🎨 SimpleProductPreview - Délimitations du premier image:', product.adminProduct.colorVariations[0]?.images[0]?.delimitations);

  // État pour la couleur sélectionnée
  const [currentColorId, setCurrentColorId] = useState<number>(
    product.selectedColors[0]?.id || 0
  );

  // Couleur actuelle
  const currentColor = product.selectedColors.find(c => c.id === currentColorId) || product.selectedColors[0];
  
  // Trouver la variation de couleur correspondante
  const colorVariation = product.adminProduct.colorVariations.find(
    cv => cv.id === currentColor?.id
  );
  
  // Prendre la première image (ou celle avec viewType "Front")
  const mockupImage = colorVariation?.images.find(img => img.viewType === 'Front') 
    || colorVariation?.images[0];

  // Délimitations de l'image sélectionnée
  const delimitations = mockupImage?.delimitations || [];

  // 🆕 Fonction pour synchroniser les données localStorage vers la base de données
  const syncLocalStorageToDatabase = async (vendorProductId: number, designId: number, enrichedData: any) => {
    if (!user?.id) return;
    
    try {
      // 🆕 Vérifier si les données ont été enrichies depuis localStorage
      if (enrichedData.source === 'localStorage' || enrichedData.designWidth || enrichedData.designHeight) {
        console.log('🔄 Synchronisation des données enrichies vers la base de données...', {
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
        
        // 🆕 VRAIE SYNCHRONISATION vers la base de données
        const positionPayload = {
          x: enrichedData.x,
          y: enrichedData.y,
          scale: enrichedData.scale,
          rotation: enrichedData.rotation || 0,
          designWidth: enrichedData.designWidth,
          designHeight: enrichedData.designHeight
        };

        // 🚀 Sauvegarder via l'API vendorProductService
        await vendorProductService.saveDesignPosition(vendorProductId, designId, positionPayload);
        
        console.log('✅ Données synchronisées avec succès vers la base de données !');
        console.log('📍 Position maintenant disponible dans l\'API pour les prochains appels');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation vers la base de données:', error);
      // 🆕 Afficher l'erreur mais ne pas bloquer l'interface
      console.warn('⚠️ La synchronisation a échoué, mais les données restent disponibles en localStorage');
    }
  };

  // 🆕 Fonction pour obtenir la position du design depuis l'API ET localStorage
  const getDesignPosition = () => {
    console.log('🎨 getDesignPosition - Début de la fonction');
    console.log('🎨 getDesignPosition - product.designPositions:', product.designPositions);
    console.log('🎨 getDesignPosition - product.designTransforms:', product.designTransforms);
    
    // 1. Essayer d'abord designPositions depuis l'API
    if (product.designPositions && product.designPositions.length > 0) {
      const designPos = product.designPositions[0];
      console.log('📍 Position depuis designPositions:', designPos.position);
      
      // 🆕 Enrichir avec localStorage si designWidth/designHeight manquent
      let enrichedPosition: any = { 
        ...designPos.position,
        constraints: (designPos.position as any).constraints || {}
      };
      
      if ((!enrichedPosition.designWidth || !enrichedPosition.designHeight) && product.designId && user?.id) {
        const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
        if (localStorageData && localStorageData.position) {
          const localPos = localStorageData.position as any;
          enrichedPosition.designWidth = localPos.designWidth || enrichedPosition.designWidth;
          enrichedPosition.designHeight = localPos.designHeight || enrichedPosition.designHeight;
          console.log('📍 Enrichi avec localStorage:', { 
            designWidth: enrichedPosition.designWidth, 
            designHeight: enrichedPosition.designHeight,
            from: 'localStorage'
          });
          
          // 🆕 LOG pour debug - montrer les données avant et après enrichissement
          console.log('📍 AVANT enrichissement:', designPos.position);
          console.log('📍 APRÈS enrichissement:', enrichedPosition);
          
          // 🆕 Synchroniser les données enrichies vers la base de données
          console.log('🔄 DÉCLENCHEMENT de la synchronisation automatique vers la base de données...');
          syncLocalStorageToDatabase(product.id, product.designId, enrichedPosition);
        }
      }
      
      const result = {
        x: enrichedPosition.x,
        y: enrichedPosition.y,
        scale: enrichedPosition.scale,
        rotation: enrichedPosition.rotation || 0,
        designWidth: enrichedPosition.designWidth,
        designHeight: enrichedPosition.designHeight,
        designScale: enrichedPosition.designScale,
        constraints: enrichedPosition.constraints || {},
        source: 'designPositions'
      };
      
      console.log('🎨 getDesignPosition - Résultat designPositions:', result);
      return result;
    }

    // 2. Essayer designTransforms depuis l'API
    if (product.designTransforms && product.designTransforms.length > 0) {
      const designTransform = product.designTransforms[0];
      const transform = designTransform.transforms['0']; // Délimitation 0
      if (transform) {
        console.log('📍 Position depuis designTransforms:', transform);
        
        // 🆕 Enrichir avec localStorage si designWidth/designHeight manquent
        let enrichedTransform: any = { 
          ...transform,
          constraints: (transform as any).constraints || {}
        };
        
        if ((!enrichedTransform.designWidth || !enrichedTransform.designHeight) && product.designId && user?.id) {
          const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
          if (localStorageData && localStorageData.position) {
            const localPos = localStorageData.position as any;
            enrichedTransform.designWidth = localPos.designWidth || enrichedTransform.designWidth;
            enrichedTransform.designHeight = localPos.designHeight || enrichedTransform.designHeight;
            console.log('📍 Enrichi avec localStorage:', { 
              designWidth: enrichedTransform.designWidth, 
              designHeight: enrichedTransform.designHeight,
              from: 'localStorage'
            });
            
            // 🆕 LOG pour debug - montrer les données avant et après enrichissement
            console.log('📍 AVANT enrichissement (transform):', transform);
            console.log('📍 APRÈS enrichissement (transform):', enrichedTransform);
            
            // 🆕 Synchroniser les données enrichies vers la base de données
            console.log('🔄 DÉCLENCHEMENT de la synchronisation automatique vers la base de données (transform)...');
            syncLocalStorageToDatabase(product.id, product.designId, enrichedTransform);
          }
        }
        
        const result = {
          x: enrichedTransform.x,
          y: enrichedTransform.y,
          scale: enrichedTransform.scale,
          rotation: enrichedTransform.rotation || 0,
          designWidth: enrichedTransform.designWidth,
          designHeight: enrichedTransform.designHeight,
          designScale: enrichedTransform.designScale,
          constraints: enrichedTransform.constraints || {},
          source: 'designTransforms'
        };
        
        console.log('🎨 getDesignPosition - Résultat designTransforms:', result);
        return result;
      }
    }

    // 3. Essayer localStorage directement
    if (product.designId && user?.id) {
      const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
      if (localStorageData && localStorageData.position) {
        console.log('📍 Position complète depuis localStorage:', localStorageData.position);
        
        // 🆕 Structurer les données localStorage pour la base de données
        const localPosition = localStorageData.position as any;
        const structuredPosition = {
          x: localPosition.x,
          y: localPosition.y,
          scale: localPosition.scale,
          rotation: localPosition.rotation || 0,
          designWidth: localPosition.designWidth,
          designHeight: localPosition.designHeight,
          designScale: localPosition.designScale,
          constraints: localPosition.constraints || {},
          source: 'localStorage',
          // 🆕 Format pour la base de données
          databaseFormat: {
            position: {
              x: localPosition.x,
              y: localPosition.y,
              scale: localPosition.scale,
              constraints: localPosition.constraints || {}
            }
          }
        };
        
        console.log('📍 Données structurées pour la base de données:', structuredPosition.databaseFormat);
        return structuredPosition;
      }
    }

    // 4. Fallback sur designApplication.scale
    console.log('📍 Position par défaut avec scale:', product.designApplication.scale);
    return {
      x: 0,
      y: 0,
      scale: product.designApplication.scale || 1,
      rotation: 0,
      designWidth: undefined,
      designHeight: undefined,
      designScale: undefined,
      constraints: {},
      source: 'designApplication'
    };
  };

  // 🆕 Calculer les métriques d'image (comme dans useFabricCanvas)
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

  // 🆕 Convertir les coordonnées réelles vers les coordonnées d'affichage (comme dans useFabricCanvas)
  const convertToDisplayCoordinates = (realCoords: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (!imageMetrics) return realCoords;
    
    return {
      x: (realCoords.x * imageMetrics.canvasScale) + imageMetrics.canvasOffsetX,
      y: (realCoords.y * imageMetrics.canvasScale) + imageMetrics.canvasOffsetY,
      width: realCoords.width * imageMetrics.canvasScale,
      height: realCoords.height * imageMetrics.canvasScale
    };
  };

  // Observer les dimensions de l'image
  useEffect(() => {
    if (imgRef.current && imageLoaded && containerRef.current) {
      const metrics = calculateImageMetrics();
      setImageMetrics(metrics);
    }
  }, [imageLoaded, currentColorId]);

  // Observer les changements de taille du container
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

  // 🆕 Fonction pour calculer la position en pixels - IDENTIQUE à ProductViewWithDesign (admin/add-product)
  const computePxPosition = (delim: DelimitationData) => {
    // Détection automatique du type de coordonnées comme dans ProductViewWithDesign
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = imageMetrics?.originalWidth || 1200;
    const imgH = imageMetrics?.originalHeight || 1200;

    // Conversion en pourcentage si nécessaire (logique identique à ProductViewWithDesign)
    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    // Utiliser les dimensions du conteneur (logique identique à ProductViewWithDesign)
    const { width: contW, height: contH } = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

    // Calcul responsive identique à ProductViewWithDesign
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

    // Retour de position exactement comme ProductViewWithDesign
    return {
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };
  };

  // Gestionnaire de changement de couleur
  const handleColorChange = (colorId: number) => {
    setCurrentColorId(colorId);
    onColorChange?.(colorId);
  };

  // Gestionnaire pour couleur précédente
  const handlePreviousColor = () => {
    const currentIndex = product.selectedColors.findIndex(c => c.id === currentColorId);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : product.selectedColors.length - 1;
    const previousColor = product.selectedColors[previousIndex];
    handleColorChange(previousColor.id);
  };

  // Gestionnaire pour couleur suivante
  const handleNextColor = () => {
    const currentIndex = product.selectedColors.findIndex(c => c.id === currentColorId);
    const nextIndex = currentIndex < product.selectedColors.length - 1 ? currentIndex + 1 : 0;
    const nextColor = product.selectedColors[nextIndex];
    handleColorChange(nextColor.id);
  };

  const designPosition = getDesignPosition();

  // 🆕 Log complet pour debug - TOUJOURS actif pour diagnostiquer les problèmes de positionnement
  useEffect(() => {
    console.log('🔍 SimpleProductPreview - Produit reçu:', product.id, {
      hasDesign: product.designApplication.hasDesign,
      designUrl: product.designApplication.designUrl,
      colorVariations: product.adminProduct.colorVariations.length,
      firstColorImages: product.adminProduct.colorVariations[0]?.images || [],
      delimitations: product.adminProduct.colorVariations[0]?.images[0]?.delimitations || [],
      designPositions: product.designPositions,
      designTransforms: product.designTransforms
    });
    
    if (showDelimitations) {
      console.log('🟦 Couleur sélectionnée:', currentColor);
      console.log('🟥 Délimitations pour cette couleur:', delimitations);
      console.log('📐 Position/Transform du design:', designPosition);
      console.log('🖼️ Métriques image:', imageMetrics);
      
      // 🆕 Analyser les délimitations en détail
      if (delimitations.length > 0) {
        const firstDelimitation = delimitations[0];
        console.log('🎯 Première délimitation détaillée:', {
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
  }, [product, currentColor, delimitations, designPosition, imageMetrics, showDelimitations]);

  if (!mockupImage) {
    return (
      <div className={`aspect-square bg-gray-100 flex items-center justify-center rounded-lg ${className}`}>
        <span className="text-gray-500">Aucune image</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`aspect-square relative bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Image du produit */}
      <img
        ref={imgRef}
        src={mockupImage.url}
        alt={product.adminProduct.name}
        className="w-full h-full object-contain"
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* 🆕 Délimitations visibles selon la logique admin */}
      {showDelimitations && imageMetrics && delimitations.map((delimitation: DelimitationData, index: number) => (
        <div
          key={`delimitation-${index}`}
          className="absolute border-2 border-red-500 bg-red-100 bg-opacity-20 pointer-events-none"
          style={{
            ...computePxPosition(delimitation),
            zIndex: 1,
          }}
        >
          <div className="absolute -top-5 left-0 bg-red-500 text-white px-2 py-1 text-xs rounded">
            Zone imprimable {index + 1}
          </div>
        </div>
      ))}
      
      {/* 🆕 Design superposé exactement comme dans sell-design */}
      {product.designApplication.hasDesign && product.designApplication.designUrl && imageMetrics && (
        (() => {
          console.log('🎨 Affichage du design - Conditions vérifiées:', {
            hasDesign: product.designApplication.hasDesign,
            designUrl: product.designApplication.designUrl,
            imageMetrics: !!imageMetrics
          });
          
          const { x, y, scale, rotation, designWidth, designHeight } = designPosition;
          
          console.log('🎨 Affichage du design - designPosition:', designPosition);
          
          // 🆕 Obtenir la première délimitation et calculer sa position comme dans SellDesignPage
          const delimitation = delimitations[0];
          console.log('🎨 Affichage du design - delimitation:', delimitation);
          
          if (!delimitation) {
            console.log('🎨 Affichage du design - Pas de délimitation, pas d\'affichage');
            return null; // Pas de délimitation, pas d'affichage
          }
          
          const pos = computePxPosition(delimitation);
          console.log('🎨 Affichage du design - pos calculé:', pos);
          
          if (pos.width <= 0 || pos.height <= 0) {
            console.log('🎨 Affichage du design - Dimensions invalides, pas d\'affichage');
            return null;
          }
          
          // 🎯 NOUVEAU SYSTÈME : Utiliser un ratio CONSTANT de la délimitation (comme le produit et l'image sont fusionnés)
          // Le design utilise toujours le même pourcentage de la délimitation, indépendamment de la taille d'écran
          const designScale = scale || 0.8; // Ratio constant par défaut : 80% de la délimitation
          const actualDesignWidth = pos.width * designScale;
          const actualDesignHeight = pos.height * designScale;
          
          // 🆕 Contraintes de positionnement comme dans SellDesignPage
          const maxX = (pos.width - actualDesignWidth) / 2;
          const minX = -(pos.width - actualDesignWidth) / 2;
          const maxY = (pos.height - actualDesignHeight) / 2;
          const minY = -(pos.height - actualDesignHeight) / 2;
          const adjustedX = Math.max(minX, Math.min(x, maxX));
          const adjustedY = Math.max(minY, Math.min(y, maxY));
          
          console.log(`🎨 Positionnement exact comme SellDesignPage pour produit ${product.id}:`, {
            originalCoords: { x, y, scale, rotation },
            dimensions: { designWidth, designHeight, actualDesignWidth, actualDesignHeight },
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
              {/* Conteneur délimité EXACTEMENT comme dans ProductImageWithDesign */}
              <div
                className="absolute overflow-hidden"
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: pos.width,
                  height: pos.height,
                  pointerEvents: 'none',
                  border: showDelimitations ? '2px solid blue' : 'none',
                }}
              >
                {/* Conteneur du design EXACTEMENT comme dans ProductImageWithDesign */}
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
                    border: showDelimitations ? '2px solid green' : 'none',
                  }}
                >
                  {/* Image du design EXACTEMENT comme dans ProductImageWithDesign */}
                  <img
                    src={product.designApplication.designUrl}
                    alt="Design"
                    className="object-contain pointer-events-none select-none"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: 'scale(1)', // Pas de scale supplémentaire, les dimensions sont déjà appliquées au conteneur
                    }}
                  />
                </div>
              </div>
              
              {/* 🔍 Debug: Points de référence */}
              {showDelimitations && (
                <>
                  {/* Centre de la délimitation */}
                  <div
                    className="absolute w-6 h-6 bg-purple-600 rounded-full border-2 border-white"
                    style={{
                      left: `${pos.left + pos.width / 2}px`,
                      top: `${pos.top + pos.height / 2}px`,
                      zIndex: 25,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`Centre délimitation: (${(pos.left + pos.width / 2).toFixed(0)}, ${(pos.top + pos.height / 2).toFixed(0)})`}
                  >
                    <div className="w-full h-full bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      D
                    </div>
                  </div>
                  
                  {/* Position ajustée du design */}
                  <div
                    className="absolute w-4 h-4 bg-green-600 rounded-full border-2 border-white"
                    style={{
                      left: `${pos.left + adjustedX}px`,
                      top: `${pos.top + adjustedY}px`,
                      zIndex: 30,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`Position ajustée: (${adjustedX.toFixed(0)}, ${adjustedY.toFixed(0)})`}
                  />
                  
                  {/* Position originale du design */}
                  <div
                    className="absolute w-4 h-4 bg-red-600 rounded-full"
                    style={{
                      left: `${pos.left + x}px`,
                      top: `${pos.top + y}px`,
                      zIndex: 20,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`Position originale: (${x}, ${y})`}
                  />
                </>
              )}
            </div>
          );
        })()
      )}

      {/* Slider de couleurs */}
      {showColorSlider && product.selectedColors.length > 1 && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreviousColor();
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex-1 flex items-center justify-center gap-2 mx-3">
            {product.selectedColors.map((color) => (
              <button
                key={color.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(color.id);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color.id === currentColorId ? 'border-blue-500 scale-110 shadow-lg' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.colorCode }}
                title={color.name}
              />
            ))}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextColor();
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Indicateurs de statut */}
      {!product.designApplication.hasDesign && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
          Pas de design
        </div>
      )}

      {product.designApplication.hasDesign && delimitations.length === 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
          Pas de délimitations
        </div>
      )}

      {/* Indicateur de source des données */}
      {product.designApplication.hasDesign && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
          {designPosition.source === 'designPositions' ? 'DB Positions' : 
           designPosition.source === 'designTransforms' ? 'DB Transforms' : 'Default Scale'}
        </div>
      )}

      {/* Informations de debug */}
      {showDelimitations && imageMetrics && (
        <div className="absolute bottom-16 right-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs font-mono">
          <div>Couleur: {currentColor?.name}</div>
          <div>Design: {designPosition.x}, {designPosition.y}</div>
          <div>Échelle: {designPosition.scale.toFixed(2)}</div>
          <div>Délimitations: {delimitations.length}</div>
          <div>Métriques: {imageMetrics.originalWidth}x{imageMetrics.originalHeight}</div>
          <div>Affichage: {imageMetrics.displayWidth.toFixed(0)}x{imageMetrics.displayHeight.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
};

export default SimpleProductPreview; 
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Interface basée sur la documentation /vendor/products
interface VendorProductFromList {
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
        delimitations: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType: 'PERCENTAGE' | 'PIXEL';
        }>;
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
    };
  }>;
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  designId: number;
}

interface ProductDesignPreviewV3Props {
  // Données complètes du produit depuis /vendor/products
  product: VendorProductFromList;
  
  // Couleur sélectionnée (optionnel, prendra la première par défaut)
  selectedColorId?: number;
  
  // Options d'affichage
  showInfo?: boolean;
  showColorSlider?: boolean;
  className?: string;
  width?: number;
  height?: number;
  
  // Callback pour les erreurs
  onError?: (error: string) => void;
  
  // Callback pour les clics (pour édition)
  onEdit?: () => void;
  
  // Callback pour le changement de couleur
  onColorChange?: (colorId: number) => void;
}

export const ProductDesignPreviewV3: React.FC<ProductDesignPreviewV3Props> = ({
  product,
  selectedColorId,
  showInfo = false,
  showColorSlider = false, // 🔧 Désactivé par défaut pour éviter le truc noir
  className = '',
  width,
  height,
  onError,
  onEdit,
  onColorChange
}) => {
  console.log(`🎨 ProductDesignPreviewV3 pour produit ${product.id}:`, product);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productImgRef = useRef<HTMLImageElement>(null);
  
  // État du rendu
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderedDataUrl, setRenderedDataUrl] = useState<string | null>(null);
  
  // État pour la couleur sélectionnée
  const [currentColorId, setCurrentColorId] = useState<number>(
    selectedColorId || product.selectedColors[0]?.id || 0
  );
  
  // État pour les dimensions du conteneur
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Fonction pour charger une image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // 🎯 Fonction pour calculer la position correcte comme dans sell-design
  const calculateDesignPosition = (
    delimitation: { x: number; y: number; width: number; height: number; coordinateType: 'PERCENTAGE' | 'PIXEL' },
    savedPosition: { x: number; y: number; scale: number; rotation: number } | null,
    fallbackScale: number,
    imageWidth: number,
    imageHeight: number
  ) => {
    console.log(`🎯 Calcul position pour délimitation:`, delimitation);
    console.log(`💾 Position sauvegardée:`, savedPosition);
    console.log(`📐 Dimensions image:`, imageWidth, 'x', imageHeight);
    
    // Si position sauvegardée, utiliser le système de sell-design
    if (savedPosition) {
      // Dans sell-design, les positions sont stockées comme des ratios 0-1
      // Convertir en pixels absolus selon les dimensions de l'image
      const finalX = savedPosition.x * imageWidth;
      const finalY = savedPosition.y * imageHeight;
      
      console.log(`✅ Position depuis sell-design: (${finalX}, ${finalY}) scale=${savedPosition.scale}`);
      
      return {
        x: finalX,
        y: finalY,
        scale: savedPosition.scale,
        rotation: savedPosition.rotation
      };
    }
    
    // Sinon, utiliser le système de délimitation
    const delim = { ...delimitation };
    if (delimitation.coordinateType === 'PERCENTAGE') {
      delim.x = (delimitation.x / 100) * imageWidth;
      delim.y = (delimitation.y / 100) * imageHeight;
      delim.width = (delimitation.width / 100) * imageWidth;
      delim.height = (delimitation.height / 100) * imageHeight;
      console.log(`📐 Conversion PERCENTAGE -> PIXEL:`, delim);
    }

    // Fallback : centrer dans la délimitation
    const centerX = delim.x + delim.width / 2;
    const centerY = delim.y + delim.height / 2;
    
    const fallbackPosition = {
      x: centerX,
      y: centerY,
      scale: fallbackScale,
      rotation: 0
    };
    
    console.log(`🎯 Position fallback (centré):`, fallbackPosition);
    return fallbackPosition;
  };

  // Fonction pour rendre le produit avec le design
  const renderProductWithDesign = async () => {
    if (!product || !canvasRef.current) return;
    
    setIsRendering(true);
    setRenderError(null);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible d\'obtenir le contexte 2D du canvas');
      }

      console.log(`🎨 Début rendu produit: ${product.vendorName} (couleur: ${currentColorId})`);
      
      // 1. Choisir la couleur et l'image du mock-up
      const selectedColor = product.selectedColors.find(c => c.id === currentColorId) || product.selectedColors[0];
      
      if (!selectedColor) {
        throw new Error('Aucune couleur sélectionnée disponible');
      }
      
      // Trouver la variation de couleur correspondante
      const colorVariation = product.adminProduct.colorVariations.find(
        cv => cv.id === selectedColor.id
      );
      
      if (!colorVariation || !colorVariation.images.length) {
        throw new Error(`Aucune image trouvée pour la couleur ${selectedColor.name}`);
      }
      
      // Prendre la première image (ou celle avec viewType "Front")
      const mockupImage = colorVariation.images.find(img => img.viewType === 'Front') 
        || colorVariation.images[0];
      
      if (!mockupImage.delimitations.length) {
        throw new Error('Aucune délimitation d\'impression trouvée');
      }
      
      // 2. Charger l'image du mock-up
      console.log('📸 Chargement du mock-up:', mockupImage.url);
      const mockupImg = await loadImage(mockupImage.url);
      
      // 3. Charger l'image du design
      if (!product.designApplication.designUrl) {
        throw new Error('Aucune URL de design trouvée');
      }
      
      console.log('🎨 Chargement du design:', product.designApplication.designUrl);
      const designImg = await loadImage(product.designApplication.designUrl);
      
      // 4. 🔧 Configurer le canvas pour être responsive
      const containerWidth = containerSize.width || width || 300;
      const containerHeight = containerSize.height || height || 300;
      
      // Maintenir les proportions de l'image originale
      const mockupRatio = mockupImg.width / mockupImg.height;
      const containerRatio = containerWidth / containerHeight;
      
      let canvasWidth, canvasHeight;
      if (mockupRatio > containerRatio) {
        // Image plus large que le conteneur
        canvasWidth = containerWidth;
        canvasHeight = containerWidth / mockupRatio;
      } else {
        // Image plus haute que le conteneur
        canvasHeight = containerHeight;
        canvasWidth = containerHeight * mockupRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // 5. Dessiner le mock-up
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
      
      // 6. Récupérer la position sauvegardée
      const savedPosition = product.designPositions && product.designPositions.length > 0 
        ? product.designPositions[0].position 
        : null;
      
      // 7. 🔧 Calculer la position finale du design selon les proportions du canvas
      const delimitation = mockupImage.delimitations[0];
      const finalPosition = calculateDesignPosition(
        delimitation,
        savedPosition,
        product.designApplication.scale,
        canvas.width,  // Utiliser les dimensions du canvas adaptatif
        canvas.height
      );
      
      console.log('📍 Position finale calculée:', finalPosition);
      console.log('🎯 Délimitation:', delimitation);
      console.log('📐 Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // 8. 🔧 Dessiner le design avec les transformations correctes
      ctx.save();
      
      // Centrer les transformations sur la position du design
      ctx.translate(finalPosition.x, finalPosition.y);
      ctx.rotate((finalPosition.rotation * Math.PI) / 180);
      ctx.scale(finalPosition.scale, finalPosition.scale);
      
      // 🔧 Calculer la taille du design selon l'échelle et les délimitations
      const designSize = Math.min(
        delimitation.width * (delimitation.coordinateType === 'PERCENTAGE' ? canvas.width / 100 : 1),
        delimitation.height * (delimitation.coordinateType === 'PERCENTAGE' ? canvas.height / 100 : 1)
      ) * 0.8; // 80% de la taille de la délimitation
      
      const designWidth = designSize;
      const designHeight = (designImg.height / designImg.width) * designSize;
      
      console.log('🎨 Taille design calculée:', designWidth, 'x', designHeight);
      
      // Dessiner le design centré sur le point de transformation
      ctx.drawImage(designImg, -designWidth / 2, -designHeight / 2, designWidth, designHeight);
      
      ctx.restore();
      
      // 9. Sauvegarder le résultat
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setRenderedDataUrl(dataUrl);
      
      console.log('✅ Rendu terminé avec succès');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur de rendu';
      console.error('❌ Erreur lors du rendu:', error);
      setRenderError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsRendering(false);
    }
  };
  
  // Observer les changements de taille du conteneur
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Déclencher le rendu quand le composant est monté ou la couleur change
  useEffect(() => {
    if (product && product.designApplication.hasDesign) {
      renderProductWithDesign();
    }
  }, [product, currentColorId, containerSize]);
  
  // Mettre à jour la couleur sélectionnée
  useEffect(() => {
    if (selectedColorId && selectedColorId !== currentColorId) {
      setCurrentColorId(selectedColorId);
    }
  }, [selectedColorId]);
  
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
  
  // Styles pour le conteneur
  const containerStyles: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
    minHeight: '200px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: onEdit ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  // Gérer les clics
  const handleClick = () => {
    if (onEdit) {
      onEdit();
    }
  };
  
  // Couleur actuelle
  const currentColor = product.selectedColors.find(c => c.id === currentColorId) || product.selectedColors[0];
  
  // Si pas de design, afficher juste le mock-up
  if (!product.designApplication.hasDesign) {
    const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === currentColor?.id);
    const mockupUrl = colorVariation?.images[0]?.url || '';
    
    return (
      <div
        ref={containerRef}
        className={`product-design-preview-v3 ${className}`}
        style={containerStyles}
        onClick={handleClick}
      >
        {mockupUrl && (
          <img
            ref={productImgRef}
            src={mockupUrl}
            alt={product.adminProduct.name}
            className="w-full h-full object-contain"
          />
        )}
        
        {/* 🔧 Slider de couleurs simplifié (seulement si explicitement demandé) */}
        {showColorSlider && product.selectedColors.length > 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="flex gap-2">
              {product.selectedColors.map((color) => (
                <button
                  key={color.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange(color.id);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    color.id === currentColorId ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.colorCode }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
          Pas de design
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`product-design-preview-v3 ${className}`}
      style={containerStyles}
      onClick={handleClick}
    >
      {/* Canvas visible pour le rendu */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{ display: renderedDataUrl ? 'none' : 'block' }}
      />
      
      {/* Indicateur de chargement */}
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Rendu en cours...</span>
          </div>
        </div>
      )}
      
      {/* Indicateur d'erreur */}
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-75 z-10">
          <div className="flex flex-col items-center gap-2 text-red-600">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm text-center px-4">{renderError}</span>
          </div>
        </div>
      )}
      
      {/* Image rendue */}
      {renderedDataUrl && !isRendering && !renderError && (
        <img
          src={renderedDataUrl}
          alt={`${product.adminProduct.name} avec design`}
          className="max-w-full max-h-full object-contain"
        />
      )}
      
      {/* 🔧 Slider de couleurs simplifié (seulement si explicitement demandé) */}
      {showColorSlider && product.selectedColors.length > 1 && !isRendering && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
          <div className="flex gap-2">
            {product.selectedColors.map((color) => (
              <button
                key={color.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(color.id);
                }}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color.id === currentColorId ? 'border-blue-500 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.colorCode }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Informations du produit */}
      {showInfo && (
        <div className="absolute top-2 left-2 right-2 bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 p-2 rounded shadow-sm">
          <div className="text-sm font-semibold">{product.vendorName}</div>
          <div className="text-xs opacity-75">
            Design: {product.designApplication.designUrl.split('/').pop()}
          </div>
          <div className="text-xs opacity-75">
            Couleur: {currentColor?.name || 'N/A'}
          </div>
          {product.designPositions && product.designPositions.length > 0 && (
            <div className="text-xs opacity-75">
              Position: {Math.round(product.designPositions[0].position.x * 100)}%, {Math.round(product.designPositions[0].position.y * 100)}% | 
              Échelle: {Math.round(product.designPositions[0].position.scale * 100)}%
            </div>
          )}
        </div>
      )}
      
      {/* Bouton d'édition */}
      {onEdit && (
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDesignPreviewV3; 
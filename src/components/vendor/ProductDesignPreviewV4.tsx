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

interface ProductDesignPreviewV4Props {
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

export const ProductDesignPreviewV4: React.FC<ProductDesignPreviewV4Props> = ({
  product,
  selectedColorId,
  showInfo = false,
  showColorSlider = true, // ✅ Activé par défaut pour le slider de couleurs
  className = '',
  width,
  height,
  onError,
  onEdit,
  onColorChange
}) => {
  console.log(`🎨 ProductDesignPreviewV4 pour produit ${product.id}:`, product);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const productImgRef = useRef<HTMLImageElement>(null);
  const designImgRef = useRef<HTMLImageElement>(null);
  
  // État pour la couleur sélectionnée
  const [currentColorId, setCurrentColorId] = useState<number>(
    selectedColorId || product.selectedColors[0]?.id || 0
  );
  
  // État pour les dimensions du conteneur
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // États de chargement
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoadingDesign, setIsLoadingDesign] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Observer les changements de taille du conteneur (comme dans InteractiveDesignPositioner)
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
  
  // Mettre à jour la couleur sélectionnée
  useEffect(() => {
    if (selectedColorId && selectedColorId !== currentColorId) {
      setCurrentColorId(selectedColorId);
    }
  }, [selectedColorId]);
  
  // 🎯 Fonction pour calculer les transformations CSS (exactement comme dans sell-design)
  const getDesignTransform = () => {
    let positionX = 0.5; // 50% par défaut
    let positionY = 0.3; // 30% par défaut
    let scale = product.designApplication.scale || 1;
    let rotation = 0;

    if (product.designPositions && product.designPositions.length > 0) {
      const position = product.designPositions[0].position;
      positionX = position.x;
      positionY = position.y;
      scale = position.scale;
      rotation = position.rotation;
    }

    // Exactement comme dans sell-design : translate en pourcentage
    return `translate(${positionX * 100}%, ${positionY * 100}%) scale(${scale}) rotate(${rotation}deg)`;
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
  
  // Gérer les clics
  const handleClick = () => {
    if (onEdit) {
      onEdit();
    }
  };
  
  // Couleur actuelle
  const currentColor = product.selectedColors.find(c => c.id === currentColorId) || product.selectedColors[0];
  
  // Trouver la variation de couleur correspondante
  const colorVariation = product.adminProduct.colorVariations.find(
    cv => cv.id === currentColor?.id
  );
  
  // Prendre la première image (ou celle avec viewType "Front")
  const mockupImage = colorVariation?.images.find(img => img.viewType === 'Front') 
    || colorVariation?.images[0];
  
  // Styles pour le conteneur (responsive)
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
  
  // Si pas de design, afficher juste le mock-up avec slider
  if (!product.designApplication.hasDesign) {
    return (
      <div
        ref={containerRef}
        className={`product-design-preview-v4 ${className}`}
        style={containerStyles}
        onClick={handleClick}
      >
        {mockupImage && (
          <img
            ref={productImgRef}
            src={mockupImage.url}
            alt={product.adminProduct.name}
            className="w-full h-full object-contain"
            onLoad={() => setIsLoadingProduct(false)}
            onError={() => setRenderError('Erreur de chargement du produit')}
          />
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
        
        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
          Pas de design
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`product-design-preview-v4 ${className}`}
      style={containerStyles}
      onClick={handleClick}
    >
      {/* Conteneur de positionnement relatif (comme InteractiveDesignPositioner) */}
      <div className="relative w-full h-full">
        {/* Image du produit (fond) */}
        {mockupImage && (
          <img
            ref={productImgRef}
            src={mockupImage.url}
            alt={product.adminProduct.name}
            className="absolute inset-0 w-full h-full object-contain"
            onLoad={() => setIsLoadingProduct(false)}
            onError={() => setRenderError('Erreur de chargement du produit')}
            draggable={false}
          />
        )}
        
        {/* Design positionné (exactement comme InteractiveDesignPositioner) */}
        {product.designApplication.designUrl && (
          <div
            className="absolute top-0 left-0 select-none pointer-events-none"
            style={{
              transform: getDesignTransform(),
              transformOrigin: 'top left',
              zIndex: 10
            }}
          >
            <img
              ref={designImgRef}
              src={product.designApplication.designUrl}
              alt={`Design ${product.designId}`}
              className="w-24 h-auto"
              onLoad={() => setIsLoadingDesign(false)}
              onError={() => setRenderError('Erreur de chargement du design')}
              draggable={false}
            />
          </div>
        )}
      </div>
      
      {/* Indicateur de chargement */}
      {(isLoadingProduct || isLoadingDesign) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-20">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Chargement...</span>
          </div>
        </div>
      )}
      
      {/* Indicateur d'erreur */}
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-75 z-20">
          <div className="flex flex-col items-center gap-2 text-red-600">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm text-center px-4">{renderError}</span>
          </div>
        </div>
      )}
      
      {/* Slider de couleurs (style moderne) */}
      {showColorSlider && product.selectedColors.length > 1 && !isLoadingProduct && !renderError && (
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
      
      {/* Informations du produit */}
      {showInfo && (
        <div className="absolute top-2 left-2 right-2 bg-white bg-opacity-95 backdrop-blur-sm text-gray-800 p-3 rounded-lg shadow-lg">
          <div className="text-sm font-semibold">{product.vendorName}</div>
          <div className="text-xs opacity-75 mt-1">
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

export default ProductDesignPreviewV4; 
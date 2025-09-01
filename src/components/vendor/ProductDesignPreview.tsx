import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Eye, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ProductDesignPreviewProps {
  // Image du produit (fond)
  productImageUrl: string;
  
  // Design à superposer
  designUrl: string;
  
  // Transformations normalisées
  positionX: number; // 0-1 (pourcentage horizontal)
  positionY: number; // 0-1 (pourcentage vertical)
  scale: number; // 0.1-2 (facteur d'échelle)
  rotation: number; // 0-360 (rotation en degrés)
  
  // Métadonnées optionnelles
  productName?: string;
  designName?: string;
  
  // Options d'affichage
  showInfo?: boolean;
  className?: string;
  width?: number;
  height?: number;
  
  // Callback pour les erreurs
  onError?: (error: string) => void;
}

export const ProductDesignPreview: React.FC<ProductDesignPreviewProps> = ({
  productImageUrl,
  designUrl,
  positionX,
  positionY,
  scale,
  rotation,
  productName,
  designName,
  showInfo = false,
  className = '',
  width,
  height,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const productImgRef = useRef<HTMLImageElement>(null);
  const designImgRef = useRef<HTMLImageElement>(null);
  
  const [isProductLoaded, setIsProductLoaded] = useState(false);
  const [isDesignLoaded, setIsDesignLoaded] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  
  // Dimensions du conteneur
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Observer les changements de taille du conteneur
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    // Mise à jour initiale
    updateContainerSize();
    
    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    // Écouter les changements de fenêtre
    window.addEventListener('resize', updateContainerSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);
  
  // Calculer les transformations CSS pour le design
  const getDesignTransform = () => {
    // Convertir les positions normalisées (0-1) en pourcentages
    const translateX = positionX * 100;
    const translateY = positionY * 100;
    
    // Construire la transformation CSS
    const transform = [
      `translate(${translateX}%, ${translateY}%)`,
      `scale(${scale})`,
      `rotate(${rotation}deg)`
    ].join(' ');
    
    return transform;
  };
  
  // Gérer les erreurs de chargement
  const handleProductError = () => {
    const errorMsg = 'Erreur lors du chargement de l\'image du produit';
    setProductError(errorMsg);
    onError?.(errorMsg);
  };
  
  const handleDesignError = () => {
    const errorMsg = 'Erreur lors du chargement de l\'image du design';
    setDesignError(errorMsg);
    onError?.(errorMsg);
  };
  
  // Vérifier si les images sont chargées
  const isFullyLoaded = isProductLoaded && isDesignLoaded;
  const hasError = productError || designError;
  
  // Styles pour le conteneur
  const containerStyles: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
    minHeight: '200px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  };
  
  // Styles pour l'image du produit (fond)
  const productImageStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    zIndex: 1
  };
  
  // Styles pour l'image du design (superposition)
  const designImageStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
    transform: getDesignTransform(),
    zIndex: 2,
    maxWidth: 'none',
    maxHeight: 'none'
  };
  
  return (
    <div
      ref={containerRef}
      className={`product-design-preview ${className}`}
      style={containerStyles}
    >
      {/* Indicateur de chargement */}
      {!isFullyLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Chargement de l'aperçu...</span>
          </div>
        </div>
      )}
      
      {/* Indicateur d'erreur */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
          <div className="flex flex-col items-center gap-2 text-red-600">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm text-center">
              {productError || designError}
            </span>
          </div>
        </div>
      )}
      
      {/* Image du produit (fond) */}
      <img
        ref={productImgRef}
        src={productImageUrl}
        alt={productName || 'Produit'}
        style={productImageStyles}
        onLoad={() => setIsProductLoaded(true)}
        onError={handleProductError}
      />
      
      {/* Image du design (superposition) */}
      <img
        ref={designImgRef}
        src={designUrl}
        alt={designName || 'Design'}
        style={designImageStyles}
        onLoad={() => setIsDesignLoaded(true)}
        onError={handleDesignError}
      />
      
      {/* Informations d'affichage */}
      {showInfo && (
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {productName && (
            <Badge variant="secondary" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              {productName}
            </Badge>
          )}
          {designName && (
            <Badge variant="outline" className="text-xs">
              {designName}
            </Badge>
          )}
        </div>
      )}
      
      {/* Détails des transformations (debug) */}
      {showInfo && (
        <div className="absolute bottom-2 right-2 z-20 bg-black/70 text-white text-xs p-2 rounded">
          <div>Position: {Math.round(positionX * 100)}%, {Math.round(positionY * 100)}%</div>
          <div>Échelle: {scale.toFixed(2)}</div>
          <div>Rotation: {rotation}°</div>
        </div>
      )}
    </div>
  );
};

export default ProductDesignPreview; 
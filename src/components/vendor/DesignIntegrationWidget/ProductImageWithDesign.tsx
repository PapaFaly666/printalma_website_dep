import React, { useState, useRef, useEffect } from 'react';
import { useDesignTransforms } from '../../../hooks/useDesignTransforms';
import { TransformStatusIndicator } from './TransformStatusIndicator';

interface ProductImageWithDesignProps {
  productImage: {
    id: number;
    url: string;
    viewType: string;
    delimitations: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
    }>;
  };
  designUrl: string;
  productId: number;
  designConfig?: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  showDelimitations?: boolean;
  className?: string;
  onTransformChange?: (delimIndex: number, transform: any) => void;
  showControls?: boolean;
}

const ProductImageWithDesign: React.FC<ProductImageWithDesignProps> = ({
  productImage,
  designUrl,
  productId,
  designConfig = { positioning: 'CENTER', scale: 0.8 },
  showDelimitations = false,
  className = '',
  onTransformChange,
  showControls = true
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Hook pour la gestion des transformations (maintenant optimisé pour le backend)
  const { 
    transformStates, 
    updateTransform, 
    getTransform, 
    isLoading,
    isSaving
  } = useDesignTransforms(productId, designUrl);

  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      const { offsetWidth, offsetHeight } = imageRef.current;
      
      setImageDimensions({
        width: offsetWidth,
        height: offsetHeight
      });
    }
  }, [imageLoaded]);

  // Notifier les changements vers le parent si nécessaire
  useEffect(() => {
    if (onTransformChange && Object.keys(transformStates).length > 0) {
      Object.entries(transformStates).forEach(([index, transform]) => {
        onTransformChange(parseInt(index), transform);
      });
    }
  }, [transformStates, onTransformChange]);

  // Calculer les coordonnées absolues depuis les délimitations
  const getAbsoluteCoordinates = (delimitation: any) => {
    if (!imageRef.current || !imageLoaded) {
      return null;
    }

    const img = imageRef.current;
    const containerWidth = img.offsetWidth;
    const containerHeight = img.offsetHeight;

    if (delimitation.coordinateType === 'PERCENTAGE') {
      let adjustedX = delimitation.x;
      let adjustedY = delimitation.y;
      let adjustedWidth = delimitation.width;
      let adjustedHeight = delimitation.height;
      
      // Ajuster les coordonnées invalides
      if (adjustedX > 100) adjustedX = 25;
      if (adjustedY > 100) adjustedY = 25;
      if (adjustedWidth > 50) adjustedWidth = 40;
      if (adjustedHeight > 50) adjustedHeight = 40;
      
      return {
        x: (adjustedX / 100) * containerWidth,
        y: (adjustedY / 100) * containerHeight,
        width: (adjustedWidth / 100) * containerWidth,
        height: (adjustedHeight / 100) * containerHeight
      };
    } else {
      // ABSOLUTE - ajuster selon le ratio de redimensionnement
      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      
      return {
        x: delimitation.x * scaleX,
        y: delimitation.y * scaleY,
        width: delimitation.width * scaleX,
        height: delimitation.height * scaleY
      };
    }
  };

  // Calculer la position et taille du design dans une délimitation
  const getDesignStyle = (delimitation: any, delimIndex: number) => {
    const coords = getAbsoluteCoordinates(delimitation);
    if (!coords) return {};

    // Récupérer les transformations sauvegardées
    const transform = getTransform(delimIndex);
    
    const designWidth = coords.width * (transform.scale || designConfig.scale);
    const designHeight = coords.height * (transform.scale || designConfig.scale);

    let designX = coords.x + (transform.x || 0);
    let designY = coords.y + (transform.y || 0);

    // Appliquer le positionnement par défaut si pas de transformation
    if (!transform.x && !transform.y) {
      switch (designConfig.positioning) {
        case 'CENTER':
          designX += (coords.width - designWidth) / 2;
          designY += (coords.height - designHeight) / 2;
          break;
        case 'TOP':
          designX += (coords.width - designWidth) / 2;
          designY += 10;
          break;
        case 'BOTTOM':
          designX += (coords.width - designWidth) / 2;
          designY += coords.height - designHeight - 10;
          break;
      }
    }

    return {
      position: 'absolute' as const,
      left: `${designX}px`,
      top: `${designY}px`,
      width: `${designWidth}px`,
      height: `${designHeight}px`,
      zIndex: 10,
      pointerEvents: 'none' as const
    };
  };

  // Style pour afficher les zones de délimitation
  const getDelimitationStyle = (delimitation: any) => {
    const coords = getAbsoluteCoordinates(delimitation);
    if (!coords) return {};

    return {
      position: 'absolute' as const,
      left: `${coords.x}px`,
      top: `${coords.y}px`,
      width: `${coords.width}px`,
      height: `${coords.height}px`,
      border: '2px dashed #ff6b6b',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      zIndex: 5,
      pointerEvents: 'none' as const
    };
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Indicateur de statut optimisé */}
      <TransformStatusIndicator
        isLoading={isLoading}
        isSaving={isSaving}
        backendAvailable={false}
        authError={null}
        onRetryBackend={() => {}}
      />

      {/* Image principale */}
      <img
        ref={imageRef}
        src={productImage.url}
        alt={`Vue ${productImage.viewType}`}
        className="w-full h-auto object-contain"
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.error('Erreur chargement image:', e);
        }}
      />

      {/* Zone de délimitation (si activée) */}
      {showDelimitations && imageLoaded && productImage.delimitations?.map((delimitation, index) => (
        <div
          key={`delimitation-${index}`}
          style={getDelimitationStyle(delimitation)}
          className="border-dashed border-2 border-red-400 bg-red-50 bg-opacity-30"
        >
          <div className="absolute -top-6 left-0 text-xs bg-red-500 text-white px-1 rounded">
            Zone {index + 1}
          </div>
        </div>
      ))}

      {/* Design superposé dans chaque délimitation */}
      {designUrl && imageLoaded && productImage.delimitations?.map((delimitation, index) => (
        <img
          key={`design-${index}`}
          src={designUrl}
          alt="Design personnalisé"
          style={getDesignStyle(delimitation, index)}
          className="select-none object-contain"
          draggable={false}
        />
      ))}
    </div>
  );
};

export default ProductImageWithDesign; 
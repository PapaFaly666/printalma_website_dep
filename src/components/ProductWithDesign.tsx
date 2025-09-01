import React, { useState, useEffect } from 'react';
import { BestSellerProduct } from '../types/bestSellers';

interface ProductWithDesignProps {
  product: BestSellerProduct;
  className?: string;
  showDelimitations?: boolean; // Pour le debug
  onClick?: () => void;
}

export const ProductWithDesign: React.FC<ProductWithDesignProps> = ({
  product,
  className = '',
  showDelimitations = false,
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [designLoaded, setDesignLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [designError, setDesignError] = useState(false);

  // Récupérer les informations du produit
  const baseImage = product.mainImage;
  const delimitations = [];

  // Récupérer les informations du design
  const hasDesign = true;
  const designUrl = product.design?.cloudinaryUrl;
  const designPosition = null;

  useEffect(() => {
    if (baseImage) {
      console.log('🎨 [ProductWithDesign] Image de base:', baseImage);
    }
    if (hasDesign && designUrl && designPosition) {
      console.log('🎨 [ProductWithDesign] Design:', {
        url: designUrl,
        dimensions: {
          width: designPosition.designWidth,
          height: designPosition.designHeight
        },
        position: {
          x: designPosition.x,
          y: designPosition.y,
          scale: designPosition.scale,
          rotation: designPosition.rotation
        }
      });
    }
  }, [baseImage, hasDesign, designUrl, designPosition]);

  if (!baseImage) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <span className="text-gray-500 text-sm">Image non disponible</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-lg cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Indicateur de chargement */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
        </div>
      )}

      {/* Image de base du produit */}
      <img
        src={baseImage}
        alt={product.name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(true);
        }}
        loading="lazy"
      />

      {/* Design superposé avec vraies dimensions et positionnement */}
      {hasDesign && designUrl && designPosition && !designError && (
        <img
          src={designUrl}
          alt="Design personnalisé"
          className={`absolute transition-opacity duration-300 ${
            designLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            // Position au centre de l'image de base
            left: '50%',
            top: '50%',
            // Utiliser les vraies dimensions du design
            width: `${designPosition.designWidth * designPosition.scale}px`,
            height: `${designPosition.designHeight * designPosition.scale}px`,
            // Appliquer la transformation complète
            transform: `
              translate(-50%, -50%) 
              translate(${designPosition.x}px, ${designPosition.y}px)
              rotate(${designPosition.rotation}deg)
              scale(${designPosition.scale})
            `,
            transformOrigin: 'center center',
            objectFit: 'contain',
            zIndex: 10
          }}
          onLoad={() => setDesignLoaded(true)}
          onError={() => {
            setDesignError(true);
            console.warn('Erreur chargement design:', designUrl);
          }}
          loading="lazy"
        />
      )}

      {/* Délimitations (pour debug) */}
      {showDelimitations && delimitations.map((delimitation) => (
        <div
          key={delimitation.id}
          className="absolute border-2 border-dashed border-red-500 bg-red-500/10"
          style={{
            left: `${delimitation.x}px`,
            top: `${delimitation.y}px`,
            width: `${delimitation.width}px`,
            height: `${delimitation.height}px`,
            zIndex: 20
          }}
        >
          <div className="absolute -top-6 left-0 text-xs text-red-600 bg-white px-1 rounded">
            {delimitation.name || 'Zone design'}
          </div>
        </div>
      ))}

      {/* Erreur d'image */}
      {imageError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500">
          <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Image indisponible</span>
        </div>
      )}

      {/* Debug info (visible en mode développement) */}
      {process.env.NODE_ENV === 'development' && hasDesign && designPosition && (
        <div className="absolute bottom-2 left-2 text-xs bg-black/70 text-white p-1 rounded opacity-0 hover:opacity-100 transition-opacity">
          <div>Design: {designPosition.designWidth}×{designPosition.designHeight}</div>
          <div>Pos: ({designPosition.x}, {designPosition.y})</div>
          <div>Scale: {designPosition.scale}</div>
          <div>Rotation: {designPosition.rotation}°</div>
        </div>
      )}
    </div>
  );
}; 
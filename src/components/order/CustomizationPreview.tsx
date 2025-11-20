import React, { useRef, useState, useEffect } from 'react';
import { getElementWebStyle, getTextWebStyle } from '../../utils/positioningUtils';

// Composant optimisé pour afficher les produits personnalisés avec un rendu pixel-perfect
// Système de positionnement identique à CustomerProductCustomizationPageV3 pour garantir
// que l'aperçu admin correspond exactement à ce que le client a défini

// Types pour les éléments de design
interface DesignElement {
  id: string;
  type: 'image' | 'text';
  x: number; // Position en pourcentage (0-1)
  y: number; // Position en pourcentage (0-1)
  width: number; // Largeur en pixels
  height: number; // Hauteur en pixels
  rotation: number;
  zIndex: number;
  // Pour les images
  imageUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  // Pour le texte
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right';
}

interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType?: 'PERCENTAGE' | 'PIXEL';
  referenceWidth?: number;
  referenceHeight?: number;
}

interface CustomizationPreviewProps {
  productImageUrl: string;
  designElements: DesignElement[];
  delimitation?: Delimitation;
  productName?: string;
  className?: string;
  showInfo?: boolean;
  colorName?: string;
  colorCode?: string;
  size?: string;
  quantity?: number;
}

export const CustomizationPreview: React.FC<CustomizationPreviewProps> = ({
  productImageUrl,
  designElements,
  delimitation,
  productName,
  className = '',
  showInfo = true,
  colorName,
  colorCode,
  size,
  quantity
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  // Calculer les dimensions d'affichage de l'image
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !containerRef.current) return;

    const calculateDisplaySize = () => {
      const container = containerRef.current!.getBoundingClientRect();
      const imgNaturalWidth = imgRef.current!.naturalWidth;
      const imgNaturalHeight = imgRef.current!.naturalHeight;

      const imgRatio = imgNaturalWidth / imgNaturalHeight;
      const contRatio = container.width / container.height;

      let dispW: number, dispH: number, offsetX: number, offsetY: number;
      if (imgRatio > contRatio) {
        dispW = container.width;
        dispH = container.width / imgRatio;
        offsetX = 0;
        offsetY = (container.height - dispH) / 2;
      } else {
        dispH = container.height;
        dispW = container.height * imgRatio;
        offsetX = (container.width - dispW) / 2;
        offsetY = 0;
      }

      setImageDisplaySize({ width: dispW, height: dispH, offsetX, offsetY });
    };

    calculateDisplaySize();

    const resizeObserver = new ResizeObserver(calculateDisplaySize);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [imageLoaded]);

  // Utiliser la logique unifiée de positionnement pour garantir la cohérence
  const getElementStyle = (element: DesignElement): React.CSSProperties => {
    if (!imageLoaded || imageDisplaySize.width === 0) return { display: 'none' };

    // Utiliser l'utilitaire unifié qui garantit la cohérence avec ProductDesignEditor
    const canvasDimensions = {
      width: imageDisplaySize.width,
      height: imageDisplaySize.height,
      offsetX: imageDisplaySize.offsetX,
      offsetY: imageDisplaySize.offsetY
    };

    return getElementWebStyle(element as any, canvasDimensions, delimitation as any);
  };

  // Utiliser la logique unifiée pour le style du texte
  const getTextStyle = (element: DesignElement): React.CSSProperties => {
    if (!imageLoaded || imageDisplaySize.width === 0) return {};

    const canvasDimensions = {
      width: imageDisplaySize.width,
      height: imageDisplaySize.height,
      offsetX: imageDisplaySize.offsetX,
      offsetY: imageDisplaySize.offsetY
    };

    return getTextWebStyle(element as any, canvasDimensions, delimitation as any);
  };

  if (!productImageUrl) {
    return (
      <div className={`aspect-square bg-gray-100 flex items-center justify-center rounded-lg ${className}`}>
        <span className="text-gray-500 text-sm">Image non disponible</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Image du produit */}
      <img
        ref={imgRef}
        src={productImageUrl}
        alt={productName || 'Produit'}
        className="w-full h-full object-contain"
        onLoad={() => setImageLoaded(true)}
      />

      {/* Éléments de design superposés - Conteneur avec clipping strict */}
      {imageLoaded && designElements.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            overflow: 'hidden',
            clipPath: 'inset(0)',
          }}
        >
          {designElements.map((element) => (
            <div key={element.id} style={getElementStyle(element)}>
              {element.type === 'text' ? (
                <div style={getTextStyle(element)}>
                  {element.text}
                </div>
              ) : element.type === 'image' && element.imageUrl ? (
                <img
                  src={element.imageUrl}
                  alt="Design"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  draggable={false}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Badge de quantité */}
      {quantity && quantity > 1 && (
        <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded-full text-xs font-bold">
          x{quantity}
        </div>
      )}

      {/* Informations du produit */}
      {showInfo && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          {productName && (
            <p className="text-white font-medium text-sm truncate">{productName}</p>
          )}
          {colorName && (
            <div className="flex items-center gap-2 mt-1">
              {colorCode && (
                <div
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: colorCode }}
                />
              )}
              <span className="text-white/90 text-xs">{colorName}</span>
              {size && <span className="text-white/90 text-xs">• {size}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomizationPreview;

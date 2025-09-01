import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DesignTransforms {
  positionX: number; // 0-100 (pourcentage depuis l'API)
  positionY: number; // 0-100 (pourcentage depuis l'API)
  scale: number;     // 0.1-2
  rotation: number;  // 0-360
}

interface ResponsiveDesignPositionerProps {
  productImageUrl: string;
  designUrl: string;
  designName: string;
  transforms: DesignTransforms;
  className?: string;
  showBoundaries?: boolean;
}

export const ResponsiveDesignPositioner: React.FC<ResponsiveDesignPositionerProps> = ({
  productImageUrl,
  designUrl,
  designName,
  transforms,
  className = '',
  showBoundaries = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const productImgRef = useRef<HTMLImageElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageMetrics, setImageMetrics] = useState({
    originalWidth: 0,
    originalHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    offsetX: 0,
    offsetY: 0
  });

  // Constantes pour les limites de validation (comme dans InteractiveDesignPositioner)
  const BOUNDARY_MARGIN = 0.1; // 10% de marge par rapport aux bords

  // Calculer les métriques de l'image quand elle est chargée
  const calculateImageMetrics = useCallback(() => {
    if (!productImgRef.current || !containerRef.current) return;

    const img = productImgRef.current;
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
    
    setImageMetrics({
      originalWidth,
      originalHeight,
      displayWidth,
      displayHeight,
      offsetX,
      offsetY
    });
    
    setContainerSize({
      width: containerRect.width,
      height: containerRect.height
    });
  }, []);

  // Observer les changements de taille du container
  useEffect(() => {
    if (!containerRef.current) return;
    
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce pour éviter trop de recalculs
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateImageMetrics();
      }, 100);
    };
    
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, [calculateImageMetrics]);

  // Calculer la position responsive du design
  const getResponsiveDesignPosition = useCallback(() => {
    if (!imageMetrics.displayWidth || !imageMetrics.displayHeight) {
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        transform: 'translate(-50%, -50%)'
      };
    }

    // Utiliser exactement la même logique que InteractiveDesignPositioner
    // Taille fixe de 100px comme dans sell-design
    const designSize = 100;
    
    // Calculer la position en pixels basée sur les coordonnées de l'API
    // Les coordonnées de l'API sont en pourcentages (0-100) -> convertir en 0-1
    const positionX = (transforms.positionX / 100) * imageMetrics.displayWidth;
    const positionY = (transforms.positionY / 100) * imageMetrics.displayHeight;
    
    // Calculer le ratio de réduction basé sur la taille du container
    // Plus le container est petit, plus le design doit être petit proportionnellement
    const containerArea = imageMetrics.displayWidth * imageMetrics.displayHeight;
    const baseArea = 400 * 400; // Taille de référence (400x400)
    const scaleRatio = Math.min(containerArea / baseArea, 1); // Max 1, min 0.5
    
    // Appliquer le scale depuis l'API ET le scale responsive
    const responsiveScale = Math.max(0.5, scaleRatio); // Minimum 50% de la taille
    const finalScale = transforms.scale * responsiveScale;
    
    const scaledWidth = designSize * finalScale;
    const scaledHeight = designSize * finalScale;
    
    // Utiliser exactement la même logique que InteractiveDesignPositioner
    // Position relative au container, pas à l'image
    const finalX = positionX;
    const finalY = positionY;
    
    return {
      x: finalX,
      y: finalY,
      width: scaledWidth,
      height: scaledHeight,
      transform: `translate(-50%, -50%) rotate(${transforms.rotation}deg)`
    };
  }, [transforms, imageMetrics]);

  // Calculer les limites de la zone de délimitation
  const getBoundaryLimits = useCallback(() => {
    if (!imageMetrics.displayWidth || !imageMetrics.displayHeight) {
      return { top: 0, left: 0, right: 0, bottom: 0 };
    }

    const marginX = imageMetrics.displayWidth * BOUNDARY_MARGIN;
    const marginY = imageMetrics.displayHeight * BOUNDARY_MARGIN;
    
    return {
      top: imageMetrics.offsetY + marginY,
      left: imageMetrics.offsetX + marginX,
      right: imageMetrics.offsetX + imageMetrics.displayWidth - marginX,
      bottom: imageMetrics.offsetY + imageMetrics.displayHeight - marginY
    };
  }, [imageMetrics, BOUNDARY_MARGIN]);

  const designPosition = getResponsiveDesignPosition();
  const boundaryLimits = getBoundaryLimits();

  // Logs de diagnostic
  console.log('🎨 ResponsiveDesignPositioner - Diagnostic:', {
    transforms,
    imageMetrics,
    designPosition,
    containerSize
  });

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-50 aspect-square overflow-hidden select-none ${className}`}
      style={{ minHeight: '400px' }}
    >
      {/* Image du produit */}
      <img
        ref={productImgRef}
        src={productImageUrl}
        alt="Produit"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
        onLoad={calculateImageMetrics}
      />
      
      {/* Zone de délimitation (boundary) - optionnelle */}
      {showBoundaries && (
        <div 
          className="absolute border-2 border-dashed pointer-events-none"
          style={{
            top: `${boundaryLimits.top}px`,
            left: `${boundaryLimits.left}px`,
            right: `${containerSize.width - boundaryLimits.right}px`,
            bottom: `${containerSize.height - boundaryLimits.bottom}px`,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          }}
        />
      )}
      
      {/* Design positionné de manière responsive */}
      <div
        className="absolute top-0 left-0 pointer-events-none select-none"
        style={{
          transform: `translate(${designPosition.x}px, ${designPosition.y}px) scale(${designPosition.width / 100}) rotate(${transforms.rotation}deg)`,
          transformOrigin: 'center',
          zIndex: 10
        }}
      >
        <img
          src={designUrl}
          alt={designName}
          className="block max-w-none pointer-events-none"
          style={{ width: '100px', height: 'auto' }}
          draggable={false}
        />
      </div>
      
      {/* Grille d'aide (optionnelle) */}
      {showBoundaries && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-gray-300">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-gray-300" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveDesignPositioner; 
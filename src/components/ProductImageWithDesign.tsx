import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useDesignTransforms } from '../hooks/useDesignTransforms';

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
  designUrl?: string;
  designConfig?: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  showDelimitations?: boolean;
  className?: string;
  interactive?: boolean;
  vendorProductId?: number;
  designTransforms?: Record<string, any>;
  vendorDesigns?: any[];
}

const ProductImageWithDesign: React.FC<ProductImageWithDesignProps> = memo(({
  productImage,
  designUrl,
  designConfig = { positioning: 'CENTER', scale: 0.6 },
  showDelimitations = false,
  className = '',
  interactive = false,
  vendorProductId,
  designTransforms,
  vendorDesigns = []
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const productIdForTransforms = useMemo(() => {
    return vendorProductId || productImage.id;
  }, [vendorProductId, productImage.id]);
  
  const shouldUseTransforms = useMemo(() => {
    return !!(designUrl && productIdForTransforms);
  }, [designUrl, productIdForTransforms]);
  
  const transformsResult = useDesignTransforms(
    shouldUseTransforms ? productIdForTransforms : null,
    shouldUseTransforms ? (designUrl || '') : undefined,
    undefined,
    vendorDesigns
  );

  const {
    getTransform,
    positioning,
    isLoading: isLoadingTransforms,
    isSaving
  } = shouldUseTransforms ? transformsResult : {
    getTransform: () => ({ x: 0, y: 0, scale: 1, rotation: 0 }),
    positioning: { position: null },
    isLoading: false,
    isSaving: false
  };

  const delimitationPositions = useMemo(() => {
    if (!imageLoaded || !productImage.delimitations?.length) return [];
    
    return productImage.delimitations.map((delimitation, idx) => {
      const isPixel = delimitation.coordinateType === 'ABSOLUTE' || delimitation.x > 100 || delimitation.y > 100;
      
      const imgW = naturalSize.width || 1200;
      const imgH = naturalSize.height || 1200;

      const pct = {
        x: isPixel ? (delimitation.x / imgW) * 100 : delimitation.x,
        y: isPixel ? (delimitation.y / imgH) * 100 : delimitation.y,
        w: isPixel ? (delimitation.width / imgW) * 100 : delimitation.width,
        h: isPixel ? (delimitation.height / imgH) * 100 : delimitation.height,
      };

      const { width: contW, height: contH } = containerSize;
      if (contW === 0 || contH === 0) return null;

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
        idx,
        left: offsetX + (pct.x / 100) * dispW,
        top: offsetY + (pct.y / 100) * dispH,
        width: (pct.w / 100) * dispW,
        height: (pct.h / 100) * dispH,
      };
    }).filter(Boolean);
  }, [imageLoaded, productImage.delimitations, naturalSize, containerSize]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', updateSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setNaturalSize({ width: naturalWidth, height: naturalHeight });
    }
  }, [imageLoaded]);

  return (
    <div 
      ref={containerRef} 
      className={`relative bg-gray-100 overflow-hidden ${className}`}
    >
      {isLoadingTransforms && (
        <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Chargement...
        </div>
      )}
      
      {isSaving && (
        <div className="absolute top-2 right-2 z-20 bg-green-500 text-white px-2 py-1 rounded text-xs">
          Sauvegardé ✓
        </div>
      )}

      <img
        ref={imageRef}
        src={productImage.url}
        alt={`Produit - ${productImage.viewType}`}
        className="w-full h-full object-contain"
        onLoad={(e) => {
          const img = e.currentTarget;
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          setImageLoaded(true);
        }}
        crossOrigin="anonymous"
      />

      {designUrl && delimitationPositions.map((pos) => {
        if (!pos || pos.width <= 0 || pos.height <= 0) return null;
        
        let transform;
        if (pos.idx === 0 && positioning.position) {
          transform = {
            x: positioning.position.x,
            y: positioning.position.y,
            scale: positioning.position.scale || 1,
            rotation: positioning.position.rotation || 0
          };
        } else if (designTransforms && designTransforms[pos.idx]) {
          transform = designTransforms[pos.idx];
        } else {
          transform = getTransform(pos.idx);
        }
        
        // 🎯 SYSTÈME DE RATIO CONSTANT : Le design utilise toujours le même pourcentage de la délimitation
        // Comme "le produit et l'image sont fusionnés", le design garde sa proportion constante
        const designScale = transform.scale || 0.8; // Ratio constant par défaut : 80% de la délimitation
        const actualDesignWidth = pos.width * designScale;
        const actualDesignHeight = pos.height * designScale;
        
        // 🆕 Contraintes de positionnement exactes comme dans SimpleProductPreview
        const maxX = (pos.width - actualDesignWidth) / 2;
        const minX = -(pos.width - actualDesignWidth) / 2;
        const maxY = (pos.height - actualDesignHeight) / 2;
        const minY = -(pos.height - actualDesignHeight) / 2;
        const adjustedX = Math.max(minX, Math.min(transform.x, maxX));
        const adjustedY = Math.max(minY, Math.min(transform.y, maxY));

        return (
          <div
            key={`design-${pos.idx}`}
            className="absolute overflow-hidden"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              pointerEvents: interactive ? 'auto' : 'none',
            }}
          >
            {/* Conteneur du design avec dimensions exactes comme SimpleProductPreview */}
            <div
              className="absolute pointer-events-none select-none"
              style={{
                left: '50%',
                top: '50%',
                width: actualDesignWidth,
                height: actualDesignHeight,
                transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${transform.rotation || 0}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out',
              }}
            >
              {/* Image du design qui remplit son conteneur avec scale(1) comme SimpleProductPreview */}
              <img
                src={designUrl}
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
        );
      })}

      {showDelimitations && delimitationPositions.map((pos) => {
        if (!pos || pos.width <= 0 || pos.height <= 0) return null;

        return (
          <div
            key={`delim-${pos.idx}`}
            className="absolute border-2 border-dashed border-red-500 bg-red-500/10"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        );
      })}
    </div>
  );
});

ProductImageWithDesign.displayName = 'ProductImageWithDesign';

export default ProductImageWithDesign; 
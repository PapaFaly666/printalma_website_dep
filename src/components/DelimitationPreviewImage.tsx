import React, { useEffect, useRef, useState } from 'react';
import { Delimitation } from '../services/delimitationService';

interface DelimitationPreviewImageProps {
  imageUrl: string;
  viewName?: string;
  delimitations: Delimitation[];
  className?: string;
}

const DelimitationPreviewImage: React.FC<DelimitationPreviewImageProps> = ({
  imageUrl,
  viewName,
  delimitations,
  className = '',
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // État du conteneur pour ajuster la position en fonction du "letterboxing" (object-contain)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imgBox, setImgBox] = useState<{ left: number; top: number; width: number; height: number }>({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
    }
  }, [imageUrl]);

  // Observer la taille du conteneur pour réagir aux redimensionnements
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
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

  // Mettre à jour imgBox quand l'image ou le conteneur change
  useEffect(() => {
    const updateImgBox = () => {
      if (!imgRef.current || !containerRef.current) return;
      const imgRect = imgRef.current.getBoundingClientRect() as DOMRect;
      const contRect = containerRef.current.getBoundingClientRect() as DOMRect;
      setImgBox({
        left: imgRect.left - contRect.left,
        top: imgRect.top - contRect.top,
        width: imgRect.width,
        height: imgRect.height,
      });
    };

    updateImgBox();
    window.addEventListener('resize', updateImgBox);
    return () => window.removeEventListener('resize', updateImgBox);
  }, [naturalSize, containerSize]);

  // Helper : calcule le rectangle en pixels à afficher (left, top, width, height)
  const computePixelRect = (
    delim: Delimitation,
    imgLeft: number,
    imgTop: number,
    imgW: number,
    imgH: number
  ) => {
    const isPixelType = delim.coordinateType && delim.coordinateType !== 'PERCENTAGE';

    // 1️⃣ Cas PIXEL / ABSOLUTE
    if (isPixelType || delim.x > 100 || delim.y > 100 || delim.width > 100 || delim.height > 100) {
      const refW = delim.referenceWidth && delim.referenceWidth > 0 ? delim.referenceWidth : Math.max(naturalSize.width, delim.x + delim.width);
      const refH = delim.referenceHeight && delim.referenceHeight > 0 ? delim.referenceHeight : Math.max(naturalSize.height, delim.y + delim.height);

      const scaleX = imgW / refW;
      const scaleY = imgH / refH;

      return {
        left: imgLeft + delim.x * scaleX,
        top: imgTop + delim.y * scaleY,
        width: delim.width * scaleX,
        height: delim.height * scaleY,
        isPixel: true,
      } as const;
    }

    // 2️⃣ Cas PERCENTAGE
    return {
      left: imgLeft + (delim.x / 100) * imgW,
      top: imgTop + (delim.y / 100) * imgH,
      width: (delim.width / 100) * imgW,
      height: (delim.height / 100) * imgH,
      isPixel: false,
    } as const;
  };

  // Log debug global une fois après imgBox calcul
  useEffect(() => {
    console.log('[DelimitationPreview] imgBox', imgBox);
  }, [imgBox]);

  const renderDelimitation = (delim: Delimitation, index: number) => {
    const { left: imgLeft, top: imgTop, width: imgW, height: imgH } = imgBox;
    if (imgW === 0 || imgH === 0) return null;

    const rect = computePixelRect(delim, imgLeft, imgTop, imgW, imgH);

    // Log debug
    console.log(`[DelimPreview] zone ${index + 1}`, {
      original: delim,
      imgBox,
      rect,
    });

    return (
      <div
        key={delim.id || index}
        className="absolute border-2 border-blue-500 bg-blue-500/20 rounded backdrop-blur-sm"
        style={{
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          transform: delim.rotation ? `rotate(${delim.rotation}deg)` : 'none',
          transformOrigin: 'center',
          minWidth: '2px',
          minHeight: '2px',
        }}
      >
        <div className="absolute -top-7 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
          Zone {index + 1}: {Math.round(rect.width)}×{Math.round(rect.height)}px
          {rect.isPixel && !((delim as any).referenceWidth || (delim as any).reference_width) && (
            <span className="ml-1 text-yellow-300">⚠️</span>
          )}
        </div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        {/* corner dots */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 rounded-full" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-600 rounded-full" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt={viewName || 'Image'}
        className="w-full h-auto object-contain"
        onLoad={(e) => {
          const img = e.currentTarget;
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          // Recalculer la taille du conteneur une fois l'image chargée
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
          }
        }}
      />

      {/* Overlays */}
      {delimitations.map(renderDelimitation)}

      {/* Info overlay (liste des zones) */}
      {delimitations.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <h6 className="font-semibold mb-1">Zones de personnalisation :</h6>
          {delimitations.map((delim, index) => (
            <div key={delim.id || index} className="mb-1 last:mb-0">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="font-medium">Zone {index + 1}</span>
              </div>
              <div className="text-xs space-y-0.5 ml-3">
                {(delim.coordinateType && delim.coordinateType !== 'PERCENTAGE') || delim.x > 100 ? (
                  <>
                    <div>Position: {Math.round(delim.x)}px, {Math.round(delim.y)}px</div>
                    <div>Taille: {Math.round(delim.width)}px × {Math.round(delim.height)}px</div>
                  </>
                ) : (
                  <>
                    <div>Position: {Math.round(delim.x)}%, {Math.round(delim.y)}%</div>
                    <div>Taille: {Math.round(delim.width)}% × {Math.round(delim.height)}%</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DelimitationPreviewImage; 
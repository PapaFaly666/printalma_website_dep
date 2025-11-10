import React, { useRef, useState, useEffect } from 'react';

// Interface pour les données de produit dans une commande (structure enrichie)
interface OrderProductData {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  colorName?: string;
  colorCode?: string;
  size?: string;
  // Données enrichies depuis vendor-products
  mockupImageUrl?: string;
  designImageUrl?: string | null;
  designPosition?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
  delimitation?: {
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType: 'PERCENTAGE' | 'PIXEL';
  };
}

interface OrderProductPreviewProps {
  product: OrderProductData;
  className?: string;
}

export const OrderProductPreview: React.FC<OrderProductPreviewProps> = ({
  product,
  className = ''
}) => {
  console.log('🎨 [OrderProductPreview] Product received:', {
    id: product.id,
    mockupImageUrl: product.mockupImageUrl,
    designImageUrl: product.designImageUrl,
    designPosition: product.designPosition,
    delimitation: product.delimitation
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculer la position du design en pixels
  const computeDesignPosition = () => {
    if (!product.delimitation || !product.designPosition || !imgRef.current || !containerRef.current) {
      console.log('❌ [OrderProductPreview] Missing data:', {
        hasDelimitation: !!product.delimitation,
        hasDesignPosition: !!product.designPosition,
        hasImgRef: !!imgRef.current,
        hasContainerRef: !!containerRef.current
      });
      return null;
    }

    console.log('✅ [OrderProductPreview] Computing design position...');

    const container = containerRef.current.getBoundingClientRect();
    const imgNaturalWidth = imgRef.current.naturalWidth;
    const imgNaturalHeight = imgRef.current.naturalHeight;

    // Convertir la délimitation en pixels d'affichage
    const isPixel = product.delimitation.coordinateType === 'PIXEL' ||
                    product.delimitation.x > 100 ||
                    product.delimitation.y > 100;

    const pct = {
      x: isPixel ? (product.delimitation.x / imgNaturalWidth) * 100 : product.delimitation.x,
      y: isPixel ? (product.delimitation.y / imgNaturalHeight) * 100 : product.delimitation.y,
      w: isPixel ? (product.delimitation.width / imgNaturalWidth) * 100 : product.delimitation.width,
      h: isPixel ? (product.delimitation.height / imgNaturalHeight) * 100 : product.delimitation.height,
    };

    // Calcul responsive comme dans SimpleProductPreview
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

    const delimPos = {
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };

    // Position du design
    const designScale = product.designPosition.scale || 0.8;
    const actualDesignWidth = delimPos.width * designScale;
    const actualDesignHeight = delimPos.height * designScale;

    const maxX = (delimPos.width - actualDesignWidth) / 2;
    const minX = -(delimPos.width - actualDesignWidth) / 2;
    const maxY = (delimPos.height - actualDesignHeight) / 2;
    const minY = -(delimPos.height - actualDesignHeight) / 2;
    const adjustedX = Math.max(minX, Math.min(product.designPosition.x, maxX));
    const adjustedY = Math.max(minY, Math.min(product.designPosition.y, maxY));

    return {
      delimPos,
      designWidth: actualDesignWidth,
      designHeight: actualDesignHeight,
      designX: adjustedX,
      designY: adjustedY,
      rotation: product.designPosition.rotation || 0
    };
  };

  const [designPosition, setDesignPosition] = useState<ReturnType<typeof computeDesignPosition>>(null);

  useEffect(() => {
    if (imageLoaded) {
      const pos = computeDesignPosition();
      setDesignPosition(pos);
    }
  }, [imageLoaded, product]);

  // Observer les changements de taille
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (imageLoaded) {
        const pos = computeDesignPosition();
        setDesignPosition(pos);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [imageLoaded]);

  if (!product.mockupImageUrl) {
    return (
      <div className={`aspect-square bg-gray-100 flex items-center justify-center rounded-lg ${className}`}>
        <span className="text-gray-500 text-sm">Image non disponible</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Image du mockup */}
      <img
        ref={imgRef}
        src={product.mockupImageUrl}
        alt={product.name}
        className="w-full h-full object-contain"
        onLoad={() => setImageLoaded(true)}
      />

      {/* Design superposé si disponible */}
      {product.designImageUrl && designPosition && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          <div
            className="absolute overflow-hidden"
            style={{
              left: designPosition.delimPos.left,
              top: designPosition.delimPos.top,
              width: designPosition.delimPos.width,
              height: designPosition.delimPos.height,
            }}
          >
            <div
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: designPosition.designWidth,
                height: designPosition.designHeight,
                transform: `translate(-50%, -50%) translate(${designPosition.designX}px, ${designPosition.designY}px) rotate(${designPosition.rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={product.designImageUrl}
                alt="Design"
                className="object-contain w-full h-full"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Badge de quantité */}
      {product.quantity > 1 && (
        <div className="absolute top-2 right-2 bg-[#049be5] text-white px-2 py-1 rounded-full text-xs font-bold">
          x{product.quantity}
        </div>
      )}

      {/* Informations du produit */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <p className="text-white font-medium text-sm truncate">{product.name}</p>
        {product.colorName && (
          <div className="flex items-center gap-2 mt-1">
            {product.colorCode && (
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: product.colorCode }}
              />
            )}
            <span className="text-white/90 text-xs">{product.colorName}</span>
            {product.size && <span className="text-white/90 text-xs">• {product.size}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderProductPreview;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// Types basés sur la structure API
interface DelimitationData {
  id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL' | string; // Accept string and convert
  rotation?: number;
  name?: string;
}

interface ColorOption {
  id: number;
  name: string;
  colorCode: string;
}

interface ImageWithDelimitations {
  id?: number;
  url: string;
  viewType?: string;
  view?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  publicId?: string;
  delimitations: DelimitationData[];
}

interface AdminProductMinimal {
  id: number;
  name: string;
  description?: string;
  
  // Structure design
  hasDesign: boolean;
  designApplication?: {
    hasDesign: boolean;
    designUrl: string;
    scale?: number;
    designHeight?: number; // 🆕 Ajout des dimensions du design
    designWidth?: number;  // 🆕 Ajout des dimensions du design
  };
  designPositions?: Array<{
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      designHeight?: number; // 🆕 Ajout des dimensions du design
      designWidth?: number;  // 🆕 Ajout des dimensions du design
    };
  }>;
  designScale?: number;
  designHeight?: number; // 🆕 Ajout des dimensions du design
  designWidth?: number;  // 🆕 Ajout des dimensions du design
  
  // Structure produit admin
  adminProduct?: {
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: ImageWithDelimitations[];
    }>;
  };
  
  // Structure produit base (fallback)
  baseProduct?: {
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: ImageWithDelimitations[];
    }>;
  };
  
  // Images legacy
  images?: Array<{
    colorCode: string;
    cloudinaryUrl: string;
  }>;
}

interface PreviewProps {
  product: any; // Use flexible type to accept VendorProduct
  selectedColorId?: number;
  showColorSlider?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
}

const AdminProductDesignPreview: React.FC<PreviewProps> = ({
  product,
  selectedColorId,
  showColorSlider = true,
  size = 'md'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // États
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [loadingImg, setLoadingImg] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Résolution des couleurs avec useMemo pour éviter la boucle infinie
  const colors = useMemo((): ColorOption[] => {
    if (product.adminProduct?.colorVariations?.length) {
      return product.adminProduct.colorVariations.map(c => ({ id: c.id, name: c.name, colorCode: c.colorCode }));
    }
    if (product.baseProduct?.colorVariations?.length) {
      return product.baseProduct.colorVariations.map(c => ({ id: c.id, name: c.name, colorCode: c.colorCode }));
    }
    if (product.images?.length) {
      return product.images.map((img, idx) => ({ id: idx, name: img.colorCode, colorCode: img.colorCode }));
    }
    return [];
  }, [product.adminProduct?.colorVariations, product.baseProduct?.colorVariations, product.images]);

  const [currentColorId, setCurrentColorId] = useState<number>(() => selectedColorId ?? (colors[0]?.id ?? 0));

  useEffect(() => {
    if (selectedColorId !== undefined && selectedColorId !== currentColorId) {
      setCurrentColorId(selectedColorId);
    }
  }, [selectedColorId, currentColorId]);

  // Couleur actuelle avec useMemo
  const currentColor = useMemo(() => {
    return colors.find(c => c.id === currentColorId) ?? colors[0];
  }, [colors, currentColorId]);
  
  const getCurrentImage = (): ImageWithDelimitations | null => {
    if (!currentColor) return null;
    
    if (product.adminProduct?.colorVariations?.length) {
      const variation = product.adminProduct.colorVariations.find(v => v.id === currentColor.id);
      return variation?.images.find(img => img.viewType === 'Front') ?? variation?.images[0] ?? null;
    }
    
    if (product.baseProduct?.colorVariations?.length) {
      const variation = product.baseProduct.colorVariations.find(v => v.id === currentColor.id);
      return variation?.images.find(img => img.view === 'Front') ?? variation?.images[0] ?? null;
    }
    
    if (product.images?.length) {
      const img = product.images.find(i => i.colorCode === currentColor.colorCode);
      return img ? { url: img.cloudinaryUrl, delimitations: [] } : null;
    }
    
    return null;
  };

  const currentImage = getCurrentImage();

  // Calcul des métriques d'image (exactement comme SimpleProductPreview)
  const calculateImageMetrics = (): ImageMetrics | null => {
    if (!imgRef.current || !containerRef.current) return null;

    const img = imgRef.current;
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
    
    const scale = displayWidth / originalWidth;

    return {
      originalWidth,
      originalHeight,
      displayWidth,
      displayHeight,
      canvasScale: scale,
      canvasOffsetX: offsetX,
      canvasOffsetY: offsetY
    };
  };

  // Recalculer les métriques quand l'image change - FIX: utiliser currentColorId au lieu de currentColor
  useEffect(() => {
    if (imageLoaded) {
      const metrics = calculateImageMetrics();
      setImageMetrics(metrics);
    }
  }, [imageLoaded, currentColorId]);

  // Observer les changements de taille du container (comme SimpleProductPreview)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (imageLoaded) {
        const metrics = calculateImageMetrics();
        setImageMetrics(metrics);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [imageLoaded]);

  // Calcul de position délimitation en pixels (exactement comme SimpleProductPreview)
  const computePxPosition = (delim: DelimitationData) => {
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = imageMetrics?.originalWidth || 1200;
    const imgH = imageMetrics?.originalHeight || 1200;

    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    const contW = imageMetrics?.displayWidth || 0;
    const contH = imageMetrics?.displayHeight || 0;
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

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
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };
  };

  // Récupération des délimitations (comme SimpleProductPreview)
  const delimitations = currentImage?.delimitations || [];

  // Récupération de la position du design (comme SimpleProductPreview)
  const getDesignPosition = () => {
    // Priorité aux designPositions
    if (product.designPositions && product.designPositions.length > 0) {
      const pos = product.designPositions[0].position;
      // console.log('📍 Position depuis designPositions:', pos); // Supprimer ce log qui cause les boucles
      return { 
        x: pos.x, 
        y: pos.y, 
        scale: pos.scale, 
        rotation: pos.rotation,
        designHeight: pos.designHeight || product.designHeight,
        designWidth: pos.designWidth || product.designWidth
      };
    }
    
    // Fallback scale et dimensions
    const scale = product.designApplication?.scale ?? product.designScale ?? 1;
    const designHeight = product.designApplication?.designHeight ?? product.designHeight;
    const designWidth = product.designApplication?.designWidth ?? product.designWidth;
    
    return { 
      x: 0, 
      y: 0, 
      scale, 
      rotation: 0,
      designHeight,
      designWidth
    };
  };

  const designPosition = getDesignPosition();

  // Gestionnaires couleurs
  const changeColor = (direction: 'prev' | 'next') => {
    if (!colors.length) return;
    const idx = colors.findIndex(c => c.id === currentColorId);
    const nextIdx = direction === 'next' ? (idx + 1) % colors.length : (idx - 1 + colors.length) % colors.length;
    setCurrentColorId(colors[nextIdx].id);
  };

  // Dimensions responsives
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-64 h-64'
  }[size];

  const designUrl = product.designApplication?.designUrl;

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center ${sizeClasses}`}>
      {/* Image produit */}
      {currentImage && (
        <img
          ref={imgRef}
          src={currentImage.url}
          alt={product.name}
          className="w-full h-full object-contain"
          onLoad={() => {
            setImageLoaded(true);
            setLoadingImg(false);
          }}
          onError={() => setError('Erreur image produit')}
        />
      )}

      {/* Design superposé avec logique exacte de SimpleProductPreview */}
      {product.hasDesign && designUrl && imageMetrics && delimitations.length > 0 && (
        (() => {
          const { x, y, scale, rotation, designHeight, designWidth } = designPosition;
          const delimitation = delimitations[0];
          const pos = computePxPosition(delimitation);
          
          if (pos.width <= 0 || pos.height <= 0) return null;
          
          // 🎯 NOUVEAU SYSTÈME : Utiliser un ratio CONSTANT de la délimitation (comme le produit et l'image sont fusionnés)
          // Le design utilise toujours le même pourcentage de la délimitation, indépendamment de la taille d'écran
          const designScale = scale || 0.8; // Ratio constant par défaut : 80% de la délimitation
          const actualDesignWidth = pos.width * designScale;
          const actualDesignHeight = pos.height * designScale;
          
          // 🆕 Contraintes de positionnement comme dans SimpleProductPreview
          const maxX = (pos.width - actualDesignWidth) / 2;
          const minX = -(pos.width - actualDesignWidth) / 2;
          const maxY = (pos.height - actualDesignHeight) / 2;
          const minY = -(pos.height - actualDesignHeight) / 2;
          const adjustedX = Math.max(minX, Math.min(x, maxX));
          const adjustedY = Math.max(minY, Math.min(y, maxY));
          
          // console.log(`🎨 Positionnement exact comme SimpleProductPreview pour produit ${product.id}:`, {
          //   originalCoords: { x, y, scale, rotation },
          //   dimensions: { designWidth, designHeight, actualDesignWidth, actualDesignHeight },
          //   delimitation,
          //   pos,
          //   adjustedCoords: { adjustedX, adjustedY },
          //   constraints: { maxX, minX, maxY, minY }
          // });
          
          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ 
                zIndex: 2,
                overflow: 'visible'
              }}
            >
              {/* Conteneur délimité exactement comme dans SimpleProductPreview */}
              <div
                className="absolute overflow-hidden group"
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: pos.width,
                  height: pos.height,
                }}
              >
                {/* 🆕 Conteneur du design avec dimensions exactes comme dans SimpleProductPreview */}
                <div
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: actualDesignWidth,
                    height: actualDesignHeight,
                    transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation || 0}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  {/* Image du design qui remplit son conteneur avec scale(1) comme dans SimpleProductPreview */}
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
            </div>
          );
        })()
      )}

      {/* Chargement */}
      {loadingImg && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
        </div>
      )}
      
      {/* Erreur */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100/80">
          <AlertCircle className="w-4 h-4 text-red-600" />
        </div>
      )}

      {/* Slider couleurs (desktop only) */}
      {showColorSlider && colors.length > 1 && !loadingImg && !error && (
        <div className="absolute bottom-1 left-1 right-1 hidden sm:flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-md p-1 shadow">
          <button onClick={() => changeColor('prev')} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-1">
            {colors.slice(0, 4).map(c => (
              <button
                key={c.id}
                onClick={() => setCurrentColorId(c.id)}
                className={`w-4 h-4 rounded-full border ${c.id === currentColorId ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: c.colorCode }}
              />
            ))}
          </div>
          <button onClick={() => changeColor('next')} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Validation ✔ */}
      {product.hasDesign && (
        <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1 rounded">✔</div>
      )}
    </div>
  );
};

export default AdminProductDesignPreview; 
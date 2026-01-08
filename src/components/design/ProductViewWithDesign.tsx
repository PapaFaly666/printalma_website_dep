import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Palette, Save, Move } from 'lucide-react';
import Button from '../ui/Button';
import { useDesignTransforms } from '../../hooks/useDesignTransforms';
import { getVendorProductId } from '../../utils/vendorProductHelpers';
import { useToast } from '../ui/use-toast';

interface ProductViewWithDesignProps {
  view: any;
  designUrl: string;
  productId?: number;
  products?: any[];
  vendorDesigns?: any[];
  cropInfo?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    boundingBox: { x: number; y: number; width: number; height: number };
  } | null;
  className?: string;
}

const ProductViewWithDesign: React.FC<ProductViewWithDesignProps> = ({
  view,
  designUrl,
  productId = 0,
  products = [],
  vendorDesigns = [],
  cropInfo = null,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [useModernCanvas, setUseModernCanvas] = useState(false);
  const { toast } = useToast();

  const {
    transformStates,
    updateTransform,
    getTransform,
    resetTransforms,
    saveNow,
    isLoading: isLoadingTransforms,
    isSaving,
    lastSaveTime
  } = useDesignTransforms(productId, designUrl, products, vendorDesigns);

  const dragState = useRef<any>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
    }
  }, [view.url || view.imageUrl]);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const delimitations = (view.delimitations || []) as Array<any>;

  const computePxPosition = (delim: any) => {
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = naturalSize.width || 1200;
    const imgH = naturalSize.height || 1200;

    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    const { width: contW, height: contH } = containerSize;
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

  const handleMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    const currentTransform = getTransform(idx);
    dragState.current = {
      delimIdx: idx,
      startX: e.clientX,
      startY: e.clientY,
      origX: currentTransform.x,
      origY: currentTransform.y,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.current) return;
    const { delimIdx, startX, startY, origX, origY } = dragState.current;
    if (delimIdx === null) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    updateTransform(delimIdx, { x: origX + dx, y: origY + dy });
  };

  const handleMouseUp = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  // Import du ModernDesignCanvas si nécessaire
  if (useModernCanvas && designUrl && delimitations.length > 0) {
    const ModernDesignCanvas = React.lazy(() => import('./ModernDesignCanvas'));
    return (
      <div className={`relative ${className}`}>
        <div className="absolute top-2 right-2 z-30 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseModernCanvas(false)}
            className="bg-white/90 hover:bg-white text-xs"
          >
            Mode classique
          </Button>
          {isSaving && (
            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde...
            </div>
          )}
        </div>

        <React.Suspense fallback={<div>Chargement du canvas moderne...</div>}>
          <ModernDesignCanvas
            view={view}
            designUrl={designUrl}
            productId={productId}
            products={products}
            vendorDesigns={vendorDesigns}
            cropInfo={cropInfo}
            className="w-full"
          />
        </React.Suspense>
      </div>
    );
  }

  // Mode classique
  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <div className="absolute top-2 right-2 z-30 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUseModernCanvas(true);
              if (toast) {
                toast({
                  title: "🎨 Mode moderne activé !",
                  description: "Interface améliorée avec délimitations visibles et contrôles avancés.",
                  duration: 3000,
                });
              }
            }}
            className="bg-white/90 hover:bg-white text-xs"
            title="Activer le mode moderne avec zone délimitée"
          >
            <Palette className="h-3 w-3 mr-1" />
            Mode moderne
          </Button>
          {isSaving && (
            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde...
            </div>
          )}
        </div>
        
        <img
          ref={imgRef}
          src={view.url || view.imageUrl}
          alt="Vue produit"
          className="w-full h-full object-contain"
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />

        {designUrl && delimitations.map((delim: any, idx: number) => {
          const pos = computePxPosition(delim);
          if (pos.width <= 0 || pos.height <= 0) return null;
          
          const t = getTransform(idx);
          
          // Utiliser les dimensions par défaut avec scale de 0.8
          const scale = 0.8;
          const designWidth = pos.width * scale;
          const designHeight = pos.height * scale;
          
          const maxX = (pos.width - designWidth) / 2;
          const minX = -(pos.width - designWidth) / 2;
          const maxY = (pos.height - designHeight) / 2;
          const minY = -(pos.height - designHeight) / 2;
          
          const x = Math.max(minX, Math.min(t.x, maxX));
          const y = Math.max(minY, Math.min(t.y, maxY));
          
          return (
            <div
              key={idx}
              className={`absolute overflow-hidden group ${hoveredIdx === idx ? 'z-10' : ''}`}
              style={{
                left: pos.left,
                top: pos.top,
                width: pos.width,
                height: pos.height,
                cursor: 'grab',
              }}
              onMouseDown={e => handleMouseDown(e, idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              tabIndex={0}
              title="Déplacez le design - Mode classique"
            >
              <div
                className={`absolute inset-0 pointer-events-none rounded border-2 transition-all duration-150 ${hoveredIdx === idx ? 'border-indigo-500 shadow-lg' : 'border-transparent'}`}
                style={{ zIndex: 2 }}
              />
              <div
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  width: designWidth,
                  height: designHeight,
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={designUrl}
                  alt="Design"
                  className="object-contain pointer-events-none select-none"
                  style={{
                    width: '100%',
                    height: '100%',
                    transition: 'box-shadow 0.2s',
                    boxShadow: hoveredIdx === idx ? '0 0 0 2px #6366f1' : undefined,
                  }}
                  draggable={false}
                />
              </div>
              
              {hoveredIdx === idx && (
                <div className="absolute -bottom-5 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">
                  {Math.round(designWidth)}×{Math.round(designHeight)}px
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute bottom-2 left-2 flex gap-2 z-20">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-xs bg-white/90 hover:bg-white"
            onClick={resetTransforms}
            title="Réinitialiser les positions"
          >
            <Move className="h-3 w-3 mr-1" />
            Reset
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-xs bg-white/90 hover:bg-white"
            onClick={saveNow}
            title="Sauvegarder maintenant"
          >
            <Save className="h-3 w-3 mr-1" />
            Sauver
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductViewWithDesign; 
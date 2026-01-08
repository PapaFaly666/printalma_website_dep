import React, { useState, useRef, useEffect } from 'react';
import { useDesignTransforms } from '../../hooks/useDesignTransforms';
import { Loader2, Save, Ruler, Shield, Info } from 'lucide-react';
import Button from '../ui/Button';
import { debugProductIds } from '../../utils/vendorProductHelpers';
import { Badge } from '../ui/badge';

interface ProductViewWithDesignProps {
  view: any; // contains url & delimitations
  designUrl: string;
  product?: any; // Changed from productId to product object
  vendorProducts?: any[];
  vendorDesigns?: any[];
}

const ProductViewWithDesign: React.FC<ProductViewWithDesignProps> = ({ view, designUrl, product, vendorProducts = [], vendorDesigns = [] }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Debug product IDs
  useEffect(() => {
    if (product) {
      // Gérer le cas où product est un nombre
      if (typeof product === 'number') {
        console.log('✅ ProductViewWithDesign - Product ID:', product);
      } else {
      debugProductIds(product);
      console.log('✅ ProductViewWithDesign - Product object:', product);
      }
    }
  }, [product]);

  // 🆕 Utilisation du hook pour gérer les transformations avec sauvegarde automatique
  const {
    transformStates,
    updateTransform,
    getTransform,
    resetTransforms,
    saveNow,
    isLoading: isLoadingTransforms,
    isSaving,
    lastSaveTime,
    conception,
    error,
    positioning, // 🆕 Données du système d'isolation
    diagnostic // 🆕 Fonctions de diagnostic
  } = useDesignTransforms(product, designUrl, vendorProducts, vendorDesigns);

  const dragState = useRef<{ delimIdx: number | null; startX: number; startY: number; origX: number; origY: number; mode: 'move' | 'resize'; origScale: number } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showIsolationInfo, setShowIsolationInfo] = useState(false);

  // Observer natural image size
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
    }
  }, [(view as any).url || (view as any).imageUrl]);

  // Observe container resize
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
      mode: 'move',
      origScale: currentTransform.scale,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const currentTransform = getTransform(idx);
    dragState.current = {
      delimIdx: idx,
      startX: e.clientX,
      startY: e.clientY,
      origX: currentTransform.x,
      origY: currentTransform.y,
      mode: 'resize',
      origScale: currentTransform.scale,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.current) return;
    const { delimIdx, startX, startY, origX, origY, mode, origScale } = dragState.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (mode === 'move') {
      updateTransform(delimIdx!, { x: origX + dx, y: origY + dy });
    } else if (mode === 'resize') {
      // Utilise le déplacement diagonal pour ajuster l'échelle
      const delta = Math.max(dx, dy);
      let newScale = origScale + delta / 120; // 120px = double taille
      newScale = Math.max(0.2, Math.min(newScale, 3));
      updateTransform(delimIdx!, { scale: newScale });
    }
  };

  const handleMouseUp = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div ref={containerRef} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
      {/* 🆕 Indicateur de système d'isolation */}
      {positioning.hasPosition && (
        <div className="absolute top-2 left-2 z-20 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Position isolée
        </div>
      )}
      
      {/* 🆕 Indicateur de mode conception */}
      {conception && (
        <div className="absolute top-2 left-16 z-20 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          ℹ️ Mode conception
        </div>
      )}
      
      {/* 🆕 Indicateur de sauvegarde */}
      {isSaving && (
        <div className="absolute top-2 right-2 z-20 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sauvegarde...
        </div>
      )}
      
      {/* 🆕 Indicateur d'erreur */}
      {error && (
        <div className="absolute top-12 right-2 z-20 bg-red-500 text-white px-2 py-1 rounded text-xs">
          ⚠️ {error}
        </div>
      )}
      
      {/* 🆕 Panneau d'information isolation */}
      <div className="absolute bottom-2 left-2 z-20">
        <Button
          onClick={() => setShowIsolationInfo(!showIsolationInfo)}
          variant="outline"
          size="sm"
          className="mb-2"
        >
          <Info className="h-4 w-4" />
          Info
        </Button>
        
        {showIsolationInfo && (
          <div className="bg-white/90 backdrop-blur-sm border rounded-lg p-3 text-xs space-y-2 min-w-[200px]">
            <div className="font-semibold">🛡️ Système d'isolation</div>
            <div>
              <span className="font-medium">Produit ID:</span> {
                typeof product === 'number' ? product : 
                (product?.id || product?.vendorProductId || 'N/A')
              }
            </div>
            <div>
              <span className="font-medium">Design ID:</span> {
                typeof product === 'number' ? 1 : 
                (product?.designId || 1)
              }
            </div>
            
            {positioning.position && (
              <div className="border-t pt-2">
                <div className="font-medium">Position isolée:</div>
                <div>X: {Math.round(positioning.position.x)}px</div>
                <div>Y: {Math.round(positioning.position.y)}px</div>
                <div>Échelle: {positioning.position.scale?.toFixed(2) || 1}</div>
                <div>Rotation: {positioning.position.rotation || 0}°</div>
              </div>
            )}
            
            {positioning.isOptimistic && (
              <div className="text-orange-600 font-medium">
                ⏳ Sauvegarde en cours...
              </div>
            )}
            
            <div className="flex gap-1 flex-wrap">
              <Button
                onClick={() => positioning.deletePosition()}
                variant="destructive"
                size="sm"
                className="text-xs"
              >
                🗑️ Supprimer
              </Button>
              <Button
                onClick={() => positioning.savePosition({
                  x: 0, y: 0, scale: 1, rotation: 0, 
                  constraints: { adaptive: true }
                })}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                ↺ Reset
              </Button>
              <Button
                onClick={() => {
                  if (positioning.position) {
                    positioning.savePosition(positioning.position);
                  }
                }}
                variant="default"
                size="sm"
                className="text-xs"
              >
                💾 Sauver
              </Button>
            </div>
            
            {/* 🆕 Contrôles de diagnostic en cas d'erreur */}
            {error && (
              <div className="border-t pt-2 mt-2">
                <div className="text-red-600 font-medium mb-1">⚠️ Erreurs détectées</div>
                <div className="flex gap-1 flex-wrap">
                  <Button
                    onClick={() => diagnostic.runDiagnostic()}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                  >
                    🔍 Diagnostic
                  </Button>
                  <Button
                    onClick={() => diagnostic.clearMappings()}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
                  >
                    🧹 Reset IDs
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('📊 === INFO PRODUIT ===');
                      console.log('Product:', product);
                      console.log('Type:', typeof product);
                      console.log('ID final:', typeof product === 'number' ? product : (product?.id || product?.vendorProductId));
                      console.log('Design ID:', product?.designId || 1);
                      console.log('📊 === FIN INFO ===');
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-gray-50 border-gray-200 hover:bg-gray-100"
                  >
                    📋 Info Debug
                  </Button>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Utilisez le diagnostic pour identifier et corriger automatiquement les problèmes d'IDs
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image produit */}
      <img
        ref={imgRef}
        src={(view as any).url || (view as any).imageUrl}
        alt="Produit"
        className="w-full h-full object-contain"
        onLoad={() => {
          if (imgRef.current) {
            setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
          }
        }}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />

      {/* Zones délimitées */}
      {delimitations.map((delim, idx) => {
        const { left, top, width, height } = computePxPosition(delim);
        const transform = getTransform(idx);
        const isMainDesign = idx === 0;
        const hasIsolation = isMainDesign && positioning.hasPosition;
        
        return (
          <div
            key={idx}
            className={`absolute border-2 border-dashed cursor-move select-none transition-all duration-200 ${
              hasIsolation 
                ? 'border-green-400 bg-green-400/10 ring-2 ring-green-400/50' 
                : 'border-blue-400 bg-blue-400/10'
            } ${hoveredIdx === idx ? 'border-solid shadow-lg' : ''}`}
            style={{
              left: `${left + transform.x}px`,
              top: `${top + transform.y}px`,
              width: `${width * transform.scale}px`,
              height: `${height * transform.scale}px`,
              transform: `rotate(${transform.rotation}deg)`,
            }}
            onMouseDown={(e) => handleMouseDown(e, idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Design dans la zone */}
            {designUrl && (
            <img
              src={designUrl}
              alt="Design"
                className="w-full h-full object-contain pointer-events-none"
              style={{
                  transform: `rotate(${-transform.rotation}deg)`,
                }}
              />
            )}
            
            {/* Poignée de redimensionnement */}
            <div
              className={`absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize border-2 border-white transition-all duration-200 ${
                hasIsolation ? 'bg-green-500' : 'bg-blue-500'
              } ${hoveredIdx === idx ? 'scale-125' : ''}`}
              onMouseDown={(e) => handleResizeMouseDown(e, idx)}
            />
            
            {/* Badge d'isolation */}
            {hasIsolation && (
              <div className="absolute -top-6 -left-1 bg-green-500 text-white px-2 py-1 rounded text-xs">
                🛡️ Isolé
              </div>
            )}
            
            {/* Informations de zone */}
            {hoveredIdx === idx && (
              <div className="absolute -top-8 left-0 bg-black text-white px-2 py-1 rounded text-xs z-10">
                {isMainDesign ? 'Design principal' : `Zone ${idx + 1}`}
                {transform.x !== 0 || transform.y !== 0 ? ` (${Math.round(transform.x)}, ${Math.round(transform.y)})` : ''}
              </div>
            )}
          </div>
        );
      })}

      {/* Indicateur de chargement */}
      {isLoadingTransforms && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des transformations...
          </div>
      </div>
      )}
    </div>
  );
};

export default ProductViewWithDesign; 
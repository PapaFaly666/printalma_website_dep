import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Move, Save, Ruler, Palette, X, Plus, Info, PencilLine } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useDesignTransforms } from '../../hooks/useDesignTransforms';
import { getVendorProductId } from '../../utils/vendorProductHelpers';

interface DesignProperties {
  width: number;
  height: number;
  scale: number;
  maintainAspectRatio: boolean;
}

interface ModernDesignCanvasProps {
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

const useDesignProperties = (designUrl: string) => {
  const [designProperties, setDesignProperties] = useState<DesignProperties>({
    width: 200,
    height: 200,
    scale: 1.0,
    maintainAspectRatio: true
  });

  const [designNaturalSize, setDesignNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (designUrl) {
      const img = new Image();
      img.onload = () => {
        setDesignNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        
        const defaultSize = Math.min(img.naturalWidth, img.naturalHeight, 200);
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        setDesignProperties(prev => ({
          ...prev,
          width: aspectRatio >= 1 ? defaultSize : defaultSize * aspectRatio,
          height: aspectRatio >= 1 ? defaultSize / aspectRatio : defaultSize,
        }));
      };
      img.src = designUrl;
    }
  }, [designUrl]);

  return {
    designProperties,
    setDesignProperties,
    designNaturalSize
  };
};

const ModernDesignCanvas: React.FC<ModernDesignCanvasProps> = ({
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const { designProperties, setDesignProperties, designNaturalSize } = useDesignProperties(designUrl);

  const {
    transformStates,
    updateTransform: updateTransformOriginal,
    getTransform: getTransformOriginal,
    resetTransforms,
    saveNow,
    isLoading: isLoadingTransforms,
    isSaving,
    lastSaveTime
  } = useDesignTransforms(productId, designUrl, products, vendorDesigns);

  const updateTransform = useCallback((idx: number, updates: any) => {
    updateTransformOriginal(idx, {
      ...updates,
      designWidth: updates.designWidth || designProperties.width,
      designHeight: updates.designHeight || designProperties.height,
      designScale: updates.designScale || designProperties.scale,
    });
  }, [updateTransformOriginal, designProperties]);

  const getTransform = useCallback((idx: number) => {
    const original = getTransformOriginal(idx);
    return {
      x: original.x,
      y: original.y,
      designWidth: original.designWidth || designProperties.width,
      designHeight: original.designHeight || designProperties.height,
      designScale: original.designScale || designProperties.scale,
    };
  }, [getTransformOriginal, designProperties]);

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
    setSelectedIdx(idx);
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

    const newX = origX + dx;
    const newY = origY + dy;
    
    const delim = delimitations[delimIdx];
    const pos = computePxPosition(delim);
    const currentTransform = getTransform(delimIdx);
    
    const designWidth = (currentTransform.designWidth || designProperties.width) * (currentTransform.designScale || designProperties.scale);
    const designHeight = (currentTransform.designHeight || designProperties.height) * (currentTransform.designScale || designProperties.scale);
    
    const maxX = (pos.width - designWidth) / 2;
    const minX = -(pos.width - designWidth) / 2;
    const maxY = (pos.height - designHeight) / 2;
    const minY = -(pos.height - designHeight) / 2;
    
    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));

    updateTransform(delimIdx, { x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={`relative ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .modern-design-canvas {
            background: 
              radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, transparent 24%, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.03) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03) 76%, transparent 77%),
              linear-gradient(45deg, transparent 24%, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.03) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03) 76%, transparent 77%);
            background-size: 100% 100%, 20px 20px, 20px 20px;
            background-position: 0 0, 0 0, 10px 10px;
          }
          
          .modern-delimitation {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .modern-delimitation:hover {
            border-color: #3b82f6;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
          }
          
          .modern-delimitation.selected {
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.05);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
          }
          
          .modern-design {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 6px;
            position: relative;
          }
          
          .modern-design:hover {
            filter: brightness(1.05);
          }
          
          .modern-design.selected {
            filter: brightness(1.05) drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
          }
          
          .guide-line {
            border-color: #3b82f6;
            opacity: 0.6;
            box-shadow: 0 0 4px rgba(59, 130, 246, 0.3);
          }
          
          .pulse-dot {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `
      }} />
      
      <div className="absolute top-3 left-3 z-30 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 min-w-[200px]">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Propriétés du design</h4>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 min-w-[50px]">Largeur:</label>
            <input
              type="number"
              min="10"
              max="500"
              value={Math.round(designProperties.width)}
              onChange={(e) => setDesignProperties(prev => ({ 
                ...prev, 
                width: Number(e.target.value),
                height: prev.maintainAspectRatio ? 
                  (Number(e.target.value) * designNaturalSize.height) / designNaturalSize.width : 
                  prev.height
              }))}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <span className="text-xs text-gray-500">px</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 min-w-[50px]">Hauteur:</label>
            <input
              type="number"
              min="10"
              max="500"
              value={Math.round(designProperties.height)}
              onChange={(e) => setDesignProperties(prev => ({ 
                ...prev, 
                height: Number(e.target.value),
                width: prev.maintainAspectRatio ? 
                  (Number(e.target.value) * designNaturalSize.width) / designNaturalSize.height : 
                  prev.width
              }))}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <span className="text-xs text-gray-500">px</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 min-w-[50px]">Échelle:</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={designProperties.scale}
              onChange={(e) => setDesignProperties(prev => ({ 
                ...prev, 
                scale: Number(e.target.value)
              }))}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 min-w-[30px]">{designProperties.scale.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="maintain-aspect"
              checked={designProperties.maintainAspectRatio}
              onChange={(e) => setDesignProperties(prev => ({ 
                ...prev, 
                maintainAspectRatio: e.target.checked
              }))}
              className="w-3 h-3"
            />
            <label htmlFor="maintain-aspect" className="text-xs text-gray-600">
              Garder les proportions
            </label>
          </div>
        </div>
      </div>
      
      {isSaving && (
        <div className="absolute top-3 right-3 z-30 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-lg">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sauvegarde automatique...
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="modern-design-canvas relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl"
      >
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
          const isSelected = selectedIdx === idx;
          const isHovered = hoveredIdx === idx;
          
          const designWidth = (t.designWidth || designProperties.width) * (t.designScale || designProperties.scale);
          const designHeight = (t.designHeight || designProperties.height) * (t.designScale || designProperties.scale);
          
          const maxX = (pos.width - designWidth) / 2;
          const minX = -(pos.width - designWidth) / 2;
          const maxY = (pos.height - designHeight) / 2;
          const minY = -(pos.height - designHeight) / 2;
          
          const x = Math.max(minX, Math.min(t.x, maxX));
          const y = Math.max(minY, Math.min(t.y, maxY));
          
          return (
            <div
              key={idx}
              className={`modern-delimitation absolute ${
                isSelected ? 'selected' : isHovered ? 'hovered' : ''
              }`}
              style={{
                left: pos.left,
                top: pos.top,
                width: pos.width,
                height: pos.height,
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              title={`Zone de design ${idx + 1} - ${delim.name || 'Sans nom'}`}
            >
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t font-medium">
                {delim.name || `Zone ${idx + 1}`}
              </div>
              
              <div
                className={`modern-design absolute cursor-grab active:cursor-grabbing ${
                  isSelected ? 'selected' : ''
                }`}
                onMouseDown={e => handleMouseDown(e, idx)}
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
                    transform: `scale(1)`,
                  }}
                  draggable={false}
                />
              </div>
              
              {isSelected && (
                <div className="absolute -bottom-6 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-b font-medium">
                  {Math.round(designWidth)}×{Math.round(designHeight)}px
                </div>
              )}
              
              {isSelected && dragState.current?.delimIdx === idx && (
                <>
                  <div 
                    className="guide-line absolute w-full border-t-2 pointer-events-none z-10" 
                    style={{ top: '50%', transform: `translateY(${y}px)` }}
                  />
                  <div 
                    className="guide-line absolute h-full border-l-2 pointer-events-none z-10" 
                    style={{ left: '50%', transform: `translateX(${x}px)` }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={resetTransforms}
          className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 shadow-sm"
        >
          <Move className="h-4 w-4 mr-2" />
          Réinitialiser positions
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={saveNow}
          className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 shadow-sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder maintenant
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const aspectRatio = designNaturalSize.width / designNaturalSize.height;
            const defaultSize = Math.min(designNaturalSize.width, designNaturalSize.height, 200);
            
            setDesignProperties({
              width: aspectRatio >= 1 ? defaultSize : defaultSize * aspectRatio,
              height: aspectRatio >= 1 ? defaultSize / aspectRatio : defaultSize,
              scale: 1.0,
              maintainAspectRatio: true
            });
          }}
          className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 shadow-sm"
        >
          <Ruler className="h-4 w-4 mr-2" />
          Reset dimensions
        </Button>
        
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm border border-gray-300 shadow-sm">
          <span className="font-semibold">{delimitations.length}</span> zone{delimitations.length > 1 ? 's' : ''}
          {selectedIdx !== null && (
            <span className="ml-2 text-blue-600">
              • Zone {selectedIdx + 1} sélectionnée
            </span>
          )}
          <span className="ml-2 text-gray-500">
            • Design: {Math.round(designProperties.width * designProperties.scale)}×{Math.round(designProperties.height * designProperties.scale)}px
          </span>
        </div>
        
        {lastSaveTime && (
          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            Dernière sauvegarde: {new Date(lastSaveTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernDesignCanvas; 
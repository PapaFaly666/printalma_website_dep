import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../../services/productService';
import { DesignPosition } from '../../services/designDuplicateService';
import { Button } from '../ui/button';
import { Save, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface DesignRepositionInterfaceProps {
  product: Product;
  designUrl: string;
  initialPosition?: DesignPosition;
  onSave: (position: DesignPosition) => void;
  onCancel: () => void;
}

export const DesignRepositionInterface: React.FC<DesignRepositionInterfaceProps> = ({
  product,
  designUrl,
  initialPosition,
  onSave,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Position et taille du design
  const [position, setPosition] = useState<DesignPosition>(
    initialPosition || {
      x: 25,
      y: 25,
      width: 50,
      height: 50,
      scale: 1,
      coordinateType: 'PERCENTAGE'
    }
  );

  const dragState = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    mode: 'move' | 'resize';
  } | null>(null);

  // Observer la taille du conteneur
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Observer la taille naturelle de l'image
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight
      });
    }
  }, []);

  const getMainView = () => {
    if (product.colorVariations && product.colorVariations.length > 0) {
      const firstVariation = product.colorVariations[0];
      if (firstVariation.images && firstVariation.images.length > 0) {
        const frontImage = firstVariation.images.find((img: any) => 
          (img.view || '').toUpperCase() === 'FRONT'
        );
        return frontImage || firstVariation.images[0];
      }
    }
    
    if (product.views && product.views.length > 0) {
      const frontView = product.views.find(v => 
        (v.viewType || '').toUpperCase() === 'FRONT'
      );
      return frontView || product.views[0];
    }
    
    return null;
  };

  const view = getMainView();
  const imageUrl = view ? (view as any).url || (view as any).imageUrl || (view as any).src : null;

  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(mode === 'move');
    setIsResizing(mode === 'resize');
    
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      mode
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragState.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragState.current.startY) / rect.height) * 100;
    
    if (dragState.current.mode === 'move') {
      const newX = Math.max(0, Math.min(100 - position.width, dragState.current.startPosX + deltaX));
      const newY = Math.max(0, Math.min(100 - position.height, dragState.current.startPosY + deltaY));
      
      setPosition(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (dragState.current.mode === 'resize') {
      const newWidth = Math.max(10, Math.min(100 - position.x, position.width + deltaX));
      const newHeight = Math.max(10, Math.min(100 - position.y, position.height + deltaY));
      
      setPosition(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    dragState.current = null;
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, position]);

  const handleSave = () => {
    onSave(position);
  };

  const handleReset = () => {
    setPosition(initialPosition || {
      x: 25,
      y: 25,
      width: 50,
      height: 50,
      scale: 1,
      coordinateType: 'PERCENTAGE'
    });
  };

  const handleScale = (delta: number) => {
    setPosition(prev => {
      const newScale = Math.max(0.1, Math.min(2, (prev.scale || 1) + delta));
      return {
        ...prev,
        scale: newScale
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Repositionnement du design
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Glissez-déposez le design pour le repositionner, ou redimensionnez-le en tirant sur le coin inférieur droit.
        </p>
      </div>

      {/* Interface de repositionnement */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {product.name}
          </h4>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScale(-0.1)}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScale(0.1)}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-crosshair"
          style={{ maxHeight: '400px' }}
        >
          {/* Image du produit */}
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({
                  width: img.naturalWidth,
                  height: img.naturalHeight
                });
              }}
            />
          )}

          {/* Design positionnable */}
          <div
            className={`absolute border-2 border-dashed ${
              isDragging ? 'border-blue-500 bg-blue-100/50' : 'border-gray-400 hover:border-blue-400'
            } cursor-move`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${position.width}%`,
              height: `${position.height}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Design */}
            <img
              src={designUrl}
              alt="Design"
              className="w-full h-full object-contain pointer-events-none"
              style={{
                transform: `scale(${position.scale || 1})`,
                transformOrigin: 'center',
              }}
            />

            {/* Poignée de redimensionnement */}
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 ${
                isResizing ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-400'
              } cursor-nw-resize`}
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
            />
          </div>

          {/* Grille d'aide (optionnelle) */}
          {(isDragging || isResizing) && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-20">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-gray-500" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informations de position */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Position: {position.x.toFixed(1)}% × {position.y.toFixed(1)}%</div>
          <div>Taille: {position.width.toFixed(1)}% × {position.height.toFixed(1)}%</div>
          <div>Échelle: {((position.scale || 1) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer la nouvelle position
        </Button>
      </div>
    </div>
  );
}; 
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ProductViewWithDesignProps {
  view: any; // contains url & delimitations
  designUrl: string;
  productId?: number;
  products?: any[];
  vendorDesigns?: any[];
  designCropInfo?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    boundingBox: { x: number; y: number; width: number; height: number };
  } | null;
  isAdmin?: boolean; // Nouvelle prop pour le mode admin
}

const ProductViewWithDesign: React.FC<ProductViewWithDesignProps> = ({ 
  view, 
  designUrl, 
  productId = 0, 
  products = [], 
  vendorDesigns = [], 
  designCropInfo,
  isAdmin = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // États pour la manipulation directe
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialTransform, setInitialTransform] = useState<any>(null);

  // États pour le redimensionnement
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number } | null>(null);
  const [initialSize, setInitialSize] = useState<{ width: number; height: number; scale: number } | null>(null);

  // États pour la rotation
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState<{ x: number; y: number; angle: number } | null>(null);
  const [initialRotation, setInitialRotation] = useState<number>(0);

  // États pour les transformations de chaque délimitation
  const [transforms, setTransforms] = useState<Record<number, {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>>({});

  // États pour la validation des délimitations
  const [delimitationErrors, setDelimitationErrors] = useState<Record<number, boolean>>({});

  // État pour la taille réelle du design
  const [designSize, setDesignSize] = useState<{ width: number; height: number }>({ width: 80, height: 80 });

  // Ref pour tracker si le centrage a déjà été fait
  const centeringDoneRef = useRef(false);

  // Observer natural image size
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
    }
  }, [view.url || view.imageUrl]);

  // Observer design image size
  useEffect(() => {
    if (designUrl) {
      const img = new Image();
      img.onload = () => {
        setDesignSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = designUrl;
    }
  }, [designUrl]);

  // Observe container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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

  // Obtenir ou créer les transformations pour une délimitation
  const getTransform = (idx: number) => {
    return transforms[idx] || { x: 0, y: 0, scale: 1, rotation: 0 };
  };

  // Centrer automatiquement les designs en mode admin
  useEffect(() => {
    if (isAdmin && view.delimitations && view.delimitations.length > 0 && containerSize.width > 0 && !centeringDoneRef.current) {
      centeringDoneRef.current = true;
      
      view.delimitations.forEach((delimItem: any, idx: number) => {
        const pos = computePxPosition(delimItem);
        
        // Utiliser le système de coordonnées centrées
        const centerX = 0; // Centre de la délimitation
        const centerY = 0; // Centre de la délimitation
        
        updateTransform(idx, { 
          x: centerX, 
          y: centerY, 
          scale: 1, 
          rotation: 0 
        });
        
        // Valider la délimitation après centrage
        const delim = view.delimitations[idx];
        const posCentering = computePxPosition(delim);
        validateDelimitation(idx, { x: centerX, y: centerY, scale: 1, rotation: 0 }, posCentering);
      });
    }
  }, [isAdmin, view.delimitations, containerSize.width, containerSize.height]);

  // Mettre à jour les transformations
  const updateTransform = (idx: number, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setTransforms(prev => ({
      ...prev,
      [idx]: { ...getTransform(idx), ...updates }
    }));
  };

  // Valider les délimitations à chaque changement de transforms
  useEffect(() => {
    if (view.delimitations && Object.keys(transforms).length > 0) {
      view.delimitations.forEach((delim: any, idx: number) => {
        const transform = getTransform(idx);
        const pos = computePxPosition(delim);
        validateDelimitation(idx, transform, pos);
      });
    }
  }, [transforms, view.delimitations]);

  // Valider si le design est dans les délimitations
  const validateDelimitation = (idx: number, transform: any, pos: any) => {
    const baseSize = 80;
    const scaledSize = baseSize * transform.scale;
    
    // Calculer les limites de la délimitation
    const maxX = (pos.width - scaledSize) / 2;
    const minX = -(pos.width - scaledSize) / 2;
    const maxY = (pos.height - scaledSize) / 2;
    const minY = -(pos.height - scaledSize) / 2;
    
    // Vérifier si le design est dans les limites
    const isInBounds = transform.x >= minX && transform.x <= maxX && 
                      transform.y >= minY && transform.y <= maxY;
    
    setDelimitationErrors(prev => ({
      ...prev,
      [idx]: !isInBounds
    }));
    
    return isInBounds;
  };

  // Déplacement fluide
  const handleDesignMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const currentTransform = getTransform(idx);
    
    setIsDragging(true);
    setDragStart({ x: mouseX, y: mouseY });
    setInitialTransform(currentTransform);
  };

  // Redimensionnement
  const handleResizeStart = (e: React.MouseEvent, idx: number, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const currentTransform = getTransform(idx);
    
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({ x: mouseX, y: mouseY });
    setInitialSize({ width: 80, height: 80, scale: currentTransform.scale });
  };

  // Rotation
  const handleRotationStart = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const currentTransform = getTransform(idx);
    
    setIsRotating(true);
    setRotationStart({ x: mouseX, y: mouseY, angle: currentTransform.rotation });
    setInitialRotation(currentTransform.rotation);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && dragStart && selectedIdx !== null) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      const delim = view.delimitations[selectedIdx];
      const pos = computePxPosition(delim);
      
      // Calculer les nouvelles positions
      const newX = initialTransform.x + deltaX;
      const newY = initialTransform.y + deltaY;
      
      // En mode admin, contraindre strictement dans les délimitations
      if (isAdmin) {
        const baseSize = 80;
        const scaledSize = baseSize * initialTransform.scale;
        
        // Utiliser le système de coordonnées centrées comme dans SellDesignPage
        const maxX = (pos.width - scaledSize) / 2;
        const minX = -(pos.width - scaledSize) / 2;
        const maxY = (pos.height - scaledSize) / 2;
        const minY = -(pos.height - scaledSize) / 2;
        
        const constrainedX = Math.max(minX, Math.min(maxX, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));
        
        updateTransform(selectedIdx, { x: constrainedX, y: constrainedY });
        
        // Valider en temps réel avec les valeurs actuelles
        validateDelimitation(selectedIdx, { x: constrainedX, y: constrainedY, scale: initialTransform.scale, rotation: initialTransform.rotation }, pos);
      } else {
        updateTransform(selectedIdx, { x: newX, y: newY });
        // Valider en temps réel même en mode non-admin
        validateDelimitation(selectedIdx, { x: newX, y: newY, scale: initialTransform.scale, rotation: initialTransform.rotation }, pos);
      }
    }

    if (isResizing && resizeStart && selectedIdx !== null && initialSize) {
      const deltaX = mouseX - resizeStart.x;
      const deltaY = mouseY - resizeStart.y;
      
      const delim = view.delimitations[selectedIdx];
      const pos = computePxPosition(delim);
      
      let newScale = initialSize.scale;
      
      // Calculer le nouveau scale basé sur le handle
      if (resizeHandle) {
        const scaleFactor = 0.01;
        let scaleDelta = 0;
        
        if (resizeHandle.includes('e')) scaleDelta += deltaX * scaleFactor;
        if (resizeHandle.includes('w')) scaleDelta -= deltaX * scaleFactor;
        if (resizeHandle.includes('s')) scaleDelta += deltaY * scaleFactor;
        if (resizeHandle.includes('n')) scaleDelta -= deltaY * scaleFactor;
        
        newScale = Math.max(0.1, initialSize.scale + scaleDelta);
        
        // En mode admin, contraindre strictement dans les délimitations
        if (isAdmin) {
          const baseSize = 80;
          const maxScale = Math.min(pos.width / baseSize, pos.height / baseSize);
          newScale = Math.min(newScale, maxScale);
        }
      }
      
      updateTransform(selectedIdx, { scale: newScale });
      
      // Valider en temps réel après redimensionnement avec les valeurs actuelles
      const currentTransform = getTransform(selectedIdx);
      validateDelimitation(selectedIdx, { x: currentTransform.x, y: currentTransform.y, scale: newScale, rotation: currentTransform.rotation }, pos);
    }

    if (isRotating && rotationStart && selectedIdx !== null) {
      const centerX = rotationStart.x;
      const centerY = rotationStart.y;
      
      const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
      const newRotation = initialRotation + (angle - rotationStart.angle);
      
      updateTransform(selectedIdx, { rotation: newRotation });
      
      // Valider en temps réel après rotation avec les valeurs actuelles
      const delim = view.delimitations[selectedIdx];
      const pos = computePxPosition(delim);
      const currentTransform = getTransform(selectedIdx);
      validateDelimitation(selectedIdx, { x: currentTransform.x, y: currentTransform.y, scale: currentTransform.scale, rotation: newRotation }, pos);
    }
  }, [isDragging, dragStart, selectedIdx, initialTransform, isResizing, resizeStart, initialSize, isRotating, rotationStart, initialRotation, isAdmin, view.delimitations]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setDragStart(null);
    setResizeStart(null);
    setRotationStart(null);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  const getCursor = (idx: number, mouseX: number, mouseY: number): string => {
    if (selectedIdx === idx) return 'move';
    return 'pointer';
  };

  const getResizeCursor = (handle: string): string => {
    switch (handle) {
      case 'nw': return 'nw-resize';
      case 'ne': return 'ne-resize';
      case 'sw': return 'sw-resize';
      case 'se': return 'se-resize';
      case 'n': return 'n-resize';
      case 'e': return 'e-resize';
      case 's': return 's-resize';
      case 'w': return 'w-resize';
      default: return 'pointer';
    }
  };

  if (!view || !view.url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Aucune image disponible</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl"
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Image de base du produit */}
      <img
        ref={imgRef}
        src={view.url || view.imageUrl}
        alt="Product"
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* Délimitations avec designs positionnés */}
      {view.delimitations?.map((delim: any, idx: number) => {
        const pos = computePxPosition(delim);
        const isSelected = selectedIdx === idx;
        const isHovered = hoveredIdx === idx;
        const transform = getTransform(idx);

        return (
          <div
            key={delim.id || idx}
            className={`absolute border-2 transition-all duration-200 ${
              isSelected 
                ? delimitationErrors[idx]
                  ? 'border-red-500 bg-red-50/80 backdrop-blur-sm shadow-lg dark:border-red-400 dark:bg-red-900/20'
                  : 'border-gray-900 bg-gray-100/80 backdrop-blur-sm shadow-lg dark:border-white dark:bg-gray-800/80'
                : isHovered 
                  ? delimitationErrors[idx]
                    ? 'border-red-400 bg-red-50/60 backdrop-blur-sm dark:border-red-300 dark:bg-red-900/10'
                    : 'border-gray-600 bg-gray-100/60 backdrop-blur-sm dark:border-gray-400 dark:bg-gray-800/60'
                  : delimitationErrors[idx]
                    ? 'border-red-300/50 bg-red-50/30 backdrop-blur-sm dark:border-red-400/50 dark:bg-red-900/10'
                    : 'border-gray-300/50 bg-gray-50/30 backdrop-blur-sm dark:border-gray-600/50 dark:bg-gray-900/30'
            }`}
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              cursor: getCursor(idx, 0, 0)
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Design positionné dans la délimitation */}
            {designUrl && (
              <div
                className="absolute shadow-xl flex items-center justify-center transition-all duration-200 hover:shadow-2xl"
                style={{
                  left: pos.width / 2 - 40 + transform.x,
                  top: pos.height / 2 - 40 + transform.y,
                  width: 80,
                  height: 80,
                  transform: `scale(${transform.scale}) rotate(${transform.rotation}deg)`,
                  cursor: isSelected ? 'move' : 'pointer',
                  zIndex: isSelected ? 10 : 1,
                  filter: isSelected ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}
                onMouseDown={(e) => handleDesignMouseDown(e, idx)}
              >
                <img
                  src={designUrl}
                  alt="Design"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                
                {/* Poignées de redimensionnement si sélectionné */}
                {isSelected && (
                  <>
                    {/* Poignée de rotation */}
                    <div
                      className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-900 dark:bg-white rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                      style={{ zIndex: 20 }}
                      onMouseDown={(e) => handleRotationStart(e, idx)}
                    >
                      <div className="w-3 h-3 bg-white dark:bg-gray-900 rounded-full"></div>
                    </div>
                    
                    {/* Poignées de redimensionnement aux coins */}
                    <div 
                      className="absolute -top-2 -left-2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('nw'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 'nw')}
                    />
                    <div 
                      className="absolute -top-2 -right-2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('ne'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 'ne')}
                    />
                    <div 
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('sw'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 'sw')}
                    />
                    <div 
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('se'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 'se')}
                    />
                    
                    {/* Poignées de redimensionnement centrales */}
                    <div 
                      className="absolute top-1/2 -left-2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full transform -translate-y-1/2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('w'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 'w')}
                    />
                    <div 
                      className="absolute top-1/2 -right-2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full transform -translate-y-1/2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('e'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 'e')}
                    />
                    <div 
                      className="absolute -top-2 left-1/2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full transform -translate-x-1/2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('n'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 'n')}
                    />
                    <div 
                      className="absolute -bottom-2 left-1/2 w-4 h-4 bg-gray-900 dark:bg-white rounded-full transform -translate-x-1/2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-125"
                      style={{ cursor: getResizeCursor('s'), zIndex: 20 }}
                      onMouseDown={(e) => handleResizeStart(e, idx, 's')}
                    />

                    {/* Indicateur de sélection */}
                    <div className="absolute inset-0 border-2 border-gray-900/50 dark:border-white/50 rounded-lg pointer-events-none"></div>
                  </>
                )}

                {/* Indicateur de hover */}
                {isHovered && !isSelected && (
                  <div className="absolute inset-0 border-2 border-gray-600/50 dark:border-gray-400/50 rounded-lg pointer-events-none"></div>
                )}
              </div>
            )}

            {/* Label de la délimitation */}
            {!isAdmin && (
              <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                isSelected 
                  ? delimitationErrors[idx]
                    ? 'bg-red-500 text-white shadow-md dark:bg-red-400'
                    : 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900' 
                  : isHovered 
                    ? delimitationErrors[idx]
                      ? 'bg-red-400 text-white dark:bg-red-300'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                    : delimitationErrors[idx]
                      ? 'bg-red-100/80 text-red-700 dark:bg-red-900/80 dark:text-red-300'
                      : 'bg-gray-100/80 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400'
              }`}>
                {delimitationErrors[idx] ? 'Erreur: Hors limites' : `Zone ${idx + 1}`}
              </div>
            )}
          </div>
        );
      })}

      {/* Instructions flottantes */}
      {!selectedIdx && !isAdmin && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Cliquez sur une zone pour sélectionner le design</span>
          </div>
        </div>
      )}

      {/* Indicateur de mode */}
      {selectedIdx !== null && !isAdmin && (
        <div className="absolute top-4 right-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 rounded-full text-xs font-medium shadow-lg">
          Mode édition
        </div>
      )}
    </div>
  );
};

export { ProductViewWithDesign }; 
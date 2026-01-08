import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { 
  Move, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Save,
  RefreshCw,
  Info,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface DesignTransforms {
  positionX: number; // 0-1
  positionY: number; // 0-1
  scale: number;     // 0.1-2
  rotation: number;  // 0-360
}

interface BoundaryValidation {
  isValid: boolean;
  message: string;
  violations: string[];
}

interface InteractiveDesignPositionerProps {
  productId: number;
  productImageUrl: string;
  productName: string;
  designUrl: string;
  designName: string;
  initialTransforms?: DesignTransforms;
  onTransformsChange?: (transforms: DesignTransforms) => void;
  onValidationChange?: (validation: BoundaryValidation) => void;
  onSave?: (transforms: DesignTransforms) => void;
  autoSave?: boolean;
  className?: string;
}

export const InteractiveDesignPositioner: React.FC<InteractiveDesignPositionerProps> = ({
  productId,
  productImageUrl,
  productName,
  designUrl,
  designName,
  initialTransforms = {
    positionX: 0.5,
    positionY: 0.3,
    scale: 0.95,
    rotation: 0
  },
  onTransformsChange,
  onValidationChange,
  onSave,
  autoSave = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const productImgRef = useRef<HTMLImageElement>(null);
  
  const [transforms, setTransforms] = useState<DesignTransforms>(initialTransforms);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showControls, setShowControls] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [imageMetrics, setImageMetrics] = useState({
    originalWidth: 0,
    originalHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    offsetX: 0,
    offsetY: 0
  });
  const [boundaryValidation, setBoundaryValidation] = useState<BoundaryValidation>({
    isValid: true,
    message: 'Position valide',
    violations: []
  });
  
  // Références pour le drag & drop
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const resizeStart = useRef({ scale: 1, startX: 0, startY: 0 });
  const rotateStart = useRef({ rotation: 0, startAngle: 0 });
  const lastUpdateTime = useRef(0);

  // Clé pour localStorage
  const storageKey = `design-position-${productId}-${designUrl}`;

  // Constantes pour les limites de validation
  const BOUNDARY_MARGIN = 0.1; // 10% de marge par rapport aux bords
  const MAX_SCALE = 1.5; // Échelle maximale autorisée
  const MIN_SCALE = 0.3; // Échelle minimale autorisée

  // Calculer les métriques de l'image du produit
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
  }, []);

  // Fonction de validation des limites
  const validateBoundaries = useCallback((currentTransforms: DesignTransforms): BoundaryValidation => {
    const violations: string[] = [];
    
    // Vérifier l'échelle
    if (currentTransforms.scale > MAX_SCALE) {
      violations.push(`Échelle trop grande (max: ${MAX_SCALE}x)`);
    }
    
    if (currentTransforms.scale < MIN_SCALE) {
      violations.push(`Échelle trop petite (min: ${MIN_SCALE}x)`);
    }
    
    // Calculer les dimensions du design après scaling (100px base * scale)
    const designSize = 100 * currentTransforms.scale;
    
    // Calculer la position en pixels
    const designX = currentTransforms.positionX * containerSize.width;
    const designY = currentTransforms.positionY * containerSize.height;
    
    // Limites de la zone autorisée (avec marge)
    const marginX = containerSize.width * BOUNDARY_MARGIN;
    const marginY = containerSize.height * BOUNDARY_MARGIN;
    
    // Le design ne doit pas sortir de la zone (en tenant compte de sa taille)
    const minX = marginX;
    const maxX = containerSize.width - marginX - designSize;
    const minY = marginY;  
    const maxY = containerSize.height - marginY - designSize;
    
    // Vérifier les limites
    if (designX < minX) {
      violations.push('Le design dépasse à gauche');
    }
    if (designX > maxX) {
      violations.push('Le design dépasse à droite');
    }
    if (designY < minY) {
      violations.push('Le design dépasse en haut');
    }
    if (designY > maxY) {
      violations.push('Le design dépasse en bas');
    }
    
    const isValid = violations.length === 0;
    const message = isValid 
      ? 'Position valide dans les limites autorisées' 
      : 'Le design sort de la zone autorisée';
    
    return {
      isValid,
      message,
      violations
    };
  }, [containerSize]);

  // Observer les changements de taille du conteneur
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
        // Recalculer aussi les métriques de l'image
        calculateImageMetrics();
      }
    };
    
    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', updateContainerSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, [calculateImageMetrics]);

  // Calculer les métriques de l'image quand elle est chargée
  useEffect(() => {
    if (productImgRef.current && productImgRef.current.complete) {
      calculateImageMetrics();
    }
  }, [calculateImageMetrics]);

  // Charger les transformations depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const savedTransforms = JSON.parse(saved);
        setTransforms(savedTransforms);
        onTransformsChange?.(savedTransforms);
      } catch (e) {
        console.warn('Erreur lors du chargement des transformations:', e);
      }
    }
  }, [storageKey, onTransformsChange]);

  // Valider les limites à chaque changement de transformation
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      const validation = validateBoundaries(transforms);
      setBoundaryValidation(validation);
      onValidationChange?.(validation);
    }
  }, [transforms, containerSize, validateBoundaries, onValidationChange]);

  // Sauvegarder automatiquement dans localStorage
  const saveToLocalStorage = useCallback((newTransforms: DesignTransforms) => {
    if (autoSave) {
      localStorage.setItem(storageKey, JSON.stringify(newTransforms));
      setLastSaved(new Date());
    }
  }, [autoSave, storageKey]);

  // Mettre à jour les transformations
  const updateTransforms = useCallback((newTransforms: DesignTransforms) => {
    setTransforms(newTransforms);
    onTransformsChange?.(newTransforms);
    saveToLocalStorage(newTransforms);
  }, [onTransformsChange, saveToLocalStorage]);

  // Position absolue pour le drag direct
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Calculer les transformations CSS de manière simple
  const getDesignTransform = useCallback(() => {
    if (!containerRef.current) return 'translate(0px, 0px) scale(1) rotate(0deg)';
    
    const container = containerRef.current.getBoundingClientRect();
    
    // Si on est en train de drag, utiliser la position directe
    let translateX, translateY;
    if (dragPosition) {
      translateX = dragPosition.x;
      translateY = dragPosition.y;
    } else {
      // Sinon, utiliser les transformations normales
      translateX = (transforms.positionX || 0) * container.width;
      translateY = (transforms.positionY || 0) * container.height;
    }
    
    const scale = transforms.scale || 1;
    const rotation = transforms.rotation || 0;
    
    return `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
  }, [transforms, dragPosition]);

  // Gestionnaires de drag pour le déplacement
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!designRef.current || !containerRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculer la position actuelle du design en pixels
    const currentX = transforms.positionX * rect.width;
    const currentY = transforms.positionY * rect.height;
    
    // Stocker le point de départ avec la position actuelle comme référence
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: transforms.positionX,
      startY: transforms.positionY
    };
    
    // Pas de saut - le design reste à sa position actuelle
    setDragPosition({ x: currentX, y: currentY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculer le delta depuis le point de départ du drag
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    // Calculer la nouvelle position en utilisant la position de départ comme référence
    const startPixelX = dragStart.current.startX * rect.width;
    const startPixelY = dragStart.current.startY * rect.height;
    
    const newX = startPixelX + deltaX;
    const newY = startPixelY + deltaY;
    
    // Contraindre dans les limites du conteneur
    const clampedX = Math.max(0, Math.min(rect.width - 100, newX));
    const clampedY = Math.max(0, Math.min(rect.height - 100, newY));
    
    // Mettre à jour la position de drag immédiatement pour le rendu visuel
    setDragPosition({ x: clampedX, y: clampedY });
    
    // Calculer les pourcentages pour les transforms
    const percentX = clampedX / rect.width;
    const percentY = clampedY / rect.height;
    
    // Mettre à jour les transforms (throttled pour les performances)
    const now = Date.now();
    if (now - lastUpdateTime.current > 16) { // ~60fps
      const newTransforms = {
        ...transforms,
        positionX: percentX,
        positionY: percentY
      };
      setTransforms(newTransforms);
      lastUpdateTime.current = now;
    }
  }, [isDragging, transforms]);

  const handleMouseUp = useCallback(() => {
    // Réinitialiser tous les états immédiatement (comme dans Illustrator)
    if (isDragging && dragPosition && containerRef.current) {
      // Calculer les transformations finales depuis dragPosition
      const rect = containerRef.current.getBoundingClientRect();
      const finalPercentX = dragPosition.x / rect.width;
      const finalPercentY = dragPosition.y / rect.height;
      
      const finalTransforms = {
        ...transforms,
        positionX: finalPercentX,
        positionY: finalPercentY
      };
      
      setTransforms(finalTransforms);
      onTransformsChange?.(finalTransforms);
      saveToLocalStorage(finalTransforms);
    }
    
    // Arrêt immédiat de tous les états (pas de maintien)
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    
    // Nettoyer la position de drag
    setDragPosition(null);
  }, [isDragging, dragPosition, transforms, onTransformsChange, saveToLocalStorage]);

  // Gestionnaires pour le redimensionnement
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    // Stocker la référence de départ
    resizeStart.current = {
      scale: transforms.scale,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Calculer le delta depuis le point de départ du resize
    const deltaX = e.clientX - resizeStart.current.startX;
    const scaleDelta = deltaX / 200; // 200px = 1.0 de scale (plus fluide)
    
    // Utiliser la scale de départ comme référence pour éviter les glitches
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, resizeStart.current.scale + scaleDelta));
    
    const newTransforms = {
      ...transforms,
      scale: newScale
    };
    setTransforms(newTransforms);
  }, [isResizing, transforms]);

  // Gestionnaires pour la rotation
  const handleRotateStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
    
    const rect = containerRef.current!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    
    // Stocker la référence de départ
    rotateStart.current = {
      rotation: transforms.rotation,
      startAngle
    };
  };

  const handleRotateMove = useCallback((e: MouseEvent) => {
    if (!isRotating || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    
    // Calculer le delta depuis le point de départ de la rotation
    const deltaAngle = currentAngle - rotateStart.current.startAngle;
    // Utiliser la rotation de départ comme référence pour éviter les glitches
    const newRotation = (rotateStart.current.rotation + deltaAngle + 360) % 360;
    
    const newTransforms = {
      ...transforms,
      rotation: newRotation
    };
    setTransforms(newTransforms);
  }, [isRotating, transforms]);

  // Ajouter les event listeners globaux (comme dans Illustrator)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMouseMove(e);
      } else if (isResizing) {
        handleResizeMove(e);
      } else if (isRotating) {
        handleRotateMove(e);
      }
    };

    // Gestionnaire global mouseup - s'arrête même si la souris sort du canvas
    const handleGlobalMouseUp = () => {
      // Arrêt immédiat de tous les états (réinitialisation complète)
      handleMouseUp();
    };

    if (isDragging || isResizing || isRotating) {
      // Ajout des listeners globaux sur document pour capturer même quand la souris sort
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp); // Arrêt si souris sort de la page
      
      // Empêcher la sélection de texte pendant les interactions
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'alias';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleResizeMove, handleRotateMove, handleMouseUp]);

  // Réinitialiser les transformations
  const resetTransforms = () => {
    const defaultTransforms = {
      positionX: 0.5,
      positionY: 0.3,
      scale: 0.95,
      rotation: 0
    };
    updateTransforms(defaultTransforms);
  };

  // Sauvegarder manuellement
  const handleSave = () => {
    onSave?.(transforms);
    setLastSaved(new Date());
  };

  return (
    <div className={`interactive-design-positioner ${className}`}>
      {/* Zone de travail */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{productName}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {designName}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowControls(!showControls)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Conteneur de positionnement */}
          <div
            ref={containerRef}
            className="relative bg-gray-50 aspect-square overflow-hidden cursor-crosshair select-none"
            style={{ 
              minHeight: '400px',
              // Optimisations CSS pour les performances
              transform: 'translateZ(0)', // Force hardware acceleration
              backfaceVisibility: 'hidden',
              perspective: '1000px'
            }}
          >
            {/* Image du produit */}
            <img
              ref={productImgRef}
              src={productImageUrl}
              alt={productName}
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
              onLoad={calculateImageMetrics}
            />
            
            {/* Zone de délimitation (boundary) */}
            <div 
              className="absolute border-2 border-dashed pointer-events-none"
              style={{
                top: `${BOUNDARY_MARGIN * 100}%`,
                left: `${BOUNDARY_MARGIN * 100}%`,
                right: `${BOUNDARY_MARGIN * 100}%`,
                bottom: `${BOUNDARY_MARGIN * 100}%`,
                borderColor: boundaryValidation.isValid ? '#10b981' : '#ef4444',
                backgroundColor: boundaryValidation.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
              }}
            />
            
            {/* Design manipulable */}
            <div
              ref={designRef}
              className={`absolute top-0 left-0 select-none ${
                isDragging || isResizing || isRotating ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                transform: getDesignTransform(),
                transformOrigin: 'top left',
                zIndex: 10,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                pointerEvents: isDragging ? 'none' : 'auto' // Éviter les conflits pendant le drag
              }}
              onMouseDown={handleMouseDown}
              draggable={false}
            >
              <img
                src={designUrl}
                alt={designName}
                className="block max-w-none cursor-inherit pointer-events-none"
                style={{ width: '100px', height: 'auto' }}
                draggable={false}
              />
              
              {/* Poignées de contrôle */}
              <div className={`absolute -inset-2 border-2 border-dashed opacity-75 pointer-events-none ${
                boundaryValidation.isValid ? 'border-blue-500' : 'border-red-500'
              }`}>
                {/* Poignée de redimensionnement */}
                <div
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded cursor-se-resize pointer-events-auto"
                  onMouseDown={handleResizeStart}
                />
                
                {/* Poignée de rotation */}
                <div
                  className="absolute -top-6 left-1/2 w-4 h-4 bg-green-500 rounded cursor-pointer pointer-events-auto transform -translate-x-1/2"
                  onMouseDown={handleRotateStart}
                >
                  <RotateCw className="h-3 w-3 text-white m-0.5" />
                </div>
              </div>
            </div>
            
            {/* Indicateur de mode actif */}
            {(isDragging || isResizing || isRotating) && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs z-20">
                {isDragging && 'Déplacement...'}
                {isResizing && 'Redimensionnement...'}
                {isRotating && 'Rotation...'}
              </div>
            )}
            
            {/* Indicateur de validation */}
            <div className="absolute top-2 right-2 z-20">
              {boundaryValidation.isValid ? (
                <div className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Valide
                </div>
              ) : (
                <div className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Hors limites
                </div>
              )}
            </div>
            
            {/* Grille d'aide */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-gray-300">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-gray-300" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panneau de contrôles */}
      {showControls && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Contrôles de Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Indicateur de validation */}
            <div className={`p-3 rounded-lg border ${
              boundaryValidation.isValid 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start gap-2">
                {boundaryValidation.isValid ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm">
                  <p className="font-medium">{boundaryValidation.message}</p>
                  {boundaryValidation.violations.length > 0 && (
                    <ul className="mt-1 text-xs space-y-1">
                      {boundaryValidation.violations.map((violation, index) => (
                        <li key={index}>• {violation}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Position X */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Position X</label>
                <span className="text-xs text-gray-500">
                  {Math.round(transforms.positionX * 100)}%
                </span>
              </div>
              <Slider
                value={[transforms.positionX]}
                onValueChange={([value]) => updateTransforms({ ...transforms, positionX: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Position Y */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Position Y</label>
                <span className="text-xs text-gray-500">
                  {Math.round(transforms.positionY * 100)}%
                </span>
              </div>
              <Slider
                value={[transforms.positionY]}
                onValueChange={([value]) => updateTransforms({ ...transforms, positionY: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Échelle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Échelle</label>
                <span className="text-xs text-gray-500">
                  {transforms.scale.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[transforms.scale]}
                onValueChange={([value]) => updateTransforms({ ...transforms, scale: value })}
                min={0.1}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Rotation</label>
                <span className="text-xs text-gray-500">
                  {Math.round(transforms.rotation)}°
                </span>
              </div>
              <Slider
                value={[transforms.rotation]}
                onValueChange={([value]) => updateTransforms({ ...transforms, rotation: value })}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={resetTransforms}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              
              <div className="flex items-center gap-2">
                {lastSaved && (
                  <span className="text-xs text-gray-500">
                    Sauvé: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!boundaryValidation.isValid}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-4 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Instructions :</p>
              <ul className="space-y-1 text-xs">
                <li>• Cliquez et glissez le design pour le déplacer</li>
                <li>• Utilisez la poignée bleue (coin bas-droit) pour redimensionner</li>
                <li>• Utilisez la poignée verte (en haut) pour faire pivoter</li>
                <li>• Les sliders permettent un contrôle précis</li>
                <li>• La position est sauvegardée automatiquement</li>
                <li>• <strong>Le design doit rester dans la zone délimitée (cadre en pointillés)</strong></li>
                <li>• <strong>Une erreur rouge apparaît si le design sort des limites</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveDesignPositioner; 
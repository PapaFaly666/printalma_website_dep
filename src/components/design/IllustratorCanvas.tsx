import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import Button from '../ui/Button';

interface DesignTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
}

interface IllustratorCanvasProps {
  designUrl: string;
  onTransformChange?: (transform: DesignTransform) => void;
  onSave?: () => void;
  initialTransform?: Partial<DesignTransform>;
  canvasWidth?: number;
  canvasHeight?: number;
  className?: string;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const IllustratorCanvas: React.FC<IllustratorCanvasProps> = ({
  designUrl,
  onTransformChange,
  onSave,
  initialTransform = {},
  canvasWidth = 800,
  canvasHeight = 600,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [designImage, setDesignImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État de transformation
  const [transform, setTransform] = useState<DesignTransform>({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    scale: 1,
    rotation: 0,
    width: 200,
    height: 200,
    ...initialTransform
  });

  // État d'interaction
  const [isDragging, setIsDragging] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [transformStart, setTransformStart] = useState<DesignTransform | null>(null);
  const [croppedImage, setCroppedImage] = useState<HTMLImageElement | null>(null);
  const [originalBounds, setOriginalBounds] = useState<BoundingBox | null>(null);

  // Fonction pour détecter la bounding box d'une image
  const detectBoundingBox = useCallback((img: HTMLImageElement): BoundingBox | null => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    
    const alphaThreshold = 10;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const alpha = data[pixelIndex + 3];
        
        if (alpha > alphaThreshold) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (maxX === -1) return null;
    
    const margin = 2;
    return {
      x: Math.max(0, minX - margin),
      y: Math.max(0, minY - margin),
      width: Math.min(width - Math.max(0, minX - margin), maxX - Math.max(0, minX - margin) + 1 + (margin * 2)),
      height: Math.min(height - Math.max(0, minY - margin), maxY - Math.max(0, minY - margin) + 1 + (margin * 2))
    };
  }, []);

  // Fonction pour recadrer l'image selon sa bounding box
  const cropImageToBounds = useCallback((img: HTMLImageElement, bounds: BoundingBox): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return img;

    canvas.width = bounds.width;
    canvas.height = bounds.height;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(
      img,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
    );
    
    const croppedImg = new Image();
    croppedImg.src = canvas.toDataURL('image/png', 1.0);
    return croppedImg;
  }, []);

  // Charger et traiter l'image
  useEffect(() => {
    if (!designUrl) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setDesignImage(img);
      
      // Détecter la bounding box
      const bounds = detectBoundingBox(img);
      if (bounds) {
        setOriginalBounds(bounds);
        const cropped = cropImageToBounds(img, bounds);
        
        cropped.onload = () => {
          setCroppedImage(cropped);
          
          // Ajuster la transformation initiale
          const scale = Math.min(300 / bounds.width, 300 / bounds.height, 1);
          setTransform(prev => ({
            ...prev,
            width: bounds.width,
            height: bounds.height,
            scale: scale,
            x: canvasWidth / 2,
            y: canvasHeight / 2
          }));
          
          setIsLoading(false);
        };
      } else {
        setCroppedImage(img);
        setTransform(prev => ({
          ...prev,
          width: img.width,
          height: img.height,
          scale: Math.min(300 / img.width, 300 / img.height, 1)
        }));
        setIsLoading(false);
      }
    };
    
    img.onerror = () => {
      setError('Erreur lors du chargement de l\'image');
      setIsLoading(false);
    };
    
    img.src = designUrl;
  }, [designUrl, detectBoundingBox, cropImageToBounds, canvasWidth, canvasHeight]);

  // Fonction pour dessiner sur le canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !croppedImage) return;

    // Nettoyer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner le fond
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grille subtile (optionnelle)
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Dessiner l'image transformée
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    
    const drawWidth = transform.width;
    const drawHeight = transform.height;
    
    ctx.drawImage(
      croppedImage,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    
    ctx.restore();
    
    // Dessiner le contour de sélection (très subtil)
    if (isDragging || isScaling) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.6;
      
      const scaledWidth = transform.width * transform.scale;
      const scaledHeight = transform.height * transform.scale;
      
      ctx.strokeRect(
        transform.x - scaledWidth / 2,
        transform.y - scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }, [croppedImage, transform, isDragging, isScaling]);

  // Redessiner à chaque changement
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Obtenir les coordonnées de la souris relatives au canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Vérifier si la souris est sur l'image
  const isMouseOnImage = useCallback((mouseX: number, mouseY: number) => {
    const scaledWidth = transform.width * transform.scale;
    const scaledHeight = transform.height * transform.scale;
    
    return (
      mouseX >= transform.x - scaledWidth / 2 &&
      mouseX <= transform.x + scaledWidth / 2 &&
      mouseY >= transform.y - scaledHeight / 2 &&
      mouseY <= transform.y + scaledHeight / 2
    );
  }, [transform]);

  // Vérifier si la souris est sur un coin (pour le scaling)
  const isMouseOnCorner = useCallback((mouseX: number, mouseY: number) => {
    const scaledWidth = transform.width * transform.scale;
    const scaledHeight = transform.height * transform.scale;
    const cornerSize = 20;
    
    const corners = [
      { x: transform.x - scaledWidth / 2, y: transform.y - scaledHeight / 2 }, // Top-left
      { x: transform.x + scaledWidth / 2, y: transform.y - scaledHeight / 2 }, // Top-right
      { x: transform.x - scaledWidth / 2, y: transform.y + scaledHeight / 2 }, // Bottom-left
      { x: transform.x + scaledWidth / 2, y: transform.y + scaledHeight / 2 }, // Bottom-right
    ];
    
    return corners.some(corner => 
      Math.abs(mouseX - corner.x) < cornerSize && 
      Math.abs(mouseY - corner.y) < cornerSize
    );
  }, [transform]);

  // Gestionnaire mousedown
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!croppedImage) return;
    
    const mousePos = getMousePos(e);
    const onImage = isMouseOnImage(mousePos.x, mousePos.y);
    
    if (!onImage) return;
    
    setDragStart(mousePos);
    setTransformStart({ ...transform });
    
    // Déterminer le type d'interaction
    if (e.shiftKey && isMouseOnCorner(mousePos.x, mousePos.y)) {
      setIsScaling(true);
      document.body.style.cursor = 'nw-resize';
    } else {
      setIsDragging(true);
      document.body.style.cursor = 'move';
    }
  }, [croppedImage, getMousePos, isMouseOnImage, isMouseOnCorner, transform]);

  // Gestionnaire mousemove
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!croppedImage || !transformStart) return;
    
    const mousePos = getMousePos(e);
    
    if (isDragging) {
      // Translation
      const deltaX = mousePos.x - dragStart.x;
      const deltaY = mousePos.y - dragStart.y;
      
      setTransform(prev => ({
        ...prev,
        x: transformStart.x + deltaX,
        y: transformStart.y + deltaY
      }));
    } else if (isScaling) {
      // Scaling proportionnel
      const centerX = transformStart.x;
      const centerY = transformStart.y;
      
      const startDistance = Math.sqrt(
        Math.pow(dragStart.x - centerX, 2) + Math.pow(dragStart.y - centerY, 2)
      );
      
      const currentDistance = Math.sqrt(
        Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2)
      );
      
      const scaleRatio = currentDistance / startDistance;
      const newScale = Math.max(0.1, Math.min(5, transformStart.scale * scaleRatio));
      
      setTransform(prev => ({
        ...prev,
        scale: newScale
      }));
    } else {
      // Changement de curseur selon la zone
      const onImage = isMouseOnImage(mousePos.x, mousePos.y);
      if (onImage) {
        if (e.shiftKey && isMouseOnCorner(mousePos.x, mousePos.y)) {
          document.body.style.cursor = 'nw-resize';
        } else {
          document.body.style.cursor = 'move';
        }
      } else {
        document.body.style.cursor = 'default';
      }
    }
  }, [croppedImage, transformStart, isDragging, isScaling, dragStart, getMousePos, isMouseOnImage, isMouseOnCorner]);

  // Gestionnaire mouseup
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsScaling(false);
    setTransformStart(null);
    document.body.style.cursor = 'default';
    
    // Notifier le changement
    if (onTransformChange) {
      onTransformChange(transform);
    }
  }, [transform, onTransformChange]);

  // Fonction de reset
  const handleReset = useCallback(() => {
    if (!croppedImage) return;
    
    const scale = Math.min(300 / transform.width, 300 / transform.height, 1);
    const newTransform = {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      scale,
      rotation: 0,
      width: transform.width,
      height: transform.height
    };
    
    setTransform(newTransform);
    if (onTransformChange) {
      onTransformChange(newTransform);
    }
  }, [croppedImage, transform.width, transform.height, canvasWidth, canvasHeight, onTransformChange]);

  // Gestion des événements globaux
  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isScaling) {
        e.preventDefault();
      }
    };
    
    if (isDragging || isScaling) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, isScaling, handleMouseUp]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: canvasWidth, height: canvasHeight }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chargement du design...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg ${className}`} style={{ width: canvasWidth, height: canvasHeight }}>
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border border-gray-300 rounded-lg shadow-sm cursor-default"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          userSelect: 'none',
          touchAction: 'none'
        }}
      />
      
      {/* Contrôles */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="bg-white/90 hover:bg-white text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
        
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            className="bg-white/90 hover:bg-white text-xs"
          >
            <Save className="h-3 w-3 mr-1" />
            Sauver
          </Button>
        )}
      </div>
      
      {/* Infos de transformation */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>Position: {Math.round(transform.x)}, {Math.round(transform.y)}</div>
          <div>Échelle: {(transform.scale * 100).toFixed(0)}%</div>
          <div>Taille: {Math.round(transform.width * transform.scale)}×{Math.round(transform.height * transform.scale)}</div>
          <div className="col-span-2 text-gray-500">
            Drag: déplacer • Shift+Drag coin: redimensionner
          </div>
        </div>
      </div>
    </div>
  );
};

export default IllustratorCanvas; 
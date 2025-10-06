import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Delimitation } from '../services/delimitationService';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Target,
  Info,
  Palette
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ProImageViewerProps {
  imageUrl: string;
  delimitations: Delimitation[];
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  showControls?: boolean;
  interactive?: boolean;
}

interface ViewerState {
  zoom: number;
  showDelimitations: boolean;
  selectedDelimitation: string | null;
  isFullscreen: boolean;
}

const ProImageViewer: React.FC<ProImageViewerProps> = ({
  imageUrl,
  delimitations,
  className = '',
  maxWidth = 800,
  maxHeight = 600,
  showControls = true,
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const imageObjectRef = useRef<fabric.Image | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewerState, setViewerState] = useState<ViewerState>({
    zoom: 1,
    showDelimitations: true,
    selectedDelimitation: null,
    isFullscreen: false
  });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  // Couleurs pour les délimitations
  const delimiterColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const safeDisposeCanvas = (canvas?: fabric.Canvas | null) => {
    if (!canvas) return;
    try {
      canvas.dispose();
    } catch (err) {
      console.warn('[ProImageViewer] canvas.dispose() failed:', err);
    }
  };

  // Initialiser le viewer professionnel
  const initProfessionalViewer = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = Math.min(maxHeight, container.clientHeight || maxHeight);

      // Nettoyer l'ancien canvas
      safeDisposeCanvas(fabricCanvasRef.current);
      fabricCanvasRef.current = null;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: containerWidth,
        height: containerHeight,
        backgroundColor: '#ffffff',
        selection: false,
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        imageSmoothingEnabled: true,
        renderOnAddRemove: false,
        skipTargetFind: !interactive,
        perPixelTargetFind: interactive
      });

      // Configuration pour l'affichage
      canvas.defaultCursor = interactive ? 'pointer' : 'default';
      canvas.hoverCursor = interactive ? 'pointer' : 'default';
      canvas.moveCursor = 'default';

      fabricCanvasRef.current = canvas;
      
      if (interactive) {
        setupInteractiveEvents(canvas);
      }

      loadImageProfessionally(canvas);
      return canvas;
    } catch (error) {
      console.error('Viewer initialization error:', error);
      return null;
    }
  }, [imageUrl, maxWidth, maxHeight, interactive]);

  // Charger l'image avec calculs professionnels
  const loadImageProfessionally = (canvas: fabric.Canvas) => {
    fabric.Image.fromURL(imageUrl, (img) => {
      if (!img || !canvas) return;

      // Supprimer l'ancienne image si elle existe pour éviter l'empilement
      if (imageObjectRef.current) {
        canvas.remove(imageObjectRef.current);
      }

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;

      // Stocker les dimensions naturelles
      setImageNaturalSize({ width: imgWidth, height: imgHeight });

      // Calculer l'échelle pour un ajustement parfait
      const padding = 20;
      const availableWidth = canvasWidth - padding * 2;
      const availableHeight = canvasHeight - padding * 2;
      
      const scaleX = availableWidth / imgWidth;
      const scaleY = availableHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      const finalWidth = imgWidth * scale;
      const finalHeight = imgHeight * scale;

      img.set({
        left: (canvasWidth - finalWidth) / 2,
        top: (canvasHeight - finalHeight) / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        moveCursor: 'default',
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.1)',
          blur: 8,
          offsetX: 0,
          offsetY: 3
        }),
        cornerStyle: 'circle',
        transparentCorners: false
      });

      canvas.add(img);
      canvas.sendToBack(img);
      imageObjectRef.current = img;

      // Afficher les délimitations immédiatement
      displayDelimitationsProfessionally(canvas);

      setImageLoaded(true);

      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  };

  // Configuration des événements interactifs
  const setupInteractiveEvents = (canvas: fabric.Canvas) => {
    canvas.on('mouse:over', (e) => {
      const target = e.target;
      if (target && (target as any).isDelimitation) {
        // Effet de survol
        target.set({
          stroke: '#1d4ed8',
          strokeWidth: 3,
          shadow: new fabric.Shadow({
            color: 'rgba(29, 78, 216, 0.4)',
            blur: 12,
            offsetX: 0,
            offsetY: 4
          })
        });
        canvas.renderAll();
        
        // Mettre à jour la sélection
        setViewerState(prev => ({
          ...prev,
          selectedDelimitation: String((target as any).delimitationId)
        }));
      }
    });

    canvas.on('mouse:out', (e) => {
      const target = e.target;
      if (target && (target as any).isDelimitation) {
        // Retour à l'état normal
        const originalColor = (target as any).originalColor || '#3b82f6';
        target.set({
          stroke: originalColor,
          strokeWidth: 2,
          shadow: new fabric.Shadow({
            color: 'rgba(59, 130, 246, 0.3)',
            blur: 6,
            offsetX: 0,
            offsetY: 2
          })
        });
        canvas.renderAll();
        
        setViewerState(prev => ({
          ...prev,
          selectedDelimitation: null
        }));
      }
    });

    canvas.on('mouse:down', (e) => {
      const target = e.target;
      if (target && (target as any).isDelimitation) {
        // Animation de clic
        target.animate('scaleX', target.scaleX! * 1.05, {
          duration: 150,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: () => {
            target.animate('scaleX', target.scaleX! / 1.05, {
              duration: 150,
              onChange: canvas.renderAll.bind(canvas)
            });
          }
        });
        target.animate('scaleY', target.scaleY! * 1.05, {
          duration: 150,
          onChange: canvas.renderAll.bind(canvas),
          onComplete: () => {
            target.animate('scaleY', target.scaleY! / 1.05, {
              duration: 150,
              onChange: canvas.renderAll.bind(canvas)
            });
          }
        });
      }
    });
  };

  // Afficher les délimitations de manière professionnelle
  const displayDelimitationsProfessionally = (canvas: fabric.Canvas) => {
    const imageObj = imageObjectRef.current;
    if (!canvas || !imageObj || !viewerState.showDelimitations) return;

    // Supprimer les anciennes délimitations
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if ((obj as any).isDelimitation || (obj as any).isDelimitationLabel) {
        canvas.remove(obj);
      }
    });

    // Calculer les dimensions de l'image affichée
    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    // Ajouter chaque délimitation
    delimitations.forEach((delimitation, index) => {
      const color = delimiterColors[index % delimiterColors.length];
      
      let percentX = delimitation.x;
      let percentY = delimitation.y;
      let percentWidth = delimitation.width;
      let percentHeight = delimitation.height;

      // Convertir si les coordonnées sont en pixels
      if (delimitation.coordinateType === 'PIXEL' && imageNaturalSize.width > 0 && imageNaturalSize.height > 0) {
        percentX = (delimitation.x / imageNaturalSize.width) * 100;
        percentY = (delimitation.y / imageNaturalSize.height) * 100;
        percentWidth = (delimitation.width / imageNaturalSize.width) * 100;
        percentHeight = (delimitation.height / imageNaturalSize.height) * 100;
      }

      // Heuristique : si width ou height > 100 OU x/y > 100, considérer qu'on a reçu des pixels
      if ((percentWidth > 100 || percentHeight > 100 || percentX > 100 || percentY > 100) && imageNaturalSize.width > 0 && imageNaturalSize.height > 0) {
        percentX = (delimitation.x / imageNaturalSize.width) * 100;
        percentY = (delimitation.y / imageNaturalSize.height) * 100;
        percentWidth = (delimitation.width / imageNaturalSize.width) * 100;
        percentHeight = (delimitation.height / imageNaturalSize.height) * 100;
      }

      // Calculer les coordonnées précises
      const rectLeft = imgLeft + (percentX / 100) * imgWidth;
      const rectTop = imgTop + (percentY / 100) * imgHeight;
      const rectWidth = (percentWidth / 100) * imgWidth;
      const rectHeight = (percentHeight / 100) * imgHeight;

      // Créer le rectangle de délimitation
      const rect = new fabric.Rect({
        left: rectLeft,
        top: rectTop,
        width: rectWidth,
        height: rectHeight,
        fill: `rgba(${hexToRgb(color)}, 0.15)`,
        stroke: color,
        strokeWidth: 2,
        strokeDashArray: [8, 4],
        rx: 6,
        ry: 6,
        selectable: false,
        evented: interactive,
        hoverCursor: interactive ? 'pointer' : 'default',
        shadow: new fabric.Shadow({
          color: `rgba(${hexToRgb(color)}, 0.3)`,
          blur: 6,
          offsetX: 0,
          offsetY: 2
        })
      });

      // Métadonnées
      (rect as any).isDelimitation = true;
      (rect as any).delimitationId = delimitation.id;
      (rect as any).originalColor = color;

      canvas.add(rect);

      // S'assurer que le rectangle est au-dessus de l'image
      canvas.bringToFront(rect);

      // Ajouter le label si un nom est défini
      if (delimitation.name) {
        const labelBg = new fabric.Rect({
          left: rectLeft,
          top: Math.max(10, rectTop - 25),
          width: delimitation.name.length * 8 + 16,
          height: 20,
          fill: color,
          rx: 10,
          ry: 10,
          selectable: false,
          evented: false,
          shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.1)',
            blur: 4,
            offsetX: 0,
            offsetY: 2
          })
        });

        const label = new fabric.Text(delimitation.name, {
          left: rectLeft + 8,
          top: Math.max(15, rectTop - 20),
          fontSize: 11,
          fill: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '600',
          selectable: false,
          evented: false
        });

        (labelBg as any).isDelimitationLabel = true;
        (label as any).isDelimitationLabel = true;

        canvas.add(labelBg, label);
        canvas.bringToFront(labelBg);
        canvas.bringToFront(label);
      }

      // Badge numérique
      const badge = new fabric.Circle({
        left: rectLeft + rectWidth - 15,
        top: rectTop - 10,
        radius: 12,
        fill: color,
        stroke: '#ffffff',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.2)',
          blur: 4,
          offsetX: 0,
          offsetY: 2
        })
      });

      const badgeText = new fabric.Text((index + 1).toString(), {
        left: rectLeft + rectWidth - 15,
        top: rectTop - 10,
        fontSize: 10,
        fill: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      });

      (badge as any).isDelimitationLabel = true;
      (badgeText as any).isDelimitationLabel = true;

      canvas.add(badge, badgeText);
      canvas.bringToFront(badge);
      canvas.bringToFront(badgeText);
    });

    canvas.renderAll();
  };

  // Utilitaire pour convertir hex en rgb
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '59, 130, 246'; // fallback blue
  };

  // Gestion du zoom
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let newZoom = viewerState.zoom;
    switch (direction) {
      case 'in':
        newZoom = Math.min(3, viewerState.zoom * 1.2);
        break;
      case 'out':
        newZoom = Math.max(0.5, viewerState.zoom / 1.2);
        break;
      case 'reset':
        newZoom = 1;
        break;
    }

    canvas.setZoom(newZoom);
    setViewerState(prev => ({ ...prev, zoom: newZoom }));
  };

  // Toggle des délimitations
  const toggleDelimitations = () => {
    setViewerState(prev => ({ ...prev, showDelimitations: !prev.showDelimitations }));
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      setTimeout(() => displayDelimitationsProfessionally(canvas), 100);
    }
  };

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && fabricCanvasRef.current) {
        const container = containerRef.current;
        const canvas = fabricCanvasRef.current;
        
        const newWidth = container.clientWidth;
        const newHeight = Math.min(maxHeight, container.clientHeight || maxHeight);
        
        canvas.setDimensions({ width: newWidth, height: newHeight });
        
        // Recharger l'image avec les nouvelles dimensions
        if (imageLoaded) {
          setTimeout(() => {
            loadImageProfessionally(canvas);
          }, 50);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded, maxHeight]);

  // Initialisation
  useEffect(() => {
    const timer = setTimeout(() => {
      initProfessionalViewer();
    }, 100);

    return () => {
      clearTimeout(timer);
      safeDisposeCanvas(fabricCanvasRef.current);
    };
  }, [initProfessionalViewer]);

  // Re-afficher les délimitations quand elles changent
  useEffect(() => {
    if (imageLoaded && fabricCanvasRef.current) {
      displayDelimitationsProfessionally(fabricCanvasRef.current);
    }
  }, [delimitations, viewerState.showDelimitations, imageLoaded]);

  return (
    <Card className={`overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
      {/* En-tête avec contrôles */}
      {showControls && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Zones de Personnalisation
              </h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {delimitations.length} zone{delimitations.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewerState.showDelimitations ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleDelimitations}
                    >
                      {viewerState.showDelimitations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {viewerState.showDelimitations ? 'Masquer' : 'Afficher'} les zones
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="w-px h-6 bg-gray-300" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom arrière</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {Math.round(viewerState.zoom * 100)}%
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom avant</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleZoom('reset')}>
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ajuster à la taille</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}

      {/* Zone d'affichage */}
      <CardContent className="p-0">
        <div ref={containerRef} className="relative w-full" style={{ height: maxHeight }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900">Chargement de l'image...</p>
                <p className="text-sm text-gray-500 mt-1">Préparation de l'affichage professionnel</p>
              </div>
            </div>
          )}

          {/* Info sur la délimitation sélectionnée */}
          {viewerState.selectedDelimitation && (
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  {delimitations.find(d => String(d.id) === viewerState.selectedDelimitation)?.name || 'Zone de personnalisation'}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Liste des délimitations */}
      {delimitations.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {delimitations.map((delimitation, index) => (
              <div
                key={delimitation.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                  viewerState.selectedDelimitation === String(delimitation.id)
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-4 h-4 rounded border-2 border-white shadow-sm"
                  style={{ backgroundColor: delimiterColors[index % delimiterColors.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {delimitation.name || `Zone ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500 leading-4">
                    {(() => {
                      // Détection px vs % (même logique que ProductDetailPage)
                      const isPixel = delimitation.coordinateType === 'PIXEL' ||
                        delimitation.width > 100 || delimitation.height > 100 ||
                        delimitation.x > 100 || delimitation.y > 100;

                      const format = (val: number, px?: boolean) => px
                        ? `${Math.round(val)}px`
                        : `${val.toFixed(1)}%`;

                      const xLabel = format(delimitation.x, isPixel);
                      const yLabel = format(delimitation.y, isPixel);
                      const wLabel = format(delimitation.width, isPixel);
                      const hLabel = format(delimitation.height, isPixel);

                      return `X: ${xLabel}, Y: ${yLabel} • ${wLabel} × ${hLabel}`;
                    })()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProImageViewer; 
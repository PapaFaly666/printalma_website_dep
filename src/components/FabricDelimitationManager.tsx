import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import Button from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Target, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Plus,
  MousePointer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { DelimitationService, Delimitation } from '../services/delimitationService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface FabricDelimitationManagerProps {
  imageUrl: string;
  imageId: number;
  initialDelimitations?: Delimitation[];
  onDelimitationsChange?: (delimitations: Delimitation[]) => void;
  readonly?: boolean;
  className?: string;
}

interface FabricDelimitation extends Delimitation {
  fabricObject?: fabric.Rect;
}

const FabricDelimitationManager: React.FC<FabricDelimitationManagerProps> = ({
  imageUrl,
  imageId,
  initialDelimitations = [],
  onDelimitationsChange,
  readonly = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const imageObjectRef = useRef<fabric.Image | null>(null);
  
  const [delimitations, setDelimitations] = useState<FabricDelimitation[]>(
    initialDelimitations.map(d => ({ ...d }))
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDelimitation, setSelectedDelimitation] = useState<Delimitation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialiser le canvas Fabric.js
  const initCanvas = useCallback(() => {
    if (!canvasRef.current) {
      console.warn('Canvas ref not available');
      return;
    }

    try {
      // Vérifier que l'élément canvas est monté et a des dimensions
      const canvasElement = canvasRef.current;
      if (!canvasElement.offsetParent && !canvasElement.offsetWidth) {
        console.warn('Canvas element not ready');
        return;
      }

      // Nettoyer l'ancien canvas s'il existe
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }

      // Créer le canvas Fabric avec des dimensions explicites
      const canvas = new fabric.Canvas(canvasElement, {
        width: 800,
        height: 600,
        backgroundColor: '#f8f9fa',
        selection: !readonly,
        renderOnAddRemove: true,
        preserveObjectStacking: true,
        enableRetinaScaling: false // Ajouter pour éviter les problèmes de scaling
      });

      // Vérifier que le canvas est bien créé
      if (!canvas || !canvas.getContext()) {
        console.error('Failed to create fabric canvas');
        return;
      }

      fabricCanvasRef.current = canvas;

      // Charger l'image de manière sécurisée
      if (imageUrl) {
        fabric.Image.fromURL(imageUrl, (img) => {
          // Vérifications de sécurité
          if (!img || !canvas || !fabricCanvasRef.current) {
            console.warn('Image load failed or canvas disposed');
            return;
          }

          try {
            // Calculer les dimensions pour fit dans le canvas
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const imgWidth = img.width || 1;
            const imgHeight = img.height || 1;

            const scaleX = (canvasWidth - 40) / imgWidth;
            const scaleY = (canvasHeight - 40) / imgHeight;
            const scale = Math.min(scaleX, scaleY);

            img.set({
              left: (canvasWidth - imgWidth * scale) / 2,
              top: (canvasHeight - imgHeight * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
              hoverCursor: 'default',
              moveCursor: 'default'
            });

            canvas.add(img);
            canvas.sendToBack(img);
            imageObjectRef.current = img;
            setImageLoaded(true);

            // Charger les délimitations initiales
            setTimeout(() => {
              if (fabricCanvasRef.current) {
                loadDelimitationsOnCanvas();
              }
            }, 100);

            console.log('✅ FABRIC - Image chargée:', {
              originalSize: { width: imgWidth, height: imgHeight },
              displaySize: { width: imgWidth * scale, height: imgHeight * scale },
              scale: scale,
              position: { left: img.left, top: img.top }
            });
          } catch (error) {
            console.error('Error setting up image:', error);
          }
        }, {
          crossOrigin: 'anonymous'
        });
      }

      return canvas;
    } catch (error) {
      console.error('Error initializing fabric canvas:', error);
      return null;
    }
  }, [imageUrl, readonly]);

  // Charger les délimitations sur le canvas
  const loadDelimitationsOnCanvas = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const imageObj = imageObjectRef.current;
    
    if (!canvas || !imageObj || !imageLoaded) {
      console.warn('Canvas or image not ready for delimitations');
      return;
    }

    try {
      // Supprimer les anciennes délimitations
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        if (obj.type === 'rect' && (obj as any).isDelimitation) {
          canvas.remove(obj);
        }
        if (obj.type === 'text' && (obj as any).isDelimitationLabel) {
          canvas.remove(obj);
        }
      });

      // Ajouter les nouvelles délimitations
      delimitations.forEach((delimitation, index) => {
        createDelimitationRect(delimitation, index);
      });

      // Rendu sécurisé
      if (canvas && canvas.getContext()) {
        canvas.renderAll();
      }
    } catch (error) {
      console.error('Error loading delimitations on canvas:', error);
    }
  }, [delimitations, imageLoaded]);

  // Créer un rectangle de délimitation sur le canvas
  const createDelimitationRect = (delimitation: Delimitation, index: number) => {
    const canvas = fabricCanvasRef.current;
    const imageObj = imageObjectRef.current;
    
    if (!canvas || !imageObj) return;

    // Calculer les coordonnées réelles sur le canvas
    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    const rectLeft = imgLeft + (delimitation.x / 100) * imgWidth;
    const rectTop = imgTop + (delimitation.y / 100) * imgHeight;
    const rectWidth = (delimitation.width / 100) * imgWidth;
    const rectHeight = (delimitation.height / 100) * imgHeight;

    // Créer le rectangle
    const rect = new fabric.Rect({
      left: rectLeft,
      top: rectTop,
      width: rectWidth,
      height: rectHeight,
      fill: 'rgba(59, 130, 246, 0.2)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: !readonly,
      evented: !readonly,
      hasControls: !readonly,
      hasBorders: !readonly,
      lockRotation: true,
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      cornerSize: 8
    });

    // Marquer comme délimitation
    (rect as any).isDelimitation = true;
    (rect as any).delimitationId = delimitation.id;
    (rect as any).delimitationIndex = index;

    // Ajouter le texte du nom
    if (delimitation.name) {
      const text = new fabric.Text(delimitation.name, {
        left: rectLeft,
        top: rectTop - 25,
        fontSize: 12,
        fill: '#3b82f6',
        fontFamily: 'Arial',
        selectable: false,
        evented: false
      });
      
      (text as any).isDelimitationLabel = true;
      (text as any).delimitationId = delimitation.id;
      
      canvas.add(text);
    }

    // Événements pour les modifications
    if (!readonly) {
      rect.on('modified', () => {
        updateDelimitationFromRect(rect, delimitation.id);
      });

      rect.on('moving', () => {
        constrainToImage(rect);
      });

      rect.on('scaling', () => {
        constrainToImage(rect);
      });
    }

    canvas.add(rect);
    
    return rect;
  };

  // Contraindre le rectangle à rester dans l'image
  const constrainToImage = (rect: fabric.Rect) => {
    const imageObj = imageObjectRef.current;
    if (!imageObj) return;

    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    const rectLeft = rect.left || 0;
    const rectTop = rect.top || 0;
    const rectWidth = (rect.width || 0) * (rect.scaleX || 1);
    const rectHeight = (rect.height || 0) * (rect.scaleY || 1);

    // Contraintes
    const newLeft = Math.max(imgLeft, Math.min(imgLeft + imgWidth - rectWidth, rectLeft));
    const newTop = Math.max(imgTop, Math.min(imgTop + imgHeight - rectHeight, rectTop));

    rect.set({ left: newLeft, top: newTop });
  };

  // Mettre à jour une délimitation à partir du rectangle
  const updateDelimitationFromRect = async (rect: fabric.Rect, delimitationId?: number) => {
    const imageObj = imageObjectRef.current;
    if (!imageObj || !delimitationId) return;

    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    const rectLeft = rect.left || 0;
    const rectTop = rect.top || 0;
    const rectWidth = (rect.width || 0) * (rect.scaleX || 1);
    const rectHeight = (rect.height || 0) * (rect.scaleY || 1);

    // Convertir en pourcentages
    const x = ((rectLeft - imgLeft) / imgWidth) * 100;
    const y = ((rectTop - imgTop) / imgHeight) * 100;
    const width = (rectWidth / imgWidth) * 100;
    const height = (rectHeight / imgHeight) * 100;

    console.log('🎯 FABRIC - Mise à jour délimitation:', {
      id: delimitationId,
      pixels: { left: rectLeft, top: rectTop, width: rectWidth, height: rectHeight },
      percentages: { x, y, width, height },
      imageInfo: { left: imgLeft, top: imgTop, width: imgWidth, height: imgHeight }
    });

    // Mettre à jour via l'API
    try {
      const result = await DelimitationService.updateDelimitation(delimitationId, {
        x: Math.max(0, Math.min(100 - width, x)),
        y: Math.max(0, Math.min(100 - height, y)),
        width: Math.min(width, 100),
        height: Math.min(height, 100)
      });

      if (result.success) {
        toast.success('Délimitation mise à jour!');
        // Recharger les délimitations
        loadDelimitations();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Zoom
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !canvas.getContext()) {
      console.warn('Canvas not available for zoom');
      return;
    }

    try {
      let newZoom = zoom;
      if (direction === 'in') newZoom = Math.min(3, zoom * 1.2);
      else if (direction === 'out') newZoom = Math.max(0.5, zoom / 1.2);
      else newZoom = 1;

      canvas.setZoom(newZoom);
      setZoom(newZoom);
    } catch (error) {
      console.error('Zoom error:', error);
    }
  };

  // Activer/désactiver le mode création
  const toggleCreationMode = () => {
    if (readonly) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas || !canvas.getContext()) {
      console.warn('Canvas not available for creation mode');
      return;
    }

    try {
      if (isCreating) {
        // Désactiver le mode création
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
        canvas.defaultCursor = 'default';
        setIsCreating(false);
      } else {
        // Activer le mode création
        canvas.defaultCursor = 'crosshair';
        let isDrawing = false;
        let startPointer: fabric.Point | null = null;
        let rect: fabric.Rect | null = null;

        const onMouseDown = (event: fabric.IEvent) => {
          const imageObj = imageObjectRef.current;
          if (!imageObj || !event.pointer || !canvas.getContext()) return;

          // Vérifier si on clique sur l'image
          const imgLeft = imageObj.left || 0;
          const imgTop = imageObj.top || 0;
          const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
          const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

          if (event.pointer.x < imgLeft || event.pointer.x > imgLeft + imgWidth ||
              event.pointer.y < imgTop || event.pointer.y > imgTop + imgHeight) {
            return;
          }

          isDrawing = true;
          startPointer = event.pointer;

          rect = new fabric.Rect({
            left: startPointer.x,
            top: startPointer.y,
            width: 0,
            height: 0,
            fill: 'rgba(34, 197, 94, 0.2)',
            stroke: '#22c55e',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          });

          canvas.add(rect);
        };

        const onMouseMove = (event: fabric.IEvent) => {
          if (!isDrawing || !startPointer || !rect || !event.pointer) return;

          const width = Math.abs(event.pointer.x - startPointer.x);
          const height = Math.abs(event.pointer.y - startPointer.y);
          const left = Math.min(startPointer.x, event.pointer.x);
          const top = Math.min(startPointer.y, event.pointer.y);

          rect.set({ left, top, width, height });
          canvas.renderAll();
        };

        const onMouseUp = async (event: fabric.IEvent) => {
          if (!isDrawing || !startPointer || !rect || !event.pointer) return;

          isDrawing = false;
          const imageObj = imageObjectRef.current;
          
          if (!imageObj) {
            canvas.remove(rect);
            return;
          }

          const width = Math.abs(event.pointer.x - startPointer.x);
          const height = Math.abs(event.pointer.y - startPointer.y);

          if (width < 10 || height < 10) {
            canvas.remove(rect);
            return;
          }

          // Calculer les pourcentages
          const imgLeft = imageObj.left || 0;
          const imgTop = imageObj.top || 0;
          const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
          const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

          const rectLeft = rect.left || 0;
          const rectTop = rect.top || 0;
          const rectWidth = rect.width || 0;
          const rectHeight = rect.height || 0;

          const x = ((rectLeft - imgLeft) / imgWidth) * 100;
          const y = ((rectTop - imgTop) / imgHeight) * 100;
          const percentWidth = (rectWidth / imgWidth) * 100;
          const percentHeight = (rectHeight / imgHeight) * 100;

          console.log('🎯 FABRIC - Création délimitation:', {
            pixels: { left: rectLeft, top: rectTop, width: rectWidth, height: rectHeight },
            percentages: { x, y, width: percentWidth, height: percentHeight }
          });

          // Supprimer le rectangle temporaire
          canvas.remove(rect);

          // Demander le nom
          const name = prompt('Nom de la zone de personnalisation:') || 'Zone FABRIC';

          // Créer via l'API
          try {
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            
            const result = await DelimitationService.createDelimitation({
              productImageId: imageId,
              delimitation: {
                x: Math.max(0, Math.min(100 - percentWidth, x)),
                y: Math.max(0, Math.min(100 - percentHeight, y)),
                width: Math.min(percentWidth, 100),
                height: Math.min(percentHeight, 100),
                name,
                coordinateType: "PERCENTAGE" as const,
                referenceWidth: canvasWidth,
                referenceHeight: canvasHeight
              }
            });

            if (result.success && result.data) {
              toast.success('Zone créée avec succès!');
              loadDelimitations();
            }
          } catch (error) {
            toast.error('Erreur lors de la création');
          }

          // Désactiver le mode création
          toggleCreationMode();
        };

        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);

        setIsCreating(true);
      }
    } catch (error) {
      console.error('Creation mode toggle error:', error);
    }
  };

  // Charger les délimitations depuis l'API
  const loadDelimitations = useCallback(async () => {
    if (!imageId) return;
    
    try {
      setIsLoading(true);
      const result = await DelimitationService.getImageDelimitations(imageId);
      
      if (result.success && result.data) {
        setDelimitations(result.data);
        onDelimitationsChange?.(result.data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des délimitations');
    } finally {
      setIsLoading(false);
    }
  }, [imageId, onDelimitationsChange]);

  // Supprimer une délimitation
  const handleDelete = (delimitation: Delimitation) => {
    setSelectedDelimitation(delimitation);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedDelimitation?.id) return;

    try {
      const result = await DelimitationService.deleteDelimitation(selectedDelimitation.id);
      
      if (result.success) {
        toast.success('Délimitation supprimée!');
        loadDelimitations();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteDialog(false);
      setSelectedDelimitation(null);
    }
  };

  // Initialisation
  useEffect(() => {
    // Délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      const canvas = initCanvas();
      
      return () => {
        if (canvas) {
          try {
            canvas.dispose();
          } catch (error) {
            console.warn('Canvas disposal error:', error);
          }
        }
      };
    }, 50);

    return () => {
      clearTimeout(timer);
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        } catch (error) {
          console.warn('Canvas cleanup error:', error);
        }
      }
    };
  }, [initCanvas]);

  // Chargement des délimitations quand l'image est prête
  useEffect(() => {
    if (imageLoaded && fabricCanvasRef.current) {
      // Petit délai pour s'assurer que tout est prêt
      const timer = setTimeout(() => {
        loadDelimitationsOnCanvas();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loadDelimitationsOnCanvas, imageLoaded]);

  // Chargement initial des délimitations
  useEffect(() => {
    if (initialDelimitations.length > 0) {
      setDelimitations(initialDelimitations);
    } else {
      loadDelimitations();
    }
  }, [initialDelimitations, loadDelimitations]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Zones de Personnalisation (FABRIC)
              <Badge variant="outline">{delimitations.length}</Badge>
            </CardTitle>
            
            {!readonly && (
              <div className="flex gap-2">
                <Button
                  variant={isCreating ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleCreationMode}
                  disabled={isLoading || !imageLoaded}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <X className="h-4 w-4" />
                      Annuler
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Créer Zone
                    </>
                  )}
                </Button>
                
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleZoom('reset')}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {isCreating && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
              <MousePointer className="h-4 w-4" />
              Cliquez et glissez sur l'image pour créer une zone de personnalisation
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-4">
          <div className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="border border-gray-200 dark:border-gray-700 rounded" />
            
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Maximize2 className="h-12 w-12 mx-auto mb-2" />
                  <p>Chargement de l'image...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-500 text-center">
            Zoom: {Math.round(zoom * 100)}% • {delimitations.length} délimitations
          </div>
        </CardContent>
      </Card>

      {/* Liste des délimitations */}
      {delimitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Délimitations existantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {delimitations.map((delimitation) => (
              <div 
                key={delimitation.id} 
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">
                      {delimitation.name || `Zone ${delimitation.id}`}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Position: {delimitation.x.toFixed(1)}%, {delimitation.y.toFixed(1)}% • 
                      Taille: {delimitation.width.toFixed(1)}% × {delimitation.height.toFixed(1)}%
                    </p>
                  </div>
                  
                  {!readonly && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(delimitation)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la délimitation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la zone "{selectedDelimitation?.name}" ? 
              Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FabricDelimitationManager; 
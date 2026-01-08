import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import Button from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { 
  Target, 
  MousePointer, 
  Square,
  Circle,
  Move,
  RotateCw,
  Copy,
  Trash2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  Settings,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { DelimitationService, Delimitation } from '../services/delimitationService';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ProDelimitationEditorProps {
  imageUrl: string;
  imageId: number;
  initialDelimitations?: Delimitation[];
  onDelimitationsChange?: (delimitations: Delimitation[]) => void;
  readonly?: boolean;
  className?: string;
}

interface EditorState {
  tool: 'select' | 'rectangle' | 'circle' | 'polygon';
  showGrid: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  zoom: number;
  history: any[];
  historyIndex: number;
}

interface DelimitationProperties {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  color: string;
  name: string;
  locked: boolean;
  visible: boolean;
}

const ProDelimitationEditor: React.FC<ProDelimitationEditorProps> = ({
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
  
  const [delimitations, setDelimitations] = useState<Delimitation[]>(initialDelimitations);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [properties, setProperties] = useState<DelimitationProperties>({
    x: 0, y: 0, width: 0, height: 0, rotation: 0, opacity: 1,
    color: '#3b82f6', name: '', locked: false, visible: true
  });
  const [editorState, setEditorState] = useState<EditorState>({
    tool: 'select',
    showGrid: false,
    showGuides: true,
    snapToGrid: false,
    zoom: 1,
    history: [],
    historyIndex: -1
  });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Couleurs prédéfinies pour les délimitations
  const delimiterColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const getDelimitationsFromCanvas = useCallback((): Delimitation[] => {
    const canvas = fabricCanvasRef.current;
    const imageObj = imageObjectRef.current;
    if (!canvas || !imageObj) return [];

    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = imageObj.getScaledWidth();
    const imgHeight = imageObj.getScaledHeight();

    return canvas.getObjects()
      .filter(obj => (obj as any).isDelimitation)
      .map((obj, index) => {
        const rect = obj as fabric.Rect;
        const x = ((rect.left! - imgLeft) / imgWidth) * 100;
        const y = ((rect.top! - imgTop) / imgHeight) * 100;
        const width = (rect.getScaledWidth() / imgWidth) * 100;
        const height = (rect.getScaledHeight() / imgHeight) * 100;

        return {
          id: (rect as any).delimitationId,
          name: (rect as any).delimitationName || `Zone ${index + 1}`,
          x,
          y,
          width,
          height,
          rotation: rect.angle || 0,
          coordinateType: 'PERCENTAGE',
          referenceWidth: imageObj.width || 0,
          referenceHeight: imageObj.height || 0,
        } as Delimitation;
      });
  }, []);

  const triggerDelimitationChange = useCallback(() => {
    if (readonly || !onDelimitationsChange) return;
    const newDelimitations = getDelimitationsFromCanvas();
    setDelimitations(newDelimitations);
    onDelimitationsChange(newDelimitations);
  }, [onDelimitationsChange, getDelimitationsFromCanvas, readonly]);

  // Initialiser le canvas professionnel
  const initProfessionalCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 900,
        height: 600,
        backgroundColor: '#f8fafc',
        selection: !readonly,
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        imageSmoothingEnabled: true,
        renderOnAddRemove: false, // Performance
        skipTargetFind: false,
        perPixelTargetFind: true
      });

      // Configuration professionnelle
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerColor = '#3b82f6';
      fabric.Object.prototype.cornerStyle = 'circle';
      fabric.Object.prototype.cornerSize = 8;
      fabric.Object.prototype.borderColor = '#3b82f6';
      fabric.Object.prototype.borderScaleFactor = 2;

      fabricCanvasRef.current = canvas;
      setupCanvasEvents(canvas);
      
      if (imageUrl) {
        loadImageProfessionally(canvas);
      }

      return canvas;
    } catch (error) {
      console.error('Canvas initialization error:', error);
      return null;
    }
  }, [imageUrl, readonly]);

  // Charger l'image de manière professionelle
  const loadImageProfessionally = (canvas: fabric.Canvas) => {
    fabric.Image.fromURL(imageUrl, (img) => {
      if (!img || !canvas) return;

      const canvasWidthInitial = canvas.getWidth();
      const canvasHeightInitial = canvas.getHeight();
      const targetW = 1200; // largeur cible maximale
      const padding = 50;
      // Scale pour atteindre targetW si l'image est plus grande, sinon 1
      const scale = img.width > targetW ? targetW / img.width : 1;
      
      const dispW = img.width * scale;
      const dispH = img.height * scale;

      // Ajuster le canvas : largeur = dispW + padding, hauteur = dispH + padding
      canvas.setWidth(dispW + padding);
      canvas.setHeight(dispH + padding);

      img.set({
        left: (canvas.getWidth() - dispW) / 2,
        top: (canvas.getHeight() - dispH) / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        moveCursor: 'default',
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.1)',
          blur: 10,
          offsetX: 0,
          offsetY: 4
        })
      });

      canvas.add(img);
      canvas.sendToBack(img);
      imageObjectRef.current = img;
      
      // Ajouter la grille si activée
      if (editorState.showGrid) {
        addGrid(canvas);
      }

      setImageLoaded(true);
      loadExistingDelimitations(canvas);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  };

  // Configuration des événements canvas
  const setupCanvasEvents = (canvas: fabric.Canvas) => {
    canvas.on('selection:created', (e) => {
      handleObjectSelection(e.selected?.[0]);
    });

    canvas.on('selection:updated', (e) => {
      handleObjectSelection(e.selected?.[0]);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
      resetProperties();
    });

    canvas.on('object:modified', (e) => {
      updatePropertiesFromObject(e.target);
      saveToHistory();
      triggerDelimitationChange();
    });

    canvas.on('object:moving', (e) => {
      if (editorState.snapToGrid) {
        snapObjectToGrid(e.target);
      }
      if (editorState.showGuides) {
        showAlignmentGuides(e.target);
      }
      updatePropertiesFromObject(e.target);
    });

    canvas.on('object:scaling', (e) => {
      updatePropertiesFromObject(e.target);
    });

    canvas.on('object:rotating', (e) => {
      updatePropertiesFromObject(e.target);
    });

    // Raccourcis clavier
    const canvasElement = canvas.getElement();
    if (canvasElement.parentElement) {
      canvasElement.parentElement.tabIndex = 1000;
      canvasElement.parentElement.addEventListener('keydown', handleKeyboard);
    }
  };

  // Gestion de la sélection d'objets
  const handleObjectSelection = (obj: fabric.Object | undefined) => {
    if (obj && (obj as any).isDelimitation) {
      setSelectedObject(obj);
      updatePropertiesFromObject(obj);
    }
  };

  // Mettre à jour les propriétés depuis l'objet sélectionné
  const updatePropertiesFromObject = (obj: fabric.Object | undefined) => {
    if (!obj || !(obj as any).isDelimitation) return;

    const rect = obj as fabric.Rect;
    const imageObj = imageObjectRef.current;
    if (!imageObj) return;

    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    const x = ((rect.left! - imgLeft) / imgWidth) * 100;
    const y = ((rect.top! - imgTop) / imgHeight) * 100;
    const width = ((rect.width! * rect.scaleX!) / imgWidth) * 100;
    const height = ((rect.height! * rect.scaleY!) / imgHeight) * 100;

    setProperties({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
      rotation: Math.round(rect.angle || 0),
      opacity: rect.opacity || 1,
      color: rect.fill as string || '#3b82f6',
      name: (rect as any).delimitationName || '',
      locked: !rect.selectable!,
      visible: rect.visible!
    });
  };

  // Réinitialiser les propriétés
  const resetProperties = () => {
    setProperties({
      x: 0, y: 0, width: 0, height: 0, rotation: 0, opacity: 1,
      color: '#3b82f6', name: '', locked: false, visible: true
    });
  };

  // Outils de création
  const createRectangleDelimitation = () => {
    const canvas = fabricCanvasRef.current;
    const imageObj = imageObjectRef.current;
    if (!canvas || !imageObj) return;

    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    const rect = new fabric.Rect({
      left: imgLeft + imgWidth * 0.3,
      top: imgTop + imgHeight * 0.3,
      width: imgWidth * 0.4,
      height: imgHeight * 0.4,
      fill: 'rgba(59, 130, 246, 0.3)',
      stroke: properties.color,
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      rx: 4,
      ry: 4,
      shadow: new fabric.Shadow({
        color: 'rgba(59, 130, 246, 0.3)',
        blur: 8,
        offsetX: 0,
        offsetY: 2
      })
    });

    (rect as any).isDelimitation = true;
    (rect as any).delimitationName = `Zone ${delimitations.length + 1}`;

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();

    saveToHistory();
    triggerDelimitationChange();
    setEditorState(prev => ({ ...prev, tool: 'select' }));
  };

  // Ajouter la grille
  const addGrid = (canvas: fabric.Canvas) => {
    const gridSize = 20;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Lignes verticales
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new fabric.Line([i, 0, i, canvasHeight], {
        stroke: '#e2e8f0',
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      (line as any).isGrid = true;
      canvas.add(line);
    }

    // Lignes horizontales
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new fabric.Line([0, i, canvasWidth, i], {
        stroke: '#e2e8f0',
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      (line as any).isGrid = true;
      canvas.add(line);
    }

    canvas.getObjects().filter(obj => (obj as any).isGrid).forEach(obj => {
      canvas.sendToBack(obj);
    });
  };

  // Supprimer la grille
  const removeGrid = (canvas: fabric.Canvas) => {
    const gridObjects = canvas.getObjects().filter(obj => (obj as any).isGrid);
    gridObjects.forEach(obj => canvas.remove(obj));
  };

  // Snap to grid
  const snapObjectToGrid = (obj: fabric.Object) => {
    const gridSize = 20;
    const left = Math.round((obj.left || 0) / gridSize) * gridSize;
    const top = Math.round((obj.top || 0) / gridSize) * gridSize;
    obj.set({ left, top });
  };

  // Guides d'alignement
  const showAlignmentGuides = (obj: fabric.Object) => {
    // TODO: Implémenter les guides d'alignement
  };

  // Gestion du clavier
  const handleKeyboard = (e: KeyboardEvent) => {
    if (readonly) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (activeObject && (activeObject as any).isDelimitation) {
          deleteSelectedDelimitation();
        }
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          copySelectedDelimitation();
        }
        break;
      case 'v':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          pasteDelimitation();
        }
        break;
    }
  };

  // Historique
  const saveToHistory = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const state = JSON.stringify(canvas.toJSON(['isDelimitation', 'delimitationName']));
    const newHistory = editorState.history.slice(0, editorState.historyIndex + 1);
    newHistory.push(state);
    
    setEditorState(prev => ({
      ...prev,
      history: newHistory,
      historyIndex: newHistory.length - 1
    }));
  };

  const undo = () => {
    if (editorState.historyIndex > 0) {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const prevState = editorState.history[editorState.historyIndex - 1];
      canvas.loadFromJSON(prevState, () => {
        canvas.renderAll();
        setEditorState(prev => ({ ...prev, historyIndex: prev.historyIndex - 1 }));
      });
    }
  };

  const redo = () => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const nextState = editorState.history[editorState.historyIndex + 1];
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setEditorState(prev => ({ ...prev, historyIndex: prev.historyIndex + 1 }));
      });
    }
  };

  // Actions sur les délimitations
  const deleteSelectedDelimitation = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    setSelectedObject(null);
    resetProperties();
    canvas.renderAll();
    saveToHistory();
    triggerDelimitationChange();
  };

  const copySelectedDelimitation = () => {
    // TODO: Implémenter la copie
  };

  const pasteDelimitation = () => {
    // TODO: Implémenter le collage
  };

  // Charger les délimitations existantes
  const loadExistingDelimitations = (canvas: fabric.Canvas) => {
    const imageObj = imageObjectRef.current;
    if (!imageObj || !initialDelimitations) return;

    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = imageObj.getScaledWidth();
    const imgHeight = imageObj.getScaledHeight();

    initialDelimitations.forEach((delim, index) => {
      const rect = new fabric.Rect({
        left: imgLeft + (delim.x / 100) * imgWidth,
        top: imgTop + (delim.y / 100) * imgHeight,
        width: (delim.width / 100) * imgWidth,
        height: (delim.height / 100) * imgHeight,
        angle: delim.rotation || 0,
        fill: 'rgba(59, 130, 246, 0.3)',
        stroke: properties.color,
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        rx: 4,
        ry: 4,
        shadow: new fabric.Shadow({
          color: 'rgba(59, 130, 246, 0.3)',
          blur: 8,
          offsetX: 0,
          offsetY: 2
        })
      });

      (rect as any).isDelimitation = true;
      (rect as any).delimitationId = delim.id;
      (rect as any).delimitationName = delim.name || `Zone ${index + 1}`;
      canvas.add(rect);
    });

    canvas.renderAll();
    saveToHistory();
  };

  // Zoom
  const handleZoom = (direction: 'in' | 'out' | 'fit' | 'actual') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let newZoom = editorState.zoom;
    
    switch (direction) {
      case 'in':
        newZoom = Math.min(3, editorState.zoom * 1.2);
        break;
      case 'out':
        newZoom = Math.max(0.1, editorState.zoom / 1.2);
        break;
      case 'fit':
        newZoom = 1;
        break;
      case 'actual':
        newZoom = 1;
        break;
    }

    canvas.setZoom(newZoom);
    setEditorState(prev => ({ ...prev, zoom: newZoom }));
  };

  // Toggle grille
  const toggleGrid = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newShowGrid = !editorState.showGrid;
    setEditorState(prev => ({ ...prev, showGrid: newShowGrid }));

    if (newShowGrid) {
      addGrid(canvas);
    } else {
      removeGrid(canvas);
    }
    canvas.renderAll();
  };

  // Initialisation
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = initProfessionalCanvas();
      return () => {
        if (canvas) {
          canvas.dispose();
        }
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [initProfessionalCanvas]);

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Overlay debug taille image */}
      <div style={{position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 8, borderRadius: 8, fontSize: 12}}>
        {imageObjectRef.current && (
          <>
            Image chargée dans le canvas : {imageObjectRef.current.width} x {imageObjectRef.current.height} px
          </>
        )}
      </div>
      {/* Toolbar principal */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Outils de sélection */}
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editorState.tool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorState(prev => ({ ...prev, tool: 'select' }))}
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sélectionner (V)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createRectangleDelimitation}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rectangle (R)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Actions */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={undo}
                    disabled={editorState.historyIndex <= 0}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={editorState.historyIndex >= editorState.history.length - 1}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rétablir (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Outils de vue */}
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editorState.showGrid ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleGrid}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grille</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('out')}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono w-12 text-center">
                {Math.round(editorState.zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('in')}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded-lg shadow-lg bg-white"
            />
            
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Chargement de l'éditeur...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panneau des propriétés */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Délimitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2" />
                  Délimitations
                  <Badge variant="outline" className="ml-2">
                    {delimitations.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Liste des délimitations */}
                <div className="space-y-2">
                  {delimitations.map((delimitation, index) => (
                    <div
                      key={delimitation.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: properties.color }}
                        />
                        <span className="text-sm font-medium">
                          {delimitation.name || `Zone ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Propriétés de l'objet sélectionné */}
            {selectedObject && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Propriétés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">X (%)</Label>
                      <Input
                        type="number"
                        value={properties.x}
                        onChange={(e) => setProperties(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y (%)</Label>
                      <Input
                        type="number"
                        value={properties.y}
                        onChange={(e) => setProperties(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Largeur (%)</Label>
                      <Input
                        type="number"
                        value={properties.width}
                        onChange={(e) => setProperties(prev => ({ ...prev, width: parseFloat(e.target.value) }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hauteur (%)</Label>
                      <Input
                        type="number"
                        value={properties.height}
                        onChange={(e) => setProperties(prev => ({ ...prev, height: parseFloat(e.target.value) }))}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Nom</Label>
                    <Input
                      value={properties.name}
                      onChange={(e) => setProperties(prev => ({ ...prev, name: e.target.value }))}
                      className="h-8 mt-1"
                      placeholder="Nom de la zone"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Couleur</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {delimiterColors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded border-2 ${
                            properties.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setProperties(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Opacité</Label>
                    <Slider
                      value={[properties.opacity * 100]}
                      onValueChange={([value]) => setProperties(prev => ({ ...prev, opacity: value / 100 }))}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">{Math.round(properties.opacity * 100)}%</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Barre de statut */}
      <div className="bg-gray-100 border-t border-gray-200 px-6 py-2 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <div>
            {selectedObject ? `Zone sélectionnée: ${properties.name || 'Sans nom'}` : 'Aucune sélection'}
          </div>
          <div className="flex items-center space-x-4">
            <span>Zoom: {Math.round(editorState.zoom * 100)}%</span>
            <span>Délimitations: {delimitations.length}</span>
            <span>Outil: {editorState.tool}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProDelimitationEditor; 
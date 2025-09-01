import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square, 
  MousePointer, 
  Save, 
  Trash2, 
  Move,
  RotateCw,
  CheckCircle,
  AlertCircle,
  X,
  Edit3,
  Eye
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { fabric } from 'fabric';
import { toast } from 'sonner';

interface DelimitationData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayScale: number;
  offsetX: number;
  offsetY: number;
}

interface InteractiveDelimitationCanvasProps {
  imageUrl: string;
  onDelimitationSave: (delimitation: DelimitationData) => Promise<boolean>;
  onDelimitationChange?: (delimitation: DelimitationData | null) => void;
  existingDelimitation?: DelimitationData | null;
  className?: string;
}

export const InteractiveDelimitationCanvas: React.FC<InteractiveDelimitationCanvasProps> = ({
  imageUrl,
  onDelimitationSave,
  onDelimitationChange,
  existingDelimitation = null,
  className = ''
}) => {
  // 🎯 États principaux
  const [editMode, setEditMode] = useState<'consultation' | 'edition'>('consultation');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 📊 Données de délimitation
  const [currentDelimitation, setCurrentDelimitation] = useState<DelimitationData | null>(existingDelimitation);
  const [savedDelimitation, setSavedDelimitation] = useState<DelimitationData | null>(existingDelimitation);
  
  // 📏 Métriques d'image
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);

  // 🎨 Refs Fabric.js
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const delimitationRectRef = useRef<fabric.Rect | null>(null);
  const isInitializedRef = useRef(false);

  // 🔧 Conversion coordonnées canvas <-> image réelle
  const canvasToRealCoordinates = useCallback((canvasCoords: {
    x: number, y: number, width: number, height: number
  }) => {
    if (!imageMetrics) return canvasCoords;
    
    return {
      x: (canvasCoords.x - imageMetrics.offsetX) / imageMetrics.displayScale,
      y: (canvasCoords.y - imageMetrics.offsetY) / imageMetrics.displayScale,
      width: canvasCoords.width / imageMetrics.displayScale,
      height: canvasCoords.height / imageMetrics.displayScale
    };
  }, [imageMetrics]);

  const realToCanvasCoordinates = useCallback((realCoords: {
    x: number, y: number, width: number, height: number
  }) => {
    if (!imageMetrics) return realCoords;
    
    return {
      x: (realCoords.x * imageMetrics.displayScale) + imageMetrics.offsetX,
      y: (realCoords.y * imageMetrics.displayScale) + imageMetrics.offsetY,
      width: realCoords.width * imageMetrics.displayScale,
      height: realCoords.height * imageMetrics.displayScale
    };
  }, [imageMetrics]);

  // 🎨 Initialisation du canvas Fabric.js
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || isInitializedRef.current) return;

    console.log('🎨 Initialisation du canvas...');
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa',
      selection: false,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;
    isInitializedRef.current = true;

    console.log('✅ Canvas initialisé');
    return canvas;
  }, []);

  // 🖼️ Chargement de l'image
  const loadImage = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !imageUrl) return;

    console.log('🖼️ Chargement de l\'image...');
    
    try {
      // Nettoyer le canvas
      canvas.clear();
      canvas.backgroundColor = '#f8f9fa';
      delimitationRectRef.current = null;

      // Charger l'image
      const fabricImg = await fabric.Image.fromURL(imageUrl);

      // Calculer la mise à l'échelle
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = fabricImg.width || 1;
      const imgHeight = fabricImg.height || 1;

      const scaleX = (canvasWidth * 0.9) / imgWidth;
      const scaleY = (canvasHeight * 0.9) / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      const displayWidth = imgWidth * scale;
      const displayHeight = imgHeight * scale;
      const offsetX = (canvasWidth - displayWidth) / 2;
      const offsetY = (canvasHeight - displayHeight) / 2;

      // Positionner l'image
      fabricImg.set({
        left: offsetX,
        top: offsetY,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        hoverCursor: 'default'
      });

      // Stocker les métriques
      const metrics: ImageMetrics = {
        originalWidth: imgWidth,
        originalHeight: imgHeight,
        displayScale: scale,
        offsetX,
        offsetY
      };
      
      setImageMetrics(metrics);

      // Ajouter au canvas
      canvas.add(fabricImg);
      canvas.sendToBack(fabricImg);
      canvas.renderAll();

      console.log(`✅ Image chargée: ${imgWidth}×${imgHeight}px`);
    } catch (error) {
      console.error('❌ Erreur chargement image:', error);
      toast.error('Erreur lors du chargement de l\'image');
    }
  }, [imageUrl]);

  // 🎯 Création/mise à jour de la délimitation
  const updateDelimitationOnCanvas = useCallback((delimitation: DelimitationData, isEditable: boolean = false) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !imageMetrics) return;

    // Supprimer l'ancienne délimitation
    if (delimitationRectRef.current) {
      canvas.remove(delimitationRectRef.current);
    }

    // Convertir les coordonnées réelles en coordonnées canvas
    const canvasCoords = realToCanvasCoordinates({
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height
    });

    // Styles selon le mode
    const consultationStyle = {
      fill: 'rgba(148, 163, 184, 0.08)',
      stroke: '#94a3b8',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      cornerColor: '#94a3b8',
      cornerSize: 6,
      selectable: false,
      evented: false
    };

    const editionStyle = {
      fill: 'rgba(59, 130, 246, 0.15)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [0],
      cornerColor: '#3b82f6',
      cornerSize: 10,
      selectable: true,
      evented: true
    };

    const style = isEditable ? editionStyle : consultationStyle;

    // Créer le rectangle
    const rect = new fabric.Rect({
      left: canvasCoords.x,
      top: canvasCoords.y,
      width: canvasCoords.width,
      height: canvasCoords.height,
      ...style,
      transparentCorners: false,
      cornerStyle: 'circle',
      borderColor: style.stroke,
      lockRotation: true
    });

    // Événements de modification (seulement en mode édition)
    if (isEditable) {
      const handleModification = () => {
        updateCurrentDelimitationFromCanvas();
      };

      rect.on('moving', handleModification);
      rect.on('moved', handleModification);
      rect.on('scaling', handleModification);
      rect.on('scaled', handleModification);
      rect.on('modified', handleModification);
    }

    canvas.add(rect);
    delimitationRectRef.current = rect;
    canvas.renderAll();

    const modeText = isEditable ? 'édition' : 'consultation';
    console.log(`🎯 Délimitation mise à jour en mode ${modeText}`);
  }, [imageMetrics, realToCanvasCoordinates]);

  // 📊 Mise à jour des données depuis le canvas
  const updateCurrentDelimitationFromCanvas = useCallback(() => {
    const rect = delimitationRectRef.current;
    if (!rect || !imageMetrics) return;

    // Obtenir les coordonnées du canvas
    const canvasCoords = {
      x: rect.left || 0,
      y: rect.top || 0,
      width: (rect.width || 0) * (rect.scaleX || 1),
      height: (rect.height || 0) * (rect.scaleY || 1)
    };

    // Convertir en coordonnées réelles
    const realCoords = canvasToRealCoordinates(canvasCoords);

    // Validation des limites
    const clampedWidth = Math.max(1, Math.min(realCoords.width, imageMetrics.originalWidth));
    const clampedHeight = Math.max(1, Math.min(realCoords.height, imageMetrics.originalHeight));
    const clampedX = Math.max(0, Math.min(realCoords.x, imageMetrics.originalWidth - clampedWidth));
    const clampedY = Math.max(0, Math.min(realCoords.y, imageMetrics.originalHeight - clampedHeight));

    const delimitation: DelimitationData = {
      id: currentDelimitation?.id || `delim_${Date.now()}`,
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      width: Math.round(clampedWidth),
      height: Math.round(clampedHeight),
      rotation: 0
    };

    setCurrentDelimitation(delimitation);

    if (onDelimitationChange) {
      onDelimitationChange(delimitation);
    }
  }, [imageMetrics, canvasToRealCoordinates, currentDelimitation?.id, onDelimitationChange]);

  // 🎨 Mode dessin (création nouvelle délimitation)
  const enableDrawingMode = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('🎨 Mode dessin activé');
    setIsDrawing(true);
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';

    let isDown = false;
    let origX = 0;
    let origY = 0;
    let tempRect: fabric.Rect | null = null;

    const handleMouseDown = (o: fabric.IEvent) => {
      if (!canvas) return;
      isDown = true;
      const pointer = canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;

      tempRect = new fabric.Rect({
        left: origX,
        top: origY,
        width: 0,
        height: 0,
        fill: 'rgba(59, 130, 246, 0.1)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(tempRect);
    };

    const handleMouseMove = (o: fabric.IEvent) => {
      if (!isDown || !tempRect || !canvas) return;
      const pointer = canvas.getPointer(o.e);
      tempRect.set({
        left: Math.min(origX, pointer.x),
        top: Math.min(origY, pointer.y),
        width: Math.abs(pointer.x - origX),
        height: Math.abs(pointer.y - origY),
      });
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDown || !tempRect || !canvas) return;
      isDown = false;
      setIsDrawing(false);

      canvas.remove(tempRect);

      if (tempRect.width! > 20 && tempRect.height! > 20) {
        // Créer la délimitation
        const canvasCoords = {
          x: tempRect.left || 0,
          y: tempRect.top || 0,
          width: tempRect.width || 0,
          height: tempRect.height || 0
        };

        const realCoords = canvasToRealCoordinates(canvasCoords);
        
        const newDelimitation: DelimitationData = {
          id: `delim_${Date.now()}`,
          x: Math.round(realCoords.x),
          y: Math.round(realCoords.y),
          width: Math.round(realCoords.width),
          height: Math.round(realCoords.height),
          rotation: 0
        };

        setCurrentDelimitation(newDelimitation);
        setEditMode('edition');
        updateDelimitationOnCanvas(newDelimitation, true);
        
        toast.success('Zone de délimitation créée');
      } else {
        toast.error('Zone trop petite, veuillez dessiner une zone plus grande');
      }

      // Nettoyer les événements
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
  }, [canvasToRealCoordinates, updateDelimitationOnCanvas]);

  // 🔓 Passer en mode édition
  const enterEditMode = useCallback(() => {
    if (!currentDelimitation) return;
    
    console.log('✏️ Passage en mode édition');
    setEditMode('edition');
    updateDelimitationOnCanvas(currentDelimitation, true);
  }, [currentDelimitation, updateDelimitationOnCanvas]);

  // ❌ Annuler les modifications
  const cancelEdit = useCallback(() => {
    console.log('↩️ Annulation des modifications');
    
    if (savedDelimitation) {
      setCurrentDelimitation(savedDelimitation);
      updateDelimitationOnCanvas(savedDelimitation, false);
    } else {
      // Pas de délimitation sauvegardée, supprimer
      if (delimitationRectRef.current && fabricCanvasRef.current) {
        fabricCanvasRef.current.remove(delimitationRectRef.current);
        delimitationRectRef.current = null;
      }
      setCurrentDelimitation(null);
    }
    
    setEditMode('consultation');
    toast.success('Modifications annulées');
  }, [savedDelimitation, updateDelimitationOnCanvas]);

  // 💾 Sauvegarder les changements
  const saveChanges = useCallback(async () => {
    if (!currentDelimitation || isSaving) return;

    setIsSaving(true);
    console.log('💾 Sauvegarde des modifications...');
    
    try {
      const success = await onDelimitationSave(currentDelimitation);
      
      if (success) {
        setSavedDelimitation(currentDelimitation);
        setEditMode('consultation');
        updateDelimitationOnCanvas(currentDelimitation, false);
        toast.success('Zone de personnalisation sauvegardée');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [currentDelimitation, isSaving, onDelimitationSave, updateDelimitationOnCanvas]);

  // 🗑️ Supprimer la délimitation
  const removeDelimitation = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !delimitationRectRef.current) return;

    console.log('🗑️ Suppression de la zone');
    
    canvas.remove(delimitationRectRef.current);
    delimitationRectRef.current = null;
    setCurrentDelimitation(null);
    setSavedDelimitation(null);
    setEditMode('consultation');

    if (onDelimitationChange) {
      onDelimitationChange(null);
    }

    toast.success('Zone supprimée');
  }, [onDelimitationChange]);

  // 🔄 Effets de synchronisation
  
  // Initialisation du canvas
  useEffect(() => {
    const canvas = initializeCanvas();
    return () => {
      if (canvas) {
        canvas.dispose();
        isInitializedRef.current = false;
      }
    };
  }, [initializeCanvas]);

  // Chargement de l'image
  useEffect(() => {
    if (fabricCanvasRef.current && imageUrl) {
      loadImage();
    }
  }, [imageUrl, loadImage]);

  // Restauration de la délimitation existante
  useEffect(() => {
    if (imageMetrics && existingDelimitation) {
      console.log('🔄 Restauration délimitation existante');
      setCurrentDelimitation(existingDelimitation);
      setSavedDelimitation(existingDelimitation);
      updateDelimitationOnCanvas(existingDelimitation, false);
    }
  }, [imageMetrics, existingDelimitation, updateDelimitationOnCanvas]);

  // 🎨 Interface utilisateur
  return (
    <Card className={`overflow-hidden border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header avec titre et statut */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Définir la zone de personnalisation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tracez la zone où le design personnalisé pourra être appliqué
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {currentDelimitation && (
              <Badge 
                variant={editMode === 'edition' ? 'default' : 'secondary'}
                className={editMode === 'edition' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
              >
                {editMode === 'edition' ? (
                  <>
                    <Edit3 className="w-3 h-3 mr-1" />
                    En édition
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Consultation
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Canvas principal */}
        <div className="relative mb-6">
          <div className="relative w-full bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
              style={{ aspectRatio: '4/3' }}
            />
            
            {/* Overlay d'information */}
            {currentDelimitation && (
              <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 text-xs font-mono min-w-[160px] shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500 dark:text-gray-400">X:</span>
                  <span className="font-medium">{currentDelimitation.x}px</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Y:</span>
                  <span className="font-medium">{currentDelimitation.y}px</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500 dark:text-gray-400">L:</span>
                  <span className="font-medium">{currentDelimitation.width}px</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500 dark:text-gray-400">H:</span>
                  <span className="font-medium">{currentDelimitation.height}px</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Surface:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {(currentDelimitation.width * currentDelimitation.height).toLocaleString()}px²
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Indicateur de dessin */}
            {isDrawing && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Tracez votre zone de délimitation
              </div>
            )}
          </div>
        </div>

        {/* Section des boutons */}
        <div className="space-y-4">
          {/* Instructions ou help text */}
          {!currentDelimitation && !isDrawing && (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                <Square className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Aucune zone définie
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Cliquez sur le bouton "Tracer une zone" pour commencer
              </p>
              <Button 
                onClick={enableDrawingMode}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isDrawing}
              >
                <Square className="w-4 h-4 mr-2" />
                Tracer une zone
              </Button>
            </div>
          )}

          {/* Boutons de contrôle */}
          {currentDelimitation && (
            <AnimatePresence mode="wait">
              {editMode === 'consultation' ? (
                <motion.div
                  key="consultation"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center space-x-3"
                >
                  <Button
                    onClick={enterEditMode}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 font-medium"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    onClick={removeDelimitation}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="edition"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center space-x-3"
                >
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="px-6 py-3 font-medium"
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={saveChanges}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder les changements
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 
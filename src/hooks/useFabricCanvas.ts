import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { CanvasState, Delimitation } from '../types/product';
import { toast } from 'sonner';

interface UseFabricCanvasProps {
  imageUrl?: string;
  designImageUrl?: string;
  onDelimitationChange?: (delimitation: Delimitation | null) => void;
  initialDelimitation?: Delimitation;
}

interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  displayWidth: number;
  displayHeight: number;
}

export const useFabricCanvas = ({
  imageUrl,
  designImageUrl,
  onDelimitationChange,
  initialDelimitation
}: UseFabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    canvas: null,
    delimitation: null,
    isDragging: false,
    isDrawing: false
  });

  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  const currentDelimitationRef = useRef<fabric.Rect | null>(null);
  const designImageRef = useRef<fabric.Image | null>(null);
  const imageMetricsRef = useRef<ImageMetrics | null>(null);
  const initialDelimitationAddedRef = useRef(false);
  const lastInitialDelimitationIdRef = useRef<string | null>(null);

  // Convert canvas coordinates to real image coordinates
  const convertToRealImageCoordinates = useCallback((canvasDelimitation: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  }) => {
    const metrics = imageMetricsRef.current;
    if (!metrics) {
      console.warn('Image metrics not available for coordinate conversion');
      return canvasDelimitation;
    }
    const realX = (canvasDelimitation.x - metrics.canvasOffsetX) / metrics.canvasScale;
    const realY = (canvasDelimitation.y - metrics.canvasOffsetY) / metrics.canvasScale;
    const realWidth = (canvasDelimitation.width * (canvasDelimitation.scaleX || 1)) / metrics.canvasScale;
    const realHeight = (canvasDelimitation.height * (canvasDelimitation.scaleY || 1)) / metrics.canvasScale;
    return {
      x: realX,
      y: realY,
      width: realWidth,
      height: realHeight,
      rotation: canvasDelimitation.rotation || 0
    };
  }, []);

  // Convert real image coordinates to canvas coordinates
  const convertToCanvasCoordinates = useCallback((realDelimitation: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }) => {
    const metrics = imageMetricsRef.current;
    if (!metrics) {
      console.warn('Image metrics not available for coordinate conversion');
      return realDelimitation;
    }
    const canvasX = (realDelimitation.x * metrics.canvasScale) + metrics.canvasOffsetX;
    const canvasY = (realDelimitation.y * metrics.canvasScale) + metrics.canvasOffsetY;
    const canvasWidth = realDelimitation.width * metrics.canvasScale;
    const canvasHeight = realDelimitation.height * metrics.canvasScale;
    return {
      x: canvasX,
      y: canvasY,
      width: canvasWidth,
      height: canvasHeight,
      rotation: realDelimitation.rotation || 0
    };
  }, []);

  // Center and scale design in delimitation
  const centerAndScaleDesignInDelimitation = useCallback(() => {
    const delimRect = currentDelimitationRef.current;
    const designImg = designImageRef.current;
    const canvas = canvasInstanceRef.current;
    if (!delimRect || !designImg || !canvas) return;

    const delimBounds = delimRect.getBoundingRect();
    const delimWidth = delimBounds.width;
    const delimHeight = delimBounds.height;
    const paddingFactor = 0.95;
    const scaleX = (delimWidth / designImg.width!) * paddingFactor;
    const scaleY = (delimHeight / designImg.height!) * paddingFactor;
    const scale = Math.min(scaleX, scaleY);
    const scaledWidth = designImg.width! * scale;
    const scaledHeight = designImg.height! * scale;
    const centerX = delimBounds.left + (delimWidth - scaledWidth) / 2;
    const centerY = delimBounds.top + (delimHeight - scaledHeight) / 2;

    designImg.set({
      scaleX: scale,
      scaleY: scale,
      left: centerX,
      top: centerY,
      selectable: false,
      evented: false,
    });

    canvas.bringToFront(designImg);
    canvas.renderAll();
  }, []);

  // Update delimitation
  const updateDelimitation = useCallback((rect: fabric.Rect, shouldSave: boolean = false) => {
    if (designImageRef.current) {
      setTimeout(() => {
        centerAndScaleDesignInDelimitation();
      }, 10);
    }

    if (!onDelimitationChange) return;

    if (shouldSave) {
      const canvasDelim = {
        x: rect.left || 0,
        y: rect.top || 0,
        width: rect.width || 0,
        height: rect.height || 0,
        rotation: rect.angle || 0,
        scaleX: rect.scaleX || 1,
        scaleY: rect.scaleY || 1
      };
      const realCoords = convertToRealImageCoordinates(canvasDelim);
      const delimitation: Delimitation = {
        id: `delim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        x: realCoords.x,
        y: realCoords.y,
        width: realCoords.width,
        height: realCoords.height,
        rotation: realCoords.rotation,
        scaleX: 1,
        scaleY: 1,
        type: 'rectangle',
      };
      onDelimitationChange(delimitation);
    } else {
      onDelimitationChange(null);
    }
  }, [onDelimitationChange, convertToRealImageCoordinates, centerAndScaleDesignInDelimitation]);

  // Setup integrated event listeners
  const setupIntegratedEventListeners = useCallback((canvas: fabric.Canvas, rect: fabric.Rect, onUpdate?: () => void) => {
    const handleObjectModified = () => {
      if (onUpdate) onUpdate();
      updateDelimitation(rect, false);
    };
    const handleObjectMoving = () => {
      if (onUpdate) onUpdate();
      updateDelimitation(rect, false);
    };
    const handleObjectScaling = () => {
      if (onUpdate) onUpdate();
      updateDelimitation(rect, false);
    };
    const handleObjectRotating = () => {
      if (onUpdate) onUpdate();
      updateDelimitation(rect, false);
    };

    rect.on('modified', handleObjectModified);
    rect.on('moving', handleObjectMoving);
    rect.on('scaling', handleObjectScaling);
    rect.on('rotating', handleObjectRotating);

    return () => {
      rect.off('modified', handleObjectModified);
      rect.off('moving', handleObjectMoving);
      rect.off('scaling', handleObjectScaling);
      rect.off('rotating', handleObjectRotating);
    };
  }, [updateDelimitation]);

  // Save current delimitation
  const saveCurrentDelimitation = useCallback(() => {
    if (currentDelimitationRef.current) {
      updateDelimitation(currentDelimitationRef.current, true);
    }
  }, [updateDelimitation]);

  // Check for unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return !!currentDelimitationRef.current;
  }, []);

  // Clear delimitation
  const clearDelimitation = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (canvas && currentDelimitationRef.current) {
      canvas.remove(currentDelimitationRef.current);
      currentDelimitationRef.current = null;
      setCanvasState(prev => ({ ...prev, delimitation: null }));
      canvas.renderAll();
      if (onDelimitationChange) onDelimitationChange(null);
    }
  }, [onDelimitationChange]);

  // Add delimitation from external source
  const addDelimitation = useCallback((delimitation: Delimitation) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || !imageMetricsRef.current) return;

    if (currentDelimitationRef.current) {
      canvas.remove(currentDelimitationRef.current);
    }

    const canvasCoords = convertToCanvasCoordinates({
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height,
      rotation: delimitation.rotation
    });

    const rect = new fabric.Rect({
      left: canvasCoords.x,
      top: canvasCoords.y,
      width: canvasCoords.width,
      height: canvasCoords.height,
      angle: canvasCoords.rotation,
      fill: 'rgba(59, 130, 246, 0.3)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      cornerColor: '#3b82f6',
      cornerSize: 8,
      transparentCorners: false,
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      rotatingPointOffset: 30
    });

    setupIntegratedEventListeners(canvas, rect);
    canvas.add(rect);
    canvas.setActiveObject(rect);
    currentDelimitationRef.current = rect;
    setCanvasState(prev => ({ ...prev, delimitation: rect }));
    canvas.renderAll();
  }, [convertToCanvasCoordinates, setupIntegratedEventListeners]);

  // Setup drawing mode
  const setupDrawingMode = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return null;

    let isDown = false;
    let origX = 0;
    let origY = 0;
    let rect: fabric.Rect | null = null;

    const handleMouseDown = (e: fabric.IEvent<MouseEvent>) => {
      isDown = true;
      setCanvasState(prev => ({ ...prev, isDragging: true }));
      const pointer = canvas.getPointer(e.e);
      origX = pointer.x;
      origY = pointer.y;
      rect = new fabric.Rect({
        left: origX,
        top: origY,
        width: 0,
        height: 0,
        fill: 'rgba(59, 130, 246, 0.1)',
        stroke: '#3b82f6',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false
      });
      canvas.add(rect);
    };

    const handleMouseMove = (e: fabric.IEvent<MouseEvent>) => {
      if (!isDown || !rect) return;
      const pointer = canvas.getPointer(e.e);
      const width = Math.abs(pointer.x - origX);
      const height = Math.abs(pointer.y - origY);
      rect.set({
        left: Math.min(origX, pointer.x),
        top: Math.min(origY, pointer.y),
        width,
        height
      });
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDown || !rect) return;
      isDown = false;
      setCanvasState(prev => ({ ...prev, isDragging: false, isDrawing: false }));
      canvas.remove(rect);
      if (rect.width! > 20 && rect.height! > 20) {
        if (currentDelimitationRef.current) {
          canvas.remove(currentDelimitationRef.current);
        }
        const finalRect = new fabric.Rect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          fill: 'rgba(59, 130, 246, 0.3)',
          stroke: '#3b82f6',
          strokeWidth: 2,
          cornerColor: '#3b82f6',
          cornerSize: 8,
          transparentCorners: false,
          cornerStyle: 'circle',
          borderColor: '#3b82f6',
          rotatingPointOffset: 30
        });
        setupIntegratedEventListeners(canvas, finalRect);
        canvas.add(finalRect);
        canvas.setActiveObject(finalRect);
        currentDelimitationRef.current = finalRect;
        setCanvasState(prev => ({ ...prev, delimitation: finalRect }));
        canvas.renderAll();
      }
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [setupIntegratedEventListeners]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: '#f8f9fa',
      selection: false
    });
    canvasInstanceRef.current = canvas;
    setCanvasState(prev => ({ ...prev, canvas }));
    return () => {
      canvas.dispose();
      canvasInstanceRef.current = null;
    };
  }, []);

  // Load image when imageUrl changes
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || !imageUrl) return;

    canvas.clear();
    currentDelimitationRef.current = null;
    imageMetricsRef.current = null;
    setCanvasState(prev => ({ ...prev, delimitation: null }));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!canvasInstanceRef.current) return;
      const canvas = canvasInstanceRef.current;
      canvas.clear();
      canvas.backgroundColor = '#f8f9fa';
      const originalWidth = img.width;
      const originalHeight = img.height;
      const fabricImg = new fabric.Image(img);
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const scale = Math.min(canvasWidth / (fabricImg.width || 1), canvasHeight / (fabricImg.height || 1)) * 0.9;
      fabricImg.scale(scale);
      const displayWidth = fabricImg.getScaledWidth();
      const displayHeight = fabricImg.getScaledHeight();
      const offsetX = (canvasWidth - displayWidth) / 2;
      const offsetY = (canvasHeight - displayHeight) / 2;
      fabricImg.set({
        left: offsetX,
        top: offsetY,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        moveCursor: 'default'
      });
      imageMetricsRef.current = {
        originalWidth,
        originalHeight,
        canvasScale: scale,
        canvasOffsetX: offsetX,
        canvasOffsetY: offsetY,
        displayWidth,
        displayHeight
      };
      canvas.add(fabricImg);
      canvas.sendToBack(fabricImg);
      canvas.renderAll();
    };
    img.onerror = () => {
      console.error('Failed to load image');
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Handle initial delimitation
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || !initialDelimitation || !imageMetricsRef.current) return;
    if (initialDelimitationAddedRef.current && lastInitialDelimitationIdRef.current === initialDelimitation.id) return;

    initialDelimitationAddedRef.current = true;
    lastInitialDelimitationIdRef.current = initialDelimitation.id;

    if (currentDelimitationRef.current) {
      canvas.remove(currentDelimitationRef.current);
    }

    const canvasCoords = convertToCanvasCoordinates({
      x: initialDelimitation.x,
      y: initialDelimitation.y,
      width: initialDelimitation.width,
      height: initialDelimitation.height,
      rotation: initialDelimitation.rotation
    });

    const rect = new fabric.Rect({
      left: canvasCoords.x,
      top: canvasCoords.y,
      width: canvasCoords.width,
      height: canvasCoords.height,
      angle: canvasCoords.rotation,
      fill: 'rgba(59, 130, 246, 0.3)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      cornerColor: '#3b82f6',
      cornerSize: 8,
      transparentCorners: false,
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      rotatingPointOffset: 30
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    currentDelimitationRef.current = rect;
    setCanvasState(prev => ({ ...prev, delimitation: rect }));
    canvas.renderAll();
  }, [initialDelimitation?.id, convertToCanvasCoordinates]);

  // Enable drawing mode
  const enableDrawingMode = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    setCanvasState(prev => ({ ...prev, isDrawing: true }));
    return setupDrawingMode();
  }, [setupDrawingMode]);

  // Disable drawing mode
  const disableDrawingMode = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    setCanvasState(prev => ({ ...prev, isDrawing: false }));
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
  }, []);

  // Get current delimitation data
  const getCurrentDelimitationData = useCallback((): Delimitation | null => {
    const rect = currentDelimitationRef.current;
    if (!rect) return null;
    const canvasCoords = {
      x: rect.left || 0,
      y: rect.top || 0,
      width: rect.width || 0,
      height: rect.height || 0,
      rotation: rect.angle || 0,
      scaleX: rect.scaleX || 1,
      scaleY: rect.scaleY || 1
    };
    const realCoords = convertToRealImageCoordinates(canvasCoords);
    return {
      id: `delim_${Date.now()}`,
      x: realCoords.x,
      y: realCoords.y,
      width: realCoords.width,
      height: realCoords.height,
      rotation: realCoords.rotation,
      type: 'rectangle'
    };
  }, [convertToRealImageCoordinates]);

  // Get image metrics
  const getImageMetrics = useCallback(() => {
    return imageMetricsRef.current;
  }, []);

  // Center design in delimitation
  const centerDesignInDelimitation = useCallback((designImageUrl: string) => {
    const canvas = canvasInstanceRef.current;
    const delimitation = currentDelimitationRef.current;
    if (!canvas || !delimitation) return;

    fabric.Image.fromURL(designImageUrl, (img) => {
      if (!img || !canvas || !delimitation) return;
      const delimBounds = delimitation.getBoundingRect();
      const scale = Math.min(
        delimBounds.width / (img.width || 1),
        delimBounds.height / (img.height || 1)
      ) * 0.8;
      img.scale(scale);
      img.set({
        left: delimBounds.left + (delimBounds.width - img.getScaledWidth()) / 2,
        top: delimBounds.top + (delimBounds.height - img.getScaledHeight()) / 2,
        selectable: true
      });
      canvas.add(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  }, []);

  // Simulate real design placement
  const simulateRealDesignPlacement = useCallback((designImageUrl: string, designDimensions: { width: number; height: number }) => {
    const canvas = canvasInstanceRef.current;
    const delimitation = currentDelimitationRef.current;
    const metrics = imageMetricsRef.current;
    if (!canvas || !delimitation || !metrics) return null;

    const canvasCoords = {
      x: delimitation.left || 0,
      y: delimitation.top || 0,
      width: delimitation.width || 0,
      height: delimitation.height || 0,
      scaleX: delimitation.scaleX || 1,
      scaleY: delimitation.scaleY || 1
    };

    const realDelimCoords = convertToRealImageCoordinates(canvasCoords);
    const realDesignPlacement = {
      centerX: realDelimCoords.x + (realDelimCoords.width / 2),
      centerY: realDelimCoords.y + (realDelimCoords.height / 2),
      left: realDelimCoords.x + (realDelimCoords.width - designDimensions.width) / 2,
      top: realDelimCoords.y + (realDelimCoords.height - designDimensions.height) / 2,
      right: realDelimCoords.x + (realDelimCoords.width + designDimensions.width) / 2,
      bottom: realDelimCoords.y + (realDelimCoords.height + designDimensions.height) / 2
    };

    const canvasDesignPlacement = convertToCanvasCoordinates({
      x: realDesignPlacement.left,
      y: realDesignPlacement.top,
      width: designDimensions.width,
      height: designDimensions.height
    });

    fabric.Image.fromURL(designImageUrl, (img) => {
      if (!img || !canvas) return;
      const scaleX = canvasDesignPlacement.width / (img.width || 1);
      const scaleY = canvasDesignPlacement.height / (img.height || 1);
      img.set({
        left: canvasDesignPlacement.x,
        top: canvasDesignPlacement.y,
        scaleX,
        scaleY,
        selectable: true
      });
      canvas.add(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });

    return realDesignPlacement;
  }, [convertToRealImageCoordinates, convertToCanvasCoordinates]);

  // Export canvas
  const exportCanvas = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return null;
    return canvas.toDataURL({ format: 'png', quality: 1 });
  }, []);

  // Remove delimitation
  const removeDelimitation = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    const rect = currentDelimitationRef.current;
    if (!canvas || !rect) return;
    canvas.remove(rect);
    currentDelimitationRef.current = null;
    setCanvasState(prev => ({ ...prev, delimitation: null }));
    if (onDelimitationChange) onDelimitationChange(null);
    canvas.renderAll();
  }, [onDelimitationChange]);

  // Load design image
  const loadDesignImage = useCallback((url: string) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    if (designImageRef.current) {
      canvas.remove(designImageRef.current);
      designImageRef.current = null;
    }

    fabric.Image.fromURL(url, (img) => {
      if (!img) {
        toast.error("Impossible de charger l'image du design. Vérifiez l'URL ou le fichier.");
        return;
      }
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas) return;

      img.set({
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      });

      designImageRef.current = img;
      currentCanvas.add(img);

      if (currentDelimitationRef.current) {
        centerAndScaleDesignInDelimitation();
      } else {
        const canvasCenter = {
          x: currentCanvas.getWidth() / 2,
          y: currentCanvas.getHeight() / 2
        };
        img.set({
          left: canvasCenter.x - (img.width! / 2),
          top: canvasCenter.y - (img.height! / 2),
        });
        currentCanvas.renderAll();
      }
    }, { crossOrigin: 'anonymous' });
  }, [centerAndScaleDesignInDelimitation]);

  // Remove design image
  const removeDesignImage = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || !designImageRef.current) return;
    canvas.remove(designImageRef.current);
    designImageRef.current = null;
    canvas.renderAll();
  }, []);

  // Load design from file
  const loadDesignFromFile = useCallback((file: File) => {
    if (designImageRef.current?.getSrc()?.startsWith('blob:')) {
      URL.revokeObjectURL(designImageRef.current.getSrc());
    }
    const objectUrl = URL.createObjectURL(file);
    loadDesignImage(objectUrl);
    return objectUrl;
  }, [loadDesignImage]);

  // Handle design image URL changes
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    if (designImageUrl) {
      loadDesignImage(designImageUrl);
    } else {
      removeDesignImage();
    }
    return () => {
      if (designImageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(designImageUrl);
      }
    };
  }, [designImageUrl, loadDesignImage, removeDesignImage]);

  // Export final image
  const exportFinalImage = useCallback(async (): Promise<string | null> => {
    const metrics = imageMetricsRef.current;
    const delimData = getCurrentDelimitationData();
    const designImgSrc = designImageRef.current?.getSrc();
    if (!metrics || !imageUrl) {
      toast.error("L'image de base n'est pas chargée. Impossible d'exporter.");
      return null;
    }

    toast.info("Génération de l'image finale en cours...");

    try {
      const staticCanvas = new fabric.StaticCanvas(null, {
        width: metrics.originalWidth,
        height: metrics.originalHeight,
      });

      const backgroundImage = await new Promise<fabric.Image>((resolve, reject) => {
        fabric.Image.fromURL(imageUrl, (img) => {
          if (!img) reject(new Error("Échec du chargement de l'image de base"));
          else resolve(img);
        }, { crossOrigin: 'anonymous' });
      });

      staticCanvas.setBackgroundImage(backgroundImage, staticCanvas.renderAll.bind(staticCanvas), {
        scaleX: staticCanvas.getWidth() / backgroundImage.width!,
        scaleY: staticCanvas.getHeight() / backgroundImage.height!,
      });

      if (designImgSrc && delimData) {
        const designImage = await new Promise<fabric.Image>((resolve, reject) => {
          fabric.Image.fromURL(designImgSrc, (img) => {
            if (!img) reject(new Error("Échec du chargement de l'image du design"));
            else resolve(img);
          }, { crossOrigin: 'anonymous' });
        });

        const paddingFactor = 0.95;
        const scale = Math.min(
          (delimData.width / designImage.width!) * paddingFactor,
          (delimData.height / designImage.height!) * paddingFactor
        );
        const scaledW = designImage.width! * scale;
        const scaledH = designImage.height! * scale;
        const left = delimData.x + (delimData.width - scaledW) / 2;
        const top = delimData.y + (delimData.height - scaledH) / 2;

        designImage.set({
          left,
          top,
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top',
        });

        staticCanvas.add(designImage);
      } else if (designImgSrc) {
        toast("Un design est présent mais aucune zone n'a été définie. Le design ne sera pas exporté.", {
          style: { background: '#fbbf24', color: '#1f2937' },
        });
      }

      staticCanvas.renderAll();
      const dataUrl = staticCanvas.toDataURL({ format: 'png', quality: 1 });
      toast.success("L'image finale a été générée avec succès !");
      return dataUrl;
    } catch (error: any) {
      toast.error(`Erreur lors de l'export: ${error.message}`);
      return null;
    }
  }, [imageUrl, getCurrentDelimitationData]);

  // Lock/unlock delimitation
  useEffect(() => {
    const delimRect = canvasState.delimitation;
    const canvas = canvasInstanceRef.current;
    if (delimRect && canvas) {
      const isLocked = !!designImageUrl;
      delimRect.set({
        lockMovementX: isLocked,
        lockMovementY: isLocked,
        lockScalingX: isLocked,
        lockScalingY: isLocked,
        lockRotation: isLocked,
        hasControls: !isLocked,
        borderColor: isLocked ? '#94a3b8' : '#3b82f6',
        cornerColor: isLocked ? '#94a3b8' : '#3b82f6',
        fill: isLocked ? 'rgba(148, 163, 184, 0.2)' : 'rgba(59, 130, 246, 0.3)',
      });
      delimRect.selectable = !isLocked;
      canvas.renderAll();
    }
  }, [designImageUrl, canvasState.delimitation]);

  return {
    canvasRef,
    canvasState,
    canvas: canvasInstanceRef.current,
    delimitation: currentDelimitationRef.current,
    designImage: designImageRef.current,
    isDrawing: canvasState.isDrawing,
    enableDrawingMode,
    disableDrawingMode,
    saveCurrentDelimitation,
    getCurrentDelimitationData,
    hasUnsavedChanges,
    clearDelimitation,
    addDelimitation,
    removeDelimitation,
    getImageMetrics,
    convertToRealImageCoordinates,
    convertToCanvasCoordinates,
    centerDesignInDelimitation,
    simulateRealDesignPlacement,
    exportCanvas,
    loadDesignImage,
    loadDesignFromFile,
    removeDesignImage,
    exportFinalImage,
  };
};

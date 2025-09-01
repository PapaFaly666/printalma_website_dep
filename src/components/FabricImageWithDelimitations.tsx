import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Delimitation } from '../services/delimitationService';

interface FabricImageWithDelimitationsProps {
  imageUrl: string;
  delimitations: Delimitation[];
  className?: string;
  width?: number;
  height?: number;
}

const FabricImageWithDelimitations: React.FC<FabricImageWithDelimitationsProps> = ({
  imageUrl,
  delimitations,
  className = '',
  width = 600,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const imageObjectRef = useRef<fabric.Image | null>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);

  // Debug des props au montage
  console.log('🚀 FABRIC DISPLAY - Composant monté avec props:', {
    imageUrl,
    delimitationsCount: delimitations.length,
    delimitations,
    dimensions: { width, height },
    className
  });

  // Initialiser le canvas Fabric.js en mode lecture seule
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

      // Créer le canvas Fabric en mode lecture seule
      const canvas = new fabric.Canvas(canvasElement, {
        width: width,
        height: height,
        backgroundColor: '#f8f9fa',
        selection: false,
        renderOnAddRemove: true,
        preserveObjectStacking: true,
        allowTouchScrolling: true,
        interactive: false,
        enableRetinaScaling: false // Ajouter pour éviter les problèmes de scaling
      });

      // Vérifier que le canvas est bien créé
      if (!canvas || !canvas.getContext()) {
        console.error('Failed to create fabric canvas');
        return;
      }

      // Désactiver toutes les interactions
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
      canvas.moveCursor = 'default';

      fabricCanvasRef.current = canvas;

      // Charger l'image de manière sécurisée
      if (imageUrl) {
        console.log('🔄 FABRIC DISPLAY - Tentative de chargement image:', imageUrl);
        
        fabric.Image.fromURL(imageUrl, (img) => {
          // Vérifications de sécurité
          if (!img || !canvas || !fabricCanvasRef.current) {
            console.warn('❌ FABRIC DISPLAY - Image load failed or canvas disposed');
            
            // Essayer de charger une image de test
            console.log('🔄 FABRIC DISPLAY - Tentative avec image de test...');
            loadTestImage(canvas);
            return;
          }

          console.log('✅ FABRIC DISPLAY - Image chargée avec succès:', {
            width: img.width,
            height: img.height,
            src: img.getSrc()
          });

          setupImage(canvas, img);
        }, {
          crossOrigin: 'anonymous'
        });
      } else {
        console.warn('⚠️ FABRIC DISPLAY - Pas d\'URL d\'image fournie, chargement image de test');
        loadTestImage(canvas);
      }

      return canvas;
    } catch (error) {
      console.error('Error initializing fabric canvas:', error);
      return null;
    }
  }, [imageUrl, width, height]);

  // Fonction pour configurer l'image
  const setupImage = (canvas: fabric.Canvas, img: fabric.Image) => {
    try {
      // Calculer les dimensions pour fit dans le canvas
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;

      console.log('📐 FABRIC DISPLAY - Dimensions:', {
        canvas: { width: canvasWidth, height: canvasHeight },
        image: { width: imgWidth, height: imgHeight }
      });

      const scaleX = (canvasWidth - 20) / imgWidth;
      const scaleY = (canvasHeight - 20) / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      const left = (canvasWidth - imgWidth * scale) / 2;
      const top = (canvasHeight - imgHeight * scale) / 2;

      img.set({
        left: left,
        top: top,
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

      console.log('🎯 FABRIC DISPLAY - Image configurée:', {
        position: { left, top },
        scale: scale,
        finalSize: { width: imgWidth * scale, height: imgHeight * scale }
      });

      canvas.add(img);
      canvas.sendToBack(img);
      imageObjectRef.current = img;
      
      // Forcer le rendu
      canvas.renderAll();
      setImageLoaded(true);

      console.log('✅ FABRIC DISPLAY - Image ajoutée au canvas, objets:', canvas.getObjects().length);
    } catch (error) {
      console.error('❌ FABRIC DISPLAY - Error setting up image:', error);
    }
  };

  // Fonction pour charger une image de test
  const loadTestImage = (canvas: fabric.Canvas) => {
    console.log('🧪 FABRIC DISPLAY - Création image de test...');
    
    // Créer un rectangle coloré comme image de test
    const testRect = new fabric.Rect({
      left: 50,
      top: 50,
      width: canvas.getWidth() - 100,
      height: canvas.getHeight() - 100,
      fill: '#e0e7ff',
      stroke: '#6366f1',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    // Ajouter du texte
    const testText = new fabric.Text('Image de test\n(Image principale indisponible)', {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      fontSize: 16,
      fill: '#6366f1',
      fontFamily: 'Arial',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });

    canvas.add(testRect, testText);
    
    // Créer un objet image fictif pour les délimitations
    imageObjectRef.current = {
      left: 50,
      top: 50,
      width: canvas.getWidth() - 100,
      height: canvas.getHeight() - 100,
      scaleX: 1,
      scaleY: 1
    } as any;

    canvas.renderAll();
    setImageLoaded(true);
    
    console.log('✅ FABRIC DISPLAY - Image de test créée');
  };

  // Afficher les délimitations sur le canvas
  const displayDelimitations = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const imageObj = imageObjectRef.current;
    
    console.log('🔄 FABRIC DISPLAY - displayDelimitations appelée:', {
      canvas: !!canvas,
      imageObj: !!imageObj,
      imageLoaded,
      delimitationsCount: delimitations.length
    });
    
    if (!canvas || !imageObj || !imageLoaded) {
      console.warn('⚠️ FABRIC DISPLAY - Canvas or image not ready for delimitations display');
      return;
    }

    console.log('📋 FABRIC DISPLAY - Délimitations à afficher:', delimitations);

    try {
      // Supprimer les anciennes délimitations
      const objects = canvas.getObjects();
      console.log('🧹 FABRIC DISPLAY - Objets avant nettoyage:', objects.length);
      
      objects.forEach(obj => {
        if (obj.type === 'rect' && (obj as any).isDelimitation) {
          canvas.remove(obj);
        }
        if (obj.type === 'text' && (obj as any).isDelimitationLabel) {
          canvas.remove(obj);
        }
      });

      console.log('🧹 FABRIC DISPLAY - Objets après nettoyage:', canvas.getObjects().length);

      // Ajouter les nouvelles délimitations
      delimitations.forEach((delimitation, index) => {
        console.log(`➕ FABRIC DISPLAY - Ajout délimitation ${index + 1}/${delimitations.length}:`, delimitation);
        displayDelimitation(delimitation);
      });

      console.log('🎨 FABRIC DISPLAY - Objets après ajout des délimitations:', canvas.getObjects().length);

      // Rendu sécurisé
      if (canvas && canvas.getContext()) {
        canvas.renderAll();
        console.log('✅ FABRIC DISPLAY - Rendu final effectué');
      } else {
        console.warn('⚠️ FABRIC DISPLAY - Pas de contexte pour le rendu');
      }
    } catch (error) {
      console.error('❌ FABRIC DISPLAY - Error displaying delimitations:', error);
    }
  }, [delimitations, imageLoaded]);

  // Afficher une délimitation individuelle
  const displayDelimitation = (delimitation: Delimitation) => {
    const canvas = fabricCanvasRef.current;
    const imageObj = imageObjectRef.current;
    
    if (!canvas || !imageObj) {
      console.warn('⚠️ FABRIC DISPLAY - Canvas ou image non disponible pour délimitation');
      return;
    }

    console.log('🎯 FABRIC DISPLAY - Création délimitation:', delimitation);

    // Calculer les coordonnées réelles sur le canvas
    const imgLeft = imageObj.left || 0;
    const imgTop = imageObj.top || 0;
    const imgWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imgHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    const rectLeft = imgLeft + (delimitation.x / 100) * imgWidth;
    const rectTop = imgTop + (delimitation.y / 100) * imgHeight;
    const rectWidth = (delimitation.width / 100) * imgWidth;
    const rectHeight = (delimitation.height / 100) * imgHeight;

    console.log('📐 FABRIC DISPLAY - Calculs délimitation:', {
      id: delimitation.id,
      percentages: { x: delimitation.x, y: delimitation.y, width: delimitation.width, height: delimitation.height },
      pixels: { left: rectLeft, top: rectTop, width: rectWidth, height: rectHeight },
      imageInfo: { left: imgLeft, top: imgTop, width: imgWidth, height: imgHeight }
    });

    // Vérifier que les dimensions sont valides
    if (rectWidth <= 0 || rectHeight <= 0) {
      console.warn('⚠️ FABRIC DISPLAY - Dimensions invalides pour délimitation:', { rectWidth, rectHeight });
      return;
    }

    try {
      // Créer le rectangle (en mode lecture seule)
      const rect = new fabric.Rect({
        left: rectLeft,
        top: rectTop,
        width: rectWidth,
        height: rectHeight,
        fill: 'rgba(59, 130, 246, 0.3)',
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        hoverCursor: 'default',
        moveCursor: 'default'
      });

      // Marquer comme délimitation
      (rect as any).isDelimitation = true;
      (rect as any).delimitationId = delimitation.id;

      console.log('✅ FABRIC DISPLAY - Rectangle créé');

      // Ajouter le texte du nom
      if (delimitation.name) {
        const text = new fabric.Text(delimitation.name, {
          left: rectLeft,
          top: Math.max(5, rectTop - 20),
          fontSize: 12,
          fill: '#3b82f6',
          fontFamily: 'Arial',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: 4
        });
        
        (text as any).isDelimitationLabel = true;
        (text as any).delimitationId = delimitation.id;
        
        canvas.add(text);
        console.log('✅ FABRIC DISPLAY - Texte ajouté:', delimitation.name);
      }

      canvas.add(rect);
      console.log('✅ FABRIC DISPLAY - Délimitation ajoutée au canvas');
    } catch (error) {
      console.error('❌ FABRIC DISPLAY - Erreur création délimitation:', error);
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

  // Affichage des délimitations quand l'image est prête
  useEffect(() => {
    if (imageLoaded && fabricCanvasRef.current) {
      // Petit délai pour s'assurer que tout est prêt
      const timer = setTimeout(() => {
        displayDelimitations();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [displayDelimitations, imageLoaded]);

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white"
      />
      
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
            <p className="text-sm">Chargement de l'image...</p>
            <p className="text-xs mt-1 text-gray-500">URL: {imageUrl}</p>
          </div>
        </div>
      )}

      {imageLoaded && delimitations.length === 0 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Aucune zone de personnalisation définie
        </div>
      )}

      {imageLoaded && delimitations.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {delimitations.length} zone{delimitations.length > 1 ? 's' : ''} de personnalisation
        </div>
      )}

      {/* Debug info en mode développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400 text-center font-mono">
          Debug: Canvas {fabricCanvasRef.current ? 'OK' : 'KO'} | 
          Image {imageLoaded ? 'OK' : 'KO'} | 
          Objects: {fabricCanvasRef.current?.getObjects().length || 0}
        </div>
      )}
    </div>
  );
};

export default FabricImageWithDelimitations; 
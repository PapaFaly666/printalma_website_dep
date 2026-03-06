import React, { useState, useRef, useEffect, useImperativeHandle, useCallback } from 'react';
import {
  Trash2,
  Copy,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  X,
  Search,
  ShoppingBag,
  RotateCw
} from 'lucide-react';
import Button from './ui/Button';
import { useToast } from './ui/use-toast';
import designService from '../services/designService';

// Types pour les éléments
type ElementType = 'text' | 'image';

interface BaseElement {
  id: string;
  type: ElementType;
  x: number;          // Position en % (0-1)
  y: number;          // Position en % (0-1)
  width: number;      // Largeur en pixels
  height: number;     // Hauteur en pixels
  rotation: number;   // Rotation en degrés
  zIndex: number;     // Ordre d'affichage
}

interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  baseFontSize: number;    // Taille de police de base
  baseWidth: number;       // Largeur de base pour calculer le ratio
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  curve: number;           // Courbure du texte (-355 à 355, 0 = pas de courbure)
}

interface ImageElement extends BaseElement {
  type: 'image';
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  // 💰 Informations du design pour le calcul du prix
  designId?: number;
  designPrice?: number;
  designName?: string;
  // 👤 Informations du vendeur du design pour les commissions
  vendorId?: number;
  vendorName?: string;
  vendorShopName?: string;
  vendorCommissionRate?: number; // Taux de commission du vendeur
  // 📤 Informations d'upload pour les images client
  cloudinaryPublicId?: string; // Public ID Cloudinary pour pouvoir supprimer l'image si nécessaire
  isClientUpload?: boolean; // Flag pour distinguer les uploads client des designs vendeur
}

type DesignElement = TextElement | ImageElement;

interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  referenceWidth: number;
  referenceHeight: number;
}

interface ProductDesignEditorProps {
  productImageUrl: string;
  delimitation?: Delimitation;
  onElementsChange?: (elements: DesignElement[]) => void;
  initialElements?: DesignElement[];
  className?: string;
}

export interface ProductDesignEditorRef {
  addText: () => void;
  triggerImageUpload: () => void;
  addVendorDesign: (design: any) => void;
  setElements: (elements: DesignElement[]) => void;
  // Exposition pour l'édition de texte
  getSelectedElement: () => DesignElement | undefined;
  updateTextProperty: (property: string, value: any) => void;
  updateText: (text: string) => void;
  // Exposition du canvas pour l'extraction des données visuelles
  getCanvasElement: () => HTMLDivElement | null;
}

export const FONTS = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { name: 'Impact', value: 'Impact, fantasy' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' }
];

export const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#000080', '#808080', '#C0C0C0', '#FFD700'
];

export const ProductDesignEditor = React.forwardRef<ProductDesignEditorRef, ProductDesignEditorProps>(({
  productImageUrl,
  delimitation,
  onElementsChange,
  initialElements = [],
  className = ''
}, ref) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageRef = useRef<HTMLImageElement>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const elementsRef = useRef<DesignElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, startX: 0, startY: 0, aspectRatio: 0, shiftPressed: false });
  const [rotateStart, setRotateStart] = useState({ angle: 0, startX: 0, startY: 0, centerX: 0, centerY: 0 });
  const [isAtBoundary, setIsAtBoundary] = useState(false);

  // Forcer le re-render quand nécessaire
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const forceUpdate = useCallback(() => setForceUpdateKey(prev => prev + 1), []);

  // 🔧 Fonction utilitaire pour calculer la position en pixels de la délimitation (similaire à SellDesignPage)
  const computeDelimitationPosition = useCallback(() => {
    if (!canvasRef.current || !delimitation) {
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        scaleX: 1,
        scaleY: 1
      };
    }

    const rect = canvasRef.current.getBoundingClientRect();

    // Dimensions de l'image de référence (mockup)
    const imgW = delimitation.referenceWidth || 800;
    const imgH = delimitation.referenceHeight || 800;

    // Dimensions du conteneur
    const contW = rect.width;
    const contH = rect.height;

    if (contW === 0 || contH === 0) {
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        scaleX: 1,
        scaleY: 1
      };
    }

    // Calculer les dimensions d'affichage de l'image avec object-contain
    const imgRatio = imgW / imgH;
    const contRatio = contW / contH;

    let dispW: number, dispH: number, offsetX: number, offsetY: number;

    if (imgRatio > contRatio) {
      // L'image est plus large que le conteneur : elle est limitée par la largeur
      dispW = contW;
      dispH = contW / imgRatio;
      offsetX = 0;
      offsetY = (contH - dispH) / 2;
    } else {
      // L'image est plus haute que le conteneur : elle est limitée par la hauteur
      dispH = contH;
      dispW = contH * imgRatio;
      offsetX = (contW - dispW) / 2;
      offsetY = 0;
    }

    // La délimitation est en coordonnées relatives (0-100 ou pixels)
    // On suppose qu'elle est en pixels (coordonnées absolues par rapport à l'image)
    const isPixel = delimitation.x > 100 || delimitation.y > 100;

    const delimX = isPixel ? delimitation.x : (delimitation.x / 100) * imgW;
    const delimY = isPixel ? delimitation.y : (delimitation.y / 100) * imgH;
    const delimW = isPixel ? delimitation.width : (delimitation.width / 100) * imgW;
    const delimH = isPixel ? delimitation.height : (delimitation.height / 100) * imgH;

    // Calculer les facteurs de scale
    const scaleX = dispW / imgW;
    const scaleY = dispH / imgH;

    return {
      left: offsetX + delimX * scaleX,
      top: offsetY + delimY * scaleY,
      width: delimW * scaleX,
      height: delimH * scaleY,
      scaleX,
      scaleY,
      offsetX,
      offsetY
    };
  }, [delimitation]);

  // 🔧 Fonction utilitaire pour obtenir les paramètres de scaling (scaleX, scaleY, offsetX, offsetY)
  const getScalingParams = useCallback(() => {
    const delimPos = computeDelimitationPosition();

    if (!canvasRef.current || !delimitation) {
      return {
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
        canvasRect: { width: 800, height: 800 }
      };
    }

    const rect = canvasRef.current.getBoundingClientRect();

    return {
      scaleX: delimPos.scaleX,
      scaleY: delimPos.scaleY,
      offsetX: delimPos.offsetX,
      offsetY: delimPos.offsetY,
      canvasRect: rect
    };
  }, [delimitation, computeDelimitationPosition]);

  // Garder la référence à jour
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Forcer le re-render au redimensionnement de la fenêtre pour le responsive
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Debounce pour éviter les appels répétés
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        forceUpdate();
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [forceUpdate]);

  // Mode édition : afficher les délimitations uniquement quand on édite
  const [isEditMode, setIsEditMode] = useState(false);

  // États pour la bibliothèque de designs
  const [showDesignLibrary, setShowDesignLibrary] = useState(false);
  const [vendorDesigns, setVendorDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [designSearch, setDesignSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Element sélectionné
  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Migrer les éléments texte qui n'ont pas les nouveaux champs
  const migrateTextElements = (els: DesignElement[]): DesignElement[] => {
    return els.map(el => {
      if (el.type === 'text') {
        const needsMigration = !el.baseFontSize || !el.baseWidth || el.curve === undefined;
        if (needsMigration) {
          console.log('🔄 [MIGRATION] Text element missing base values, initializing with current values');
          return {
            ...el,
            baseFontSize: el.baseFontSize || el.fontSize,
            baseWidth: el.baseWidth || el.width,
            curve: el.curve ?? 0
          };
        }
      }
      return el;
    });
  };

  // Initialiser les éléments avec migration
  useEffect(() => {
    // Ne initialiser que si on n'a jamais initialisé et qu'il n'y a pas eu de suppression manuelle
    const hasInitializedBefore = elementsRef.current.length > 0 || elements.length > 0;

    if (initialElements.length > 0 && !hasInitializedBefore) {
      console.log('🔄 [ProductDesignEditor] Initialisation avec initialElements:', initialElements.length);

      // 🔍 DEBUG: Vérifier la structure des initialElements
      console.log('🔍 DEBUG - initialElements:', {
        isArray: Array.isArray(initialElements),
        length: initialElements.length,
        firstIsArray: Array.isArray(initialElements[0]),
        firstElement: initialElements[0]
      });

      // 🚨 Corriger le double wrapping si détecté
      let elementsToSet = initialElements;
      if (initialElements.length > 0 && Array.isArray(initialElements[0])) {
        console.warn('⚠️ [ProductDesignEditor] Correction du double wrapping détecté');
        elementsToSet = initialElements[0];
      }

      setElements(migrateTextElements(elementsToSet));
    } else if (initialElements.length > 0 && elements.length === 0) {
      console.log('⚠️ [ProductDesignEditor] Éviter re-initialisation après suppression');
    }
  }, [initialElements]);

  // Ref pour tracker si c'est le premier render
  const isFirstRenderRef = useRef(true);

  // Notifier le parent des changements
  useEffect(() => {
    console.log('🎨 [ProductDesignEditor] elements changed:', elements.length, 'elements');

    // Ne pas notifier au premier render si elements est vide
    if (isFirstRenderRef.current && elements.length === 0) {
      console.log('⏭️ [ProductDesignEditor] Premier render avec 0 éléments, ignoré');
      isFirstRenderRef.current = false;
      return;
    }

    isFirstRenderRef.current = false;
    console.log('📤 [ProductDesignEditor] Notification parent avec', elements.length, 'éléments');
    onElementsChange?.(elements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  // Exposer les méthodes via ref
  useImperativeHandle(ref, () => ({
    addText,
    triggerImageUpload: () => fileInputRef.current?.click(),
    addVendorDesign,
    setElements: (els: DesignElement[]) => setElements(migrateTextElements(els)),
    // Méthodes pour l'édition de texte
    getSelectedElement: () => elements.find(el => el.id === selectedElementId),
    updateTextProperty,
    updateText,
    // Méthode pour obtenir le canvas pour l'extraction
    getCanvasElement: () => canvasRef.current
  }));

  // Générer un ID unique
  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter un texte
  const addText = () => {
    if (!canvasRef.current || !delimitation) return;

    const delimPos = computeDelimitationPosition();
    const rect = canvasRef.current.getBoundingClientRect();

    // Position centrée dans la délimitation
    const centerX = (delimPos.left + delimPos.width / 2) / rect.width;
    const centerY = (delimPos.top + delimPos.height / 2) / rect.height;

    const newText: TextElement = {
      id: generateId(),
      type: 'text',
      text: 'Votre texte',
      x: centerX,
      y: centerY,
      width: 300,            // Augmenté de 150 à 300
      height: 80,            // Augmenté de 40 à 80
      rotation: 0,
      fontSize: 48,          // Augmenté de 24 à 48
      baseFontSize: 48,      // Taille de police de base augmentée
      baseWidth: 300,        // Largeur de base augmentée
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      curve: 0,              // Pas de courbure par défaut
      zIndex: elements.length
    };

    console.log('➕ [ProductDesignEditor] Ajout texte, avant:', elements.length, '→ après:', elements.length + 1);
    setElements([...elements, newText]);
    setSelectedElementId(newText.id);
    setIsEditMode(true); // Activer le mode édition lors de l'ajout
    console.log('✅ [ProductDesignEditor] Texte ajouté:', newText.id);
  };

  // Ajouter une image
  const addImage = (
    imageUrl: string,
    naturalWidth: number,
    naturalHeight: number,
    designId?: number,
    designPrice?: number,
    designName?: string,
    cloudinaryPublicId?: string // 🆕 Public ID pour les images uploadées
  ) => {
    if (!canvasRef.current || !delimitation) return;

    const delimPos = computeDelimitationPosition();
    const { scaleX, scaleY, canvasRect: rect } = getScalingParams();

    // Calculer la taille optimale pour l'image
    const maxWidth = delimPos.width * 0.95;  // Augmenté à 0.95 (95% de la délimitation)
    const maxHeight = delimPos.height * 0.95; // Augmenté à 0.95
    const aspectRatio = naturalWidth / naturalHeight;

    let imageWidth = maxWidth;
    let imageHeight = maxWidth / aspectRatio;

    if (imageHeight > maxHeight) {
      imageHeight = maxHeight;
      imageWidth = maxHeight * aspectRatio;
    }

    console.log('📐 [ProductDesignEditor] Calcul taille image:', {
      delimPos,
      maxWidth,
      maxHeight,
      naturalWidth,
      naturalHeight,
      aspectRatio,
      calculatedImageWidth: imageWidth,
      calculatedImageHeight: imageHeight,
      pourcentageWidth: (imageWidth / delimPos.width * 100).toFixed(1) + '%',
      pourcentageHeight: (imageHeight / delimPos.height * 100).toFixed(1) + '%'
    });

    const centerX = (delimPos.left + delimPos.width / 2) / rect.width;
    const centerY = (delimPos.top + delimPos.height / 2) / rect.height;

    // IMPORTANT: Normaliser les dimensions (diviser par scaleX/scaleY car elles seront re-multipliées au rendu)
    const normalizedWidth = imageWidth / scaleX;
    const normalizedHeight = imageHeight / scaleY;

    console.log('🔄 [ProductDesignEditor] Normalisation dimensions:', {
      imageWidth,
      imageHeight,
      scaleX,
      scaleY,
      normalizedWidth,
      normalizedHeight
    });

    const newImage: ImageElement = {
      id: generateId(),
      type: 'image',
      imageUrl,
      x: centerX,
      y: centerY,
      width: normalizedWidth,  // Utiliser les dimensions normalisées
      height: normalizedHeight, // Utiliser les dimensions normalisées
      rotation: 0,
      naturalWidth,
      naturalHeight,
      zIndex: elements.length,
      // 💰 Ajouter les informations du design pour le calcul du prix
      designId,
      designPrice,
      designName,
      // 📤 Ajouter les informations d'upload client
      cloudinaryPublicId,
      isClientUpload: !!cloudinaryPublicId // Flag automatique si publicId présent
    };

    console.log('🎨 [ProductDesignEditor] Ajout image:', {
      designId,
      designPrice,
      designName,
      isClientUpload: newImage.isClientUpload,
      cloudinaryPublicId
    });

    setElements([...elements, newImage]);
    setSelectedElementId(newImage.id);
    setIsEditMode(true); // Activer le mode édition lors de l'ajout
  };

  // Charger les designs vendeur
  const loadVendorDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const result = await designService.getPublicDesigns({
        limit: 50
      });
      setVendorDesigns(result.designs || []);
      setShowDesignLibrary(true);
    } catch (err) {
      console.error('Erreur chargement designs:', err);
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Ajouter un design vendeur au canvas
  const addVendorDesign = (design: any) => {
    const img = new Image();
    img.onload = () => {
      console.log('💰 [ProductDesignEditor] Ajout design vendeur:', {
        id: design.id,
        name: design.name,
        price: design.price
      });
      addImage(
        design.imageUrl,
        img.naturalWidth,
        img.naturalHeight,
        design.id,        // designId
        design.price,     // designPrice
        design.name       // designName
      );
      setShowDesignLibrary(false);
    };
    img.src = design.imageUrl;
  };

  // Contraindre la position dans la délimitation (en tenant compte de la rotation)
  const constrainToBounds = (element: DesignElement, newX: number, newY: number): { x: number; y: number } => {
    if (!canvasRef.current || !delimitation) return { x: newX, y: newY };

    const delimPos = computeDelimitationPosition();
    const { scaleX, scaleY, canvasRect: rect } = getScalingParams();

    // Limites de la délimitation en pixels
    const boundsX = delimPos.left;
    const boundsY = delimPos.top;
    const boundsWidth = delimPos.width;
    const boundsHeight = delimPos.height;
    const boundsRight = boundsX + boundsWidth;
    const boundsBottom = boundsY + boundsHeight;

    // Dimensions responsive de l'élément
    const responsiveWidth = element.width * scaleX;
    const responsiveHeight = element.height * scaleY;

    // Position proposée en pixels
    const proposedCenterX = newX * rect.width;
    const proposedCenterY = newY * rect.height;

    // Rotation en radians
    const rotationRad = (element.rotation * Math.PI) / 180;
    const halfWidth = responsiveWidth / 2;
    const halfHeight = responsiveHeight / 2;

    // Calculer les 4 coins de l'élément tourné
    const calculateRotatedCorners = (centerX: number, centerY: number) => {
      const corners = [
        { x: -halfWidth, y: -halfHeight }, // Top-left
        { x: halfWidth, y: -halfHeight },  // Top-right
        { x: halfWidth, y: halfHeight },   // Bottom-right
        { x: -halfWidth, y: halfHeight }   // Bottom-left
      ];

      return corners.map(corner => {
        // Appliquer la rotation au coin
        const rotatedX = corner.x * Math.cos(rotationRad) - corner.y * Math.sin(rotationRad);
        const rotatedY = corner.x * Math.sin(rotationRad) + corner.y * Math.cos(rotationRad);

        return {
          x: centerX + rotatedX,
          y: centerY + rotatedY
        };
      });
    };

    // Vérifier si tous les coins sont dans la délimitation
    const areAllCornersInside = (centerX: number, centerY: number): boolean => {
      const corners = calculateRotatedCorners(centerX, centerY);

      for (const corner of corners) {
        if (corner.x < boundsX || corner.x > boundsRight ||
            corner.y < boundsY || corner.y > boundsBottom) {
          return false;
        }
      }

      return true;
    };

    // Si pas de rotation, utiliser la contrainte simple
    if (Math.abs(element.rotation) < 0.5) {
      const constrainedX = Math.max(
        boundsX + halfWidth,
        Math.min(boundsRight - halfWidth, proposedCenterX)
      );
      const constrainedY = Math.max(
        boundsY + halfHeight,
        Math.min(boundsBottom - halfHeight, proposedCenterY)
      );

      return {
        x: constrainedX / rect.width,
        y: constrainedY / rect.height
      };
    }

    // Vérifier d'abord si la position proposée est valide
    if (areAllCornersInside(proposedCenterX, proposedCenterY)) {
      return { x: newX, y: newY };
    }

    // La position proposée fait sortir l'élément
    // Trouver la position maximale le long du vecteur de déplacement
    const currentCenterX = element.x * rect.width;
    const currentCenterY = element.y * rect.height;

    const deltaX = proposedCenterX - currentCenterX;
    const deltaY = proposedCenterY - currentCenterY;

    // Si on n'a pas bougé, retourner la position actuelle
    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return { x: element.x, y: element.y };
    }

    // Recherche dichotomique pour trouver la position maximale
    let minRatio = 0;
    let maxRatio = 1;
    let bestX = currentCenterX;
    let bestY = currentCenterY;

    for (let i = 0; i < 25; i++) {
      const midRatio = (minRatio + maxRatio) / 2;
      const testX = currentCenterX + deltaX * midRatio;
      const testY = currentCenterY + deltaY * midRatio;

      if (areAllCornersInside(testX, testY)) {
        // Cette position est valide, on peut aller plus loin
        minRatio = midRatio;
        bestX = testX;
        bestY = testY;
      } else {
        // Cette position fait sortir, il faut reculer
        maxRatio = midRatio;
      }

      // Convergence atteinte
      if (maxRatio - minRatio < 0.0001) break;
    }

    // Appliquer une marge de sécurité de 99%
    const finalX = currentCenterX + (bestX - currentCenterX) * 0.99;
    const finalY = currentCenterY + (bestY - currentCenterY) * 0.99;

    console.log('🔲 [DRAG CONSTRAINT]', {
      rotation: element.rotation.toFixed(1) + '°',
      requested: `(${proposedCenterX.toFixed(0)}, ${proposedCenterY.toFixed(0)})`,
      constrained: `(${finalX.toFixed(0)}, ${finalY.toFixed(0)})`,
      ratio: (minRatio * 100).toFixed(1) + '%'
    });

    return {
      x: finalX / rect.width,
      y: finalY / rect.height
    };
  };

  // Contraindre la courbure du texte pour qu'il reste dans la délimitation
  const constrainCurveToBounds = (element: TextElement, newCurve: number): number => {
    if (!canvasRef.current || !delimitation) return newCurve;

    const delimPos = computeDelimitationPosition();
    const { scaleX, scaleY, canvasRect: rect } = getScalingParams();

    // Position du centre de l'élément en pixels
    const centerX = element.x * rect.width;
    const centerY = element.y * rect.height;

    // Dimensions responsive de l'élément
    const responsiveWidth = element.width * scaleX;
    const responsiveHeight = element.height * scaleY;
    const responsiveFontSize = element.fontSize * scaleX;

    // Limites de la délimitation
    const boundsX = delimPos.left;
    const boundsY = delimPos.top;
    const boundsWidth = delimPos.width;
    const boundsHeight = delimPos.height;

    // Rotation de l'élément en radians
    const rotationRad = (element.rotation * Math.PI) / 180;

    // Marge de sécurité basée sur la taille de police (le texte a besoin d'espace vertical)
    const textMargin = responsiveFontSize * 0.6;

    // Fonction pour vérifier si une courbure fait sortir le texte
    const checkCurveOutOfBounds = (curve: number): boolean => {
      const controlY = responsiveHeight / 2 + (curve * responsiveHeight / 100);

      // Échantillonner beaucoup de points sur la courbe (plus précis)
      for (let t = 0; t <= 1; t += 0.05) {
        // Courbe quadratique Bézier
        const bezierX = (1 - t) * (1 - t) * 0 +
                        2 * (1 - t) * t * (responsiveWidth / 2) +
                        t * t * responsiveWidth;
        const bezierY = (1 - t) * (1 - t) * (responsiveHeight / 2) +
                        2 * (1 - t) * t * controlY +
                        t * t * (responsiveHeight / 2);

        // Vérifier avec marge de sécurité pour la hauteur du texte
        // Le texte peut dépasser au-dessus et en-dessous du chemin
        const checkPoints = [
          { x: bezierX, y: bezierY - textMargin }, // Au-dessus du chemin
          { x: bezierX, y: bezierY },              // Sur le chemin
          { x: bezierX, y: bezierY + textMargin }  // En-dessous du chemin
        ];

        for (const point of checkPoints) {
          // Transformer le point avec rotation
          const relX = point.x - responsiveWidth / 2;
          const relY = point.y - responsiveHeight / 2;

          const rotatedX = relX * Math.cos(rotationRad) - relY * Math.sin(rotationRad);
          const rotatedY = relX * Math.sin(rotationRad) + relY * Math.cos(rotationRad);

          const globalX = centerX + rotatedX;
          const globalY = centerY + rotatedY;

          // Vérifier si le point sort de la délimitation
          if (globalX < boundsX || globalX > boundsX + boundsWidth ||
              globalY < boundsY || globalY > boundsY + boundsHeight) {
            return true;
          }
        }
      }

      return false;
    };

    // Vérifier si la courbure demandée est acceptable
    if (!checkCurveOutOfBounds(newCurve)) {
      return newCurve; // La courbure est OK
    }

    // Si ça sort, chercher la courbure maximale acceptable par dichotomie
    let minCurve = 0;
    let maxCurve = Math.abs(newCurve);
    const curveSign = newCurve >= 0 ? 1 : -1;

    // Recherche dichotomique de la courbure maximale
    for (let iteration = 0; iteration < 20; iteration++) {
      const testCurve = (minCurve + maxCurve) / 2;

      if (checkCurveOutOfBounds(testCurve * curveSign)) {
        maxCurve = testCurve;
      } else {
        minCurve = testCurve;
      }

      if (maxCurve - minCurve < 0.5) break;
    }

    const constrainedCurve = minCurve * curveSign * 0.90; // 10% de marge de sécurité

    console.log('🎨 [CURVE CONSTRAINT]', {
      requested: newCurve.toFixed(0),
      constrained: constrainedCurve.toFixed(0),
      fontSize: responsiveFontSize.toFixed(0),
      textMargin: textMargin.toFixed(0),
      wasConstrained: Math.abs(newCurve - constrainedCurve) > 1
    });

    return Math.round(constrainedCurve);
  };

  // Contraindre le redimensionnement dans la délimitation
  const constrainResizeToBounds = (element: DesignElement, newWidth: number, newHeight: number): { width: number; height: number; isAtBoundary: boolean } => {
    if (!canvasRef.current || !delimitation) return { width: newWidth, height: newHeight, isAtBoundary: false };

    const delimPos = computeDelimitationPosition();
    const { scaleX, scaleY, canvasRect: rect } = getScalingParams();

    // Position du centre de l'élément en pixels écran
    const elementCenterPixelX = element.x * rect.width;
    const elementCenterPixelY = element.y * rect.height;

    // Limites de la délimitation en pixels écran
    const boundsX = delimPos.left;
    const boundsY = delimPos.top;
    const boundsWidth = delimPos.width;
    const boundsHeight = delimPos.height;

    // Nouvelles dimensions en pixels écran (responsive)
    const newWidthResponsive = newWidth * scaleX;
    const newHeightResponsive = newHeight * scaleY;

    // Calculer l'espace disponible depuis le centre de l'élément
    const spaceLeft = elementCenterPixelX - boundsX;
    const spaceRight = (boundsX + boundsWidth) - elementCenterPixelX;
    const spaceTop = elementCenterPixelY - boundsY;
    const spaceBottom = (boundsY + boundsHeight) - elementCenterPixelY;

    // Taille maximale possible (en pixels écran)
    const maxWidthResponsive = Math.min(spaceLeft, spaceRight) * 2;
    const maxHeightResponsive = Math.min(spaceTop, spaceBottom) * 2;

    // Vérifier si on dépasse les limites
    const exceedsWidth = newWidthResponsive > maxWidthResponsive;
    const exceedsHeight = newHeightResponsive > maxHeightResponsive;
    const isAtBoundary = exceedsWidth || exceedsHeight;

    // Contraindre les dimensions (en pixels écran)
    let constrainedWidthResponsive = newWidthResponsive;
    let constrainedHeightResponsive = newHeightResponsive;

    // Pour garder le ratio d'aspect, utiliser la contrainte la plus restrictive
    if (exceedsWidth || exceedsHeight) {
      const scaleByWidth = maxWidthResponsive / newWidthResponsive;
      const scaleByHeight = maxHeightResponsive / newHeightResponsive;
      const finalScale = Math.min(scaleByWidth, scaleByHeight);

      constrainedWidthResponsive = newWidthResponsive * finalScale;
      constrainedHeightResponsive = newHeightResponsive * finalScale;
    }

    // Convertir en dimensions brutes (pixels de référence)
    const constrainedWidth = constrainedWidthResponsive / scaleX;
    const constrainedHeight = constrainedHeightResponsive / scaleY;

    console.log('🔲 [RESIZE CONSTRAINT]', {
      requested: { w: newWidth.toFixed(0), h: newHeight.toFixed(0) },
      requestedResponsive: { w: newWidthResponsive.toFixed(0), h: newHeightResponsive.toFixed(0) },
      maxResponsive: { w: maxWidthResponsive.toFixed(0), h: maxHeightResponsive.toFixed(0) },
      constrained: { w: constrainedWidth.toFixed(0), h: constrainedHeight.toFixed(0) },
      isAtBoundary,
      center: { x: elementCenterPixelX.toFixed(0), y: elementCenterPixelY.toFixed(0) },
      bounds: { x: boundsX.toFixed(0), y: boundsY.toFixed(0), w: boundsWidth.toFixed(0), h: boundsHeight.toFixed(0) }
    });

    return {
      width: Math.max(10, constrainedWidth),
      height: Math.max(10, constrainedHeight),
      isAtBoundary
    };
  };

  // Vérifier si un élément tourné sort de la délimitation
  const checkRotatedElementBounds = (element: DesignElement): boolean => {
    if (!canvasRef.current || !delimitation) return false;

    const delimPos = computeDelimitationPosition();
    const { scaleX, scaleY, canvasRect: rect } = getScalingParams();

    // Position du centre de l'élément en pixels
    const centerX = element.x * rect.width;
    const centerY = element.y * rect.height;

    // Convertir la rotation en radians
    const rotationRad = (element.rotation * Math.PI) / 180;

    // Dimensions responsive de l'élément (cohérent avec l'affichage)
    const responsiveWidth = element.width * scaleX;
    const responsiveHeight = element.height * scaleY;

    // Calculer les 4 coins du rectangle tourné avec dimensions responsive
    const halfWidth = responsiveWidth / 2;
    const halfHeight = responsiveHeight / 2;

    const corners = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight }
    ];

    // Appliquer la rotation à chaque coin
    const rotatedCorners = corners.map(corner => ({
      x: centerX + (corner.x * Math.cos(rotationRad) - corner.y * Math.sin(rotationRad)),
      y: centerY + (corner.x * Math.sin(rotationRad) + corner.y * Math.cos(rotationRad))
    }));

    // Limites de la délimitation en pixels
    const boundsX = delimPos.left;
    const boundsY = delimPos.top;
    const boundsWidth = delimPos.width;
    const boundsHeight = delimitation.height * scaleY;

    // Vérifier si un des coins sort de la délimitation
    const isOutOfBounds = rotatedCorners.some(corner =>
      corner.x < boundsX ||
      corner.x > boundsX + boundsWidth ||
      corner.y < boundsY ||
      corner.y > boundsY + boundsHeight
    );

    return isOutOfBounds;
  };

  // Trouver la rotation maximale qui garde l'élément dans la délimitation
  const constrainRotationToBounds = (element: DesignElement, targetRotation: number): number => {
    if (!canvasRef.current || !delimitation) return targetRotation;

    // Créer un élément temporaire avec la rotation cible
    const testElement = { ...element, rotation: targetRotation };

    // Si ça rentre, on retourne la rotation demandée
    if (!checkRotatedElementBounds(testElement)) {
      return targetRotation;
    }

    console.log('🔄 [ROTATION CONSTRAINT] Target rotation causes out of bounds:', targetRotation.toFixed(0));

    // Sinon, chercher la rotation la plus proche qui rentre par dichotomie
    // On teste dans les deux directions (horaire et anti-horaire)
    const originalRotation = element.rotation;

    // Normaliser les angles entre 0 et 360
    const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;
    const normalizedTarget = normalizeAngle(targetRotation);
    const normalizedOriginal = normalizeAngle(originalRotation);

    // Fonction pour tester si une rotation est valide
    const isRotationValid = (rotation: number): boolean => {
      const testEl = { ...element, rotation };
      return !checkRotatedElementBounds(testEl);
    };

    // Calculer la direction de rotation (horaire ou anti-horaire)
    let diff = normalizedTarget - normalizedOriginal;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    // Recherche dichotomique
    let bestRotation = normalizedOriginal;

    if (Math.abs(diff) > 1) {
      for (let iteration = 0; iteration < 25; iteration++) {
        const testRotation = normalizedOriginal + (diff / 2);

        if (isRotationValid(testRotation)) {
          // Cette rotation est OK, on peut aller plus loin
          bestRotation = testRotation;
          diff = normalizedTarget - testRotation;
        } else {
          // Cette rotation fait sortir, on recule
          diff = testRotation - normalizedOriginal;
        }

        if (Math.abs(diff) < 1) break; // Convergence atteinte
      }
    }

    // Appliquer une petite marge de sécurité (98% de la rotation max)
    const finalRotation = normalizedOriginal + (bestRotation - normalizedOriginal) * 0.98;

    console.log('🔄 [ROTATION CONSTRAINT]', {
      original: originalRotation.toFixed(0),
      requested: targetRotation.toFixed(0),
      constrained: finalRotation.toFixed(0),
      wasConstrained: Math.abs(targetRotation - finalRotation) > 2
    });

    return finalRotation;
  };

  // Début du drag
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElementId(elementId);
    setIsEditMode(true); // Activer le mode édition
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y
    });
  };

  // Déplacement
  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current) return;

    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    const rect = canvasRef.current.getBoundingClientRect();

    // Déplacement
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) / rect.width;
      const deltaY = (e.clientY - dragStart.y) / rect.height;

      const newX = dragStart.elementX + deltaX;
      const newY = dragStart.elementY + deltaY;

      // Appliquer la contrainte
      const constrained = constrainToBounds(element, newX, newY);

      // Créer l'élément avec la nouvelle position pour vérifier les limites
      const movedElement = { ...element, x: constrained.x, y: constrained.y };
      const isOutOfBounds = checkRotatedElementBounds(movedElement);
      setIsAtBoundary(isOutOfBounds);

      setElements(elements.map(el => {
        if (el.id === selectedElementId) {
          // Si c'est un texte avec courbure, re-contraindre la courbure après déplacement
          if (el.type === 'text' && el.curve !== 0) {
            const newElement = { ...el, x: constrained.x, y: constrained.y };
            const constrainedCurve = constrainCurveToBounds(newElement, el.curve);
            return { ...newElement, curve: constrainedCurve };
          }
          return { ...el, x: constrained.x, y: constrained.y };
        }
        return el;
      }));
    }

    // Redimensionnement - TOUJOURS PROPORTIONNEL AVEC CONTRAINTES
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.startX;
      const deltaY = e.clientY - resizeStart.startY;

      // Utiliser le delta le plus grand (en valeur absolue) pour le scale
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

      // Calculer la nouvelle taille en gardant le ratio d'aspect
      const aspectRatio = resizeStart.width / resizeStart.height;
      let newWidth: number;
      let newHeight: number;

      if (aspectRatio >= 1) {
        // Format paysage ou carré
        newWidth = resizeStart.width + delta;
        newHeight = newWidth / aspectRatio;
      } else {
        // Format portrait
        newHeight = resizeStart.height + delta;
        newWidth = newHeight * aspectRatio;
      }

      // Taille minimale
      newWidth = Math.max(30, newWidth);
      newHeight = Math.max(30, newHeight);

      console.log('🔲 [PROPORTIONNEL] Resize - Delta:', delta.toFixed(0), 'Ratio:', aspectRatio.toFixed(2), 'Size:', newWidth.toFixed(0) + 'x' + newHeight.toFixed(0));

      // 🚨 CONTRAINTE: Ne pas sortir de la délimitation
      const element = elements.find(el => el.id === selectedElementId);
      if (element) {
        const constrained = constrainResizeToBounds(element, newWidth, newHeight);
        newWidth = constrained.width;
        newHeight = constrained.height;

        // Bloquer silencieusement sans afficher de message
        setIsAtBoundary(constrained.isAtBoundary);
      }

      setElements(elements.map(el => {
        if (el.id === selectedElementId) {
          // Pour les éléments texte, ajuster la taille de police proportionnellement
          if (el.type === 'text') {
            const widthRatio = newWidth / el.baseWidth;
            const newFontSize = Math.round(el.baseFontSize * widthRatio);
            console.log('📝 [TEXT SCALE] Width ratio:', widthRatio.toFixed(2), 'Base font:', el.baseFontSize, 'New font:', newFontSize);

            const resizedElement = { ...el, width: newWidth, height: newHeight, fontSize: newFontSize };

            // Si le texte a une courbure, re-contraindre après redimensionnement
            if (el.curve !== 0) {
              const constrainedCurve = constrainCurveToBounds(resizedElement, el.curve);
              return { ...resizedElement, curve: constrainedCurve };
            }

            return resizedElement;
          }
          return { ...el, width: newWidth, height: newHeight };
        }
        return el;
      }));
    }

    // Rotation
    if (isRotating) {
      const centerX = rotateStart.centerX;
      const centerY = rotateStart.centerY;

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const startAngle = Math.atan2(rotateStart.startY - centerY, rotateStart.startX - centerX);
      const deltaAngle = (angle - startAngle) * (180 / Math.PI);

      const newRotation = (rotateStart.angle + deltaAngle) % 360;

      // Récupérer l'élément en cours de rotation
      const element = elements.find(el => el.id === selectedElementId);
      if (!element) return;

      // Contraindre la rotation pour rester dans la délimitation
      const constrainedRotation = constrainRotationToBounds(element, newRotation);

      // Vérifier si on a atteint la limite
      const wasConstrained = Math.abs(newRotation - constrainedRotation) > 2;
      setIsAtBoundary(wasConstrained);

      // Appliquer la rotation contrainte
      const updatedElements = elements.map(el => {
        if (el.id === selectedElementId) {
          const rotatedElement = { ...el, rotation: constrainedRotation };

          // Si c'est un texte avec courbure, re-contraindre la courbure après rotation
          if (rotatedElement.type === 'text' && rotatedElement.curve !== 0) {
            const constrainedCurve = constrainCurveToBounds(rotatedElement, rotatedElement.curve);
            return { ...rotatedElement, curve: constrainedCurve };
          }

          return rotatedElement;
        }
        return el;
      });

      setElements(updatedElements);
    }
  };

  // Début du redimensionnement
  const handleResizeStart = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔲 [RESIZE START] Starting resize for element:', elementId);

    const element = elements.find(el => el.id === elementId);
    if (!element) {
      console.log('❌ [RESIZE START] Element not found:', elementId);
      return;
    }

    // 🎨 Calculer le ratio d'aspect (toujours proportionnel)
    const aspectRatio = element.width / element.height;

    console.log('🔲 [RESIZE_START] Mode PROPORTIONNEL - Ratio:', aspectRatio.toFixed(2), 'Original:', element.width + 'x' + element.height);

    setSelectedElementId(elementId);
    setIsResizing(true);
    setResizeStart({
      width: element.width,
      height: element.height,
      startX: e.clientX,
      startY: e.clientY,
      aspectRatio,
      shiftPressed: false // Plus utilisé, mais gardé pour compatibilité
    });
  };

  // Début de la rotation
  const handleRotateStart = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === elementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + element.x * rect.width;
    const centerY = rect.top + element.y * rect.height;

    setSelectedElementId(elementId);
    setIsRotating(true);
    setRotateStart({
      angle: element.rotation,
      startX: e.clientX,
      startY: e.clientY,
      centerX,
      centerY
    });
  };

  // Fin du drag/resize/rotate
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setIsAtBoundary(false); // Réinitialiser l'état de limite
    // NE PAS désélectionner l'élément ici - il reste sélectionné
  };

  // Event listeners
  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, selectedElementId, dragStart, resizeStart, rotateStart, elements]);

  // Mettre à jour le texte
  const updateText = (text: string) => {
    if (!selectedElement || selectedElement.type !== 'text') return;

    // Calculer le nombre de lignes et la ligne la plus longue
    const lines = text.split('\n');
    const numberOfLines = lines.length;
    const longestLine = Math.max(...lines.map(line => line.length));

    // Commencer avec la taille de police actuelle
    let fontSize = selectedElement.fontSize;
    let width = selectedElement.width;
    let height;
    let fontSizeReduced = false;

    // Calculer les dimensions maximales disponibles dans la délimitation
    const maxDimensions = getMaxAvailableDimensions(selectedElement);

    // Si la ligne la plus longue est trop large, réduire la taille de police
    // Estimation: 1 caractère ≈ 0.6 * fontSize pour une police moyenne
    const estimatedWidthNeeded = longestLine * fontSize * 0.6;
    if (estimatedWidthNeeded > maxDimensions.width) {
      fontSize = (maxDimensions.width * 0.8) / (longestLine * 0.6);
      fontSize = Math.max(fontSize, 10); // Minimum 10px pour la lisibilité
      fontSizeReduced = true;

      // Ajuster la largeur en fonction de la nouvelle taille
      width = Math.min(estimatedWidthNeeded, maxDimensions.width * 0.9);
    }

    // Calculer la hauteur nécessaire en fonction du nombre de lignes et de la nouvelle taille
    const lineHeight = fontSize * 1.2;
    let proposedHeight = Math.max(lineHeight * numberOfLines, fontSize * 1.5);

    // Si la hauteur est trop grande, réduire encore la taille de police
    if (proposedHeight > maxDimensions.height) {
      fontSize = (maxDimensions.height * 0.8) / numberOfLines / 1.2;
      fontSize = Math.max(fontSize, 10); // Minimum 10px
      fontSizeReduced = true;

      // Recalculer la hauteur et la largeur avec la nouvelle taille
      const newLineHeight = fontSize * 1.2;
      proposedHeight = Math.max(newLineHeight * numberOfLines, fontSize * 1.5);

      // Recalculer la largeur si nécessaire
      const newEstimatedWidth = longestLine * fontSize * 0.6;
      width = Math.min(newEstimatedWidth, maxDimensions.width * 0.9);
    }

    // Contraindre les dimensions finales
    const constrainedSize = constrainResizeToBounds(selectedElement, width, proposedHeight);

    // Mettre à jour le texte, la taille de police et les dimensions
    setElements(elements.map(el => {
      if (el.id === selectedElementId && el.type === 'text') {
        return {
          ...el,
          text,
          fontSize: fontSize,
          baseFontSize: fontSize, // Mettre à jour la base aussi
          width: constrainedSize.width,
          height: constrainedSize.height
        };
      }
      return el;
    }));

    // Afficher un message si la taille a été réduite
    if (fontSizeReduced) {
      toast({
        title: "📝 Texte redimensionné",
        description: `La taille du texte a été automatiquement ajustée à ${Math.round(fontSize)}px pour s'adapter à la zone`,
        duration: 3000
      });
    } else if (constrainedSize.isAtBoundary) {
      setIsAtBoundary(true);
      toast({
        title: "⚠️ Limite atteinte",
        description: "Le texte a été automatiquement redimensionné pour rester dans la zone de personnalisation",
        duration: 2000
      });
    }
  };

  // Obtenir les dimensions maximales disponibles dans la délimitation
  const getMaxAvailableDimensions = (element: DesignElement) => {
    if (!canvasRef.current || !delimitation) return { width: 300, height: 200 };

    const delimPos = computeDelimitationPosition();
    const { scaleX, scaleY, canvasRect: rect } = getScalingParams();

    // Position du centre de l'élément
    const elementCenterPixelX = element.x * rect.width;
    const elementCenterPixelY = element.y * rect.height;

    // Limites de la délimitation en pixels
    const boundsX = delimPos.left;
    const boundsY = delimPos.top;
    const boundsWidth = delimPos.width;
    const boundsHeight = delimPos.height;

    // Calculer l'espace disponible depuis le centre
    const spaceLeft = elementCenterPixelX - boundsX;
    const spaceRight = (boundsX + boundsWidth) - elementCenterPixelX;
    const spaceTop = elementCenterPixelY - boundsY;
    const spaceBottom = (boundsY + boundsHeight) - elementCenterPixelY;

    // Espace maximum disponible (le plus petit côté)
    const maxAvailableWidth = Math.min(spaceLeft, spaceRight) * 2 * 0.9; // 90% pour garder une marge
    const maxAvailableHeight = Math.min(spaceTop, spaceBottom) * 2 * 0.9;

    return {
      width: maxAvailableWidth / scaleX, // Convertir en pixels de référence
      height: maxAvailableHeight / scaleY
    };
  };

  // Mettre à jour les propriétés de texte
  const updateTextProperty = <K extends keyof TextElement>(key: K, value: TextElement[K]) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    setElements(elements.map(el => {
      if (el.id === selectedElementId && el.type === 'text') {
        // Si on modifie manuellement la taille de police, mettre à jour la base
        if (key === 'fontSize') {
          console.log('📝 [MANUAL FONT] Updating base font size to:', value, 'and base width to:', el.width);
          return {
            ...el,
            [key]: value,
            baseFontSize: value as number,
            baseWidth: el.width
          };
        }
        // Si on modifie la courbure, appliquer la contrainte de délimitation
        if (key === 'curve') {
          const constrainedCurve = constrainCurveToBounds(el, value as number);
          console.log('🎨 [CURVE UPDATE] Requested:', value, 'Constrained:', constrainedCurve);
          return { ...el, curve: constrainedCurve };
        }
        return { ...el, [key]: value };
      }
      return el;
    }));
  };

  // Supprimer un élément
  const deleteElement = (id: string) => {
    console.log('🗑️ [ProductDesignEditor] Suppression élément:', id, 'total avant:', elements.length);
    console.log('🗑️ [ProductDesignEditor] Éléments actuels:', elements.map(el => ({ id: el.id, type: el.type })));
    console.log('🗑️ [ProductDesignEditor] selectedElementId:', selectedElementId);

    // Vérifier si l'ID à supprimer existe bien
    const elementExists = elements.some(el => el.id === id);
    console.log('🗑️ [ProductDesignEditor] Élément existe:', elementExists);

    if (!elementExists) {
      console.error('❌ [ProductDesignEditor] ERREUR: Élément à supprimer non trouvé!');
      return;
    }

    // D'abord, désélectionner l'élément pour éviter les conflits
    if (selectedElementId === id) {
      setSelectedElementId(null);
      console.log('🗑️ [ProductDesignEditor] Désélection avant suppression (edit mode stays active)');
    }

    // CRÉER UN NOUVEAU TABLEAU directement pour éviter les problèmes de références
    const currentElements = [...elements];
    console.log('🗑️ [ProductDesignEditor] Copie des éléments:', currentElements.length);

    const newElements = currentElements.filter(el => {
      const shouldKeep = el.id !== id;
      console.log('🗑️ [ProductDesignEditor] Filter élément:', el.id, 'keep?', shouldKeep);
      return shouldKeep;
    });

    console.log('🗑️ [ProductDesignEditor] Nouveaux éléments:', newElements.length);
    console.log('🗑️ [ProductDesignEditor] IDs des nouveaux éléments:', newElements.map(el => el.id));

    // Mettre à jour la référence aussi
    elementsRef.current = newElements;

    // Utiliser directement le nouveau tableau
    setElements(newElements);

    // Notification pour le débogage
    console.log('✅ [ProductDesignEditor] Suppression terminée - setElements appelé avec', newElements.length, 'éléments');

    // Forcer la mise à jour avec des timeouts pour vérifier en utilisant la référence
    setTimeout(() => {
      console.log('🗑️ [ProductDesignEditor] Vérification 50ms - éléments ref:', elementsRef.current.length);
      console.log('🗑️ [ProductDesignEditor] Vérification 50ms - éléments state:', elements.length);
    }, 50);

    setTimeout(() => {
      console.log('🗑️ [ProductDesignEditor] Vérification 100ms - éléments ref:', elementsRef.current.length);
      console.log('🗑️ [ProductDesignEditor] Vérification 100ms - éléments state:', elements.length);
    }, 100);

    // Forcer le re-render du composant pour garantir la mise à jour visuelle
    forceUpdate();
  };

  // Dupliquer un élément
  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const newElement = {
      ...element,
      id: generateId(),
      x: element.x + 0.05,
      y: element.y + 0.05,
      zIndex: elements.length
    };

    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  // Changer l'ordre (z-index)
  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;

    const newElements = [...elements];
    if (direction === 'up' && index < elements.length - 1) {
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
    } else if (direction === 'down' && index > 0) {
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
    }

    // Réassigner les zIndex
    newElements.forEach((el, i) => el.zIndex = i);
    setElements(newElements);
  };

  return (
    <div key={forceUpdateKey} className={`h-full w-full flex items-center justify-center ${className}`}>
      {/* Canvas - Maximisé en hauteur */}
      <div className="w-full h-full flex items-center justify-center">
        <div
          ref={canvasRef}
          className="relative bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200"
          style={{
            width: 'min(95%, calc(100vh - 180px))',
            height: 'min(95%, calc(100vh - 180px))',
            maxWidth: '900px',
            maxHeight: '900px',
            aspectRatio: '1/1'
          }}
          onClick={(e) => {
            // Ne désélectionner que si on clique directement sur le canvas (pas sur un enfant)
            if (e.target === e.currentTarget) {
              console.log('🖱️ [CANVAS] Click - deselecting element and hiding delimitations');
              setSelectedElementId(null);
              setIsEditMode(false); // Désactiver le mode édition (masquer délimitations et floutage)
            }
          }}
        >
          {/* Image du produit */}
          <img
            ref={productImageRef}
            src={productImageUrl}
            alt="Produit"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* Masque de flou pour les zones hors délimitation - UNIQUEMENT en mode édition */}
          {isEditMode && delimitation && canvasRef.current && (() => {
            const delimPos = computeDelimitationPosition();

            return (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <defs>
                  {/* Filtre de flou léger */}
                  <filter id="blur-filter">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                  {/* Masque pour définir la zone nette (délimitation) */}
                  <mask id="delimitation-mask">
                    {/* Tout en blanc = flou */}
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {/* Zone de délimitation en noir = nette */}
                    <rect
                      x={delimPos.left}
                      y={delimPos.top}
                      width={delimPos.width}
                      height={delimPos.height}
                      fill="black"
                    />
                  </mask>
                </defs>
                {/* Rectangle semi-transparent avec flou, masqué par la délimitation */}
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.15)"
                  filter="url(#blur-filter)"
                  mask="url(#delimitation-mask)"
                />
              </svg>
            );
          })()}


          {/* Délimitation visible - DÉSACTIVÉE */}
          {/* {delimitation && canvasRef.current && (() => {
            const rect = canvasRef.current.getBoundingClientRect();
            const delimPos = computeDelimitationPosition();

            const leftPercent = (delimPos.left / rect.width) * 100;
            const topPercent = (delimPos.top / rect.height) * 100;
            const widthPercent = (delimPos.width / rect.width) * 100;
            const heightPercent = (delimPos.height / rect.height) * 100;

            return (
              <div
                className={`absolute pointer-events-none transition-all duration-300 ${
                  isEditMode
                    ? `border-2 border-dashed ${isAtBoundary ? 'border-red-500' : 'border-blue-400'}`
                    : 'border-2 border-gray-300/60'
                } ${isEditMode ? 'rounded-lg' : 'rounded-md'}`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                  backgroundColor: isEditMode
                    ? (isAtBoundary ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)')
                    : 'rgba(209, 213, 219, 0.1)',
                  backdropFilter: isEditMode ? 'blur(2px)' : undefined,
                  boxShadow: isEditMode
                    ? (isAtBoundary ? '0 0 20px rgba(239, 68, 68, 0.2)' : '0 0 20px rgba(59, 130, 246, 0.2)')
                    : '0 0 10px rgba(0, 0, 0, 0.05)'
                }}
              />
            );
          })()} */}

          {/* Éléments de design */}
          {elements.map(element => {
            if (!canvasRef.current) return null;
            const { scaleX, scaleY, canvasRect: rect } = getScalingParams();

            const pixelX = element.x * rect.width;
            const pixelY = element.y * rect.height;

            // Calculer les dimensions responsive
            const responsiveWidth = element.width * scaleX;
            const responsiveHeight = element.height * scaleY;

            // Logs pour déboguer le positionnement
            if (element.id === selectedElementId || !selectedElementId) {
              console.log('🎨 [RENDER] Element render:', {
                id: element.id,
                selected: element.id === selectedElementId,
                mode: isEditMode ? 'EDIT' : 'VIEW',
                relativePos: { x: element.x.toFixed(3), y: element.y.toFixed(3) },
                pixelPos: { x: pixelX.toFixed(0), y: pixelY.toFixed(0) },
                responsiveSize: { w: responsiveWidth.toFixed(0), h: responsiveHeight.toFixed(0) },
                canvasSize: { w: rect.width.toFixed(0), h: rect.height.toFixed(0) },
                scaleFactors: {
                  x: scaleX.toFixed(2),
                  y: scaleY.toFixed(2)
                }
              });
            }

            // Pour le texte, ajuster aussi la taille de police
            const responsiveFontSize = element.type === 'text'
              ? element.fontSize * scaleX
              : undefined;

            const isSelected = element.id === selectedElementId;

            return (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${pixelX}px`,
                  top: `${pixelY}px`,
                  transform: `translate(-50%, -50%)`,
                  zIndex: element.zIndex,
                  pointerEvents: 'none'
                }}
              >
                {/* Conteneur avec rotation */}
                <div
                  className={`relative cursor-move`}
                  style={{
                    transform: `rotate(${element.rotation}deg)`,
                    transformOrigin: 'center',
                    width: `${responsiveWidth}px`,
                    height: `${responsiveHeight}px`,
                    pointerEvents: 'auto'
                  }}
                  onMouseDown={(e) => {
                    // Bloquer la propagation pour éviter la désélection
                    e.stopPropagation();

                    // Sélectionner l'élément et activer le mode édition
                    if (selectedElementId !== element.id) {
                      console.log('🖱️ [ELEMENT] MouseDown on', element.id, '- selecting element and showing delimitations');
                      setSelectedElementId(element.id);
                      setIsEditMode(true); // Activer le mode édition (montrer délimitations et floutage)
                    }
                    handleMouseDown(e, element.id);
                  }}
                >
                  {element.type === 'text' ? (
                    element.curve !== 0 ? (
                      // Rendu avec courbure (SVG)
                      <svg
                        width={responsiveWidth}
                        height={responsiveHeight}
                        viewBox={`0 0 ${responsiveWidth} ${responsiveHeight}`}
                        style={{
                          overflow: 'visible',
                          userSelect: 'none',
                          pointerEvents: 'none' // Laisser le parent gérer les clics
                        }}
                      >
                        <defs>
                          <path
                            id={`curve-${element.id}`}
                            d={(() => {
                              // Calculer le chemin courbe avec dimensions responsive
                              const w = responsiveWidth;
                              const h = responsiveHeight;
                              const curveAmount = element.curve;

                              // Calculer la courbure (arc quadratique)
                              // curveAmount: -355 = courbe vers le haut, +355 = courbe vers le bas
                              // Plus la valeur est grande, plus la courbure est prononcée
                              const controlY = h / 2 + (curveAmount * h / 100);

                              return `M 0,${h/2} Q ${w/2},${controlY} ${w},${h/2}`;
                            })()}
                            fill="none"
                          />
                        </defs>
                        <text
                          style={{
                            fontFamily: element.fontFamily,
                            fontSize: `${responsiveFontSize}px`,
                            fill: element.color,
                            fontWeight: element.fontWeight,
                            fontStyle: element.fontStyle,
                            textDecoration: element.textDecoration,
                            textAnchor: element.textAlign === 'left' ? 'start' : element.textAlign === 'right' ? 'end' : 'middle'
                          }}
                        >
                          <textPath
                            href={`#curve-${element.id}`}
                            startOffset={element.textAlign === 'left' ? '0%' : element.textAlign === 'right' ? '100%' : '50%'}
                          >
                            {element.text}
                          </textPath>
                        </text>
                      </svg>
                    ) : (
                      // Rendu sans courbure (normal)
                      <div
                        style={{
                          fontFamily: element.fontFamily,
                          fontSize: `${responsiveFontSize}px`,
                          color: element.color,
                          fontWeight: element.fontWeight,
                          fontStyle: element.fontStyle,
                          textDecoration: element.textDecoration,
                          textAlign: element.textAlign,
                          lineHeight: '1.2',
                          whiteSpace: 'normal',
                          overflow: 'visible',
                          wordWrap: 'break-word',
                          userSelect: 'none',
                          pointerEvents: 'none' // Laisser le parent gérer les clics
                        }}
                      >
                        {element.text.split('\n').map((line, index) => (
                          <React.Fragment key={index}>
                            {line}
                            {index < element.text.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    )
                  ) : (
                    <img
                      src={element.imageUrl}
                      alt="Design"
                      className="w-full h-full object-contain select-none"
                      style={{ pointerEvents: 'none' }} // Laisser le parent gérer les clics
                      draggable={false}
                    />
                  )}

                  {/* Bordure de sélection et poignées */}
                  {isSelected && (
                    <>
                      {/* Bordure */}
                      <div className={`absolute inset-0 border-2 ${
                        isResizing ? 'border-green-500' : 'border-blue-500'
                      } pointer-events-none`} />

                      {/* 🎨 Indicateur mode proportionnel pendant redimensionnement */}
                      {isResizing && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg pointer-events-none">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                            <path d="M12 8v8m-4-4h8" />
                          </svg>
                          <span className="font-medium">PROPORTIONNEL</span>
                        </div>
                      )}

                      {/* Poignée de redimensionnement (coin bas-droit) */}
                      <div
                        className={`absolute w-3 h-3 bg-white border-2 rounded-sm cursor-nwse-resize ${
                          isResizing ? 'border-green-500' : 'border-blue-500'
                        }`}
                        style={{
                          right: '-6px',
                          bottom: '-6px',
                          pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => handleResizeStart(e, element.id)}
                      />

                      {/* Bouton de suppression (coin haut-gauche) */}
                      <button
                        className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 border border-white sm:border-2 rounded-full cursor-pointer flex items-center justify-center shadow-md sm:shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          left: '-10px',
                          top: '-10px',
                          pointerEvents: 'auto',
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🗑️ [ProductDesignEditor] Clic sur bouton suppression canvas:', element.id);

                          // Utiliser un timeout pour éviter les problèmes de course
                          setTimeout(() => {
                            deleteElement(element.id);
                          }, 0);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </button>

                      {/* Bouton de duplication (coin haut-droit avant rotation) */}
                      <button
                        className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 hover:bg-blue-600 border border-white sm:border-2 rounded-full cursor-pointer flex items-center justify-center shadow-md sm:shadow-lg transition-all hover:scale-110"
                        style={{
                          right: '16px',
                          top: '-10px',
                          pointerEvents: 'auto',
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateElement(element.id);
                        }}
                        title="Dupliquer"
                      >
                        <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </button>

                      {/* Bouton de rotation (coin haut-droit) */}
                      <div
                        className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-green-500 hover:bg-green-600 border border-white sm:border-2 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center shadow-md sm:shadow-lg transition-all hover:scale-110"
                        style={{
                          right: '-10px',
                          top: '-10px',
                          pointerEvents: 'auto',
                          zIndex: 10
                        }}
                        onMouseDown={(e) => handleRotateStart(e, element.id)}
                        title="Rotation"
                      >
                        <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>

                      {/* Poignées aux 4 coins pour redimensionnement */}
                      <div
                        className={`absolute w-3 h-3 bg-white border-2 rounded-sm cursor-nwse-resize ${
                          isResizing ? 'border-green-500' : 'border-blue-500'
                        }`}
                        style={{
                          left: '-6px',
                          top: '-6px',
                          pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => handleResizeStart(e, element.id)}
                      />
                      <div
                        className={`absolute w-3 h-3 bg-white border-2 rounded-sm cursor-nesw-resize ${
                          isResizing ? 'border-green-500' : 'border-blue-500'
                        }`}
                        style={{
                          right: '-6px',
                          top: '-6px',
                          pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => handleResizeStart(e, element.id)}
                      />
                      <div
                        className={`absolute w-3 h-3 bg-white border-2 rounded-sm cursor-nesw-resize ${
                          isResizing ? 'border-green-500' : 'border-blue-500'
                        }`}
                        style={{
                          left: '-6px',
                          bottom: '-6px',
                          pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => handleResizeStart(e, element.id)}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input caché pour l'upload d'images (déclenché via ref depuis le parent) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
              // Vérifier la taille du fichier (limite: 10MB)
              const maxSize = 10 * 1024 * 1024; // 10MB en bytes
              if (file.size > maxSize) {
                toast({
                  title: 'Fichier trop volumineux',
                  description: 'La taille maximale est de 10 MB',
                  variant: 'destructive'
                });
                e.target.value = '';
                return;
              }

              // Afficher un toast de chargement
              toast({
                title: '📤 Upload en cours...',
                description: 'Envoi de votre image vers le serveur',
                duration: 2000
              });

              console.log('📤 [ProductDesignEditor] Upload image client:', {
                fileName: file.name,
                fileSize: (file.size / 1024).toFixed(2) + ' KB',
                fileType: file.type
              });

              // 🆕 Uploader l'image vers le backend via customizationService
              const customizationService = (await import('../services/customizationService')).default;
              const uploadResult = await customizationService.uploadImage(file);

              console.log('✅ [ProductDesignEditor] Image uploadée avec succès:', {
                url: uploadResult.url,
                publicId: uploadResult.publicId,
                dimensions: { width: uploadResult.width, height: uploadResult.height }
              });

              // Ajouter l'image avec l'URL permanente du backend
              addImage(
                uploadResult.url,              // URL Cloudinary permanente
                uploadResult.width,            // Largeur réelle
                uploadResult.height,           // Hauteur réelle
                undefined,                     // Pas de designId pour les uploads client
                undefined,                     // Pas de designPrice pour les uploads client
                file.name,                     // Nom du fichier original
                uploadResult.publicId          // 🆕 Stocker le publicId pour pouvoir supprimer si nécessaire
              );

              // Afficher un toast de succès
              toast({
                title: '✅ Image ajoutée',
                description: `${file.name} a été uploadée et ajoutée au design`,
                duration: 3000
              });

            } catch (error: any) {
              console.error('❌ [ProductDesignEditor] Erreur upload image:', error);

              // Extraire le message d'erreur avec plus de détails
              let errorMessage = 'Impossible d\'uploader cette image';
              let errorTitle = 'Erreur d\'upload';

              if (error.response?.data) {
                const data = error.response.data;
                errorMessage = data.message || data.error || errorMessage;

                // Messages personnalisés selon le type d'erreur
                if (errorMessage.includes('File size') || errorMessage.includes('trop volumineux')) {
                  errorTitle = 'Fichier trop volumineux';
                  errorMessage = 'La taille maximale est de 10 MB. Compressez votre image et réessayez.';
                } else if (errorMessage.includes('Invalid file type') || errorMessage.includes('Type de fichier')) {
                  errorTitle = 'Format non supporté';
                  errorMessage = 'Formats acceptés: JPEG, PNG, GIF, WebP';
                } else if (errorMessage.includes('No file')) {
                  errorTitle = 'Aucun fichier';
                  errorMessage = 'Veuillez sélectionner une image';
                }
              } else if (error.message) {
                errorMessage = error.message;
              }

              // Afficher le status code pour le debug
              if (error.response?.status) {
                console.error('Status:', error.response.status, error.response.statusText);
              }

              toast({
                title: errorTitle,
                description: errorMessage,
                variant: 'destructive',
                duration: 5000
              });
            } finally {
              // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Panneau latéral masqué - Toutes les propriétés sont gérées dans CustomerProductCustomizationPageV3 */}
      <div className="hidden">
        {/* Éditeur d'élément sélectionné - MASQUÉ */}
        {selectedElement && selectedElement.type === 'text' && (
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Éditer le texte</h3>

            <div>
              <label className="text-xs font-medium text-gray-700">Texte</label>
              <input
                type="text"
                value={selectedElement.text}
                onChange={(e) => updateText(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Police</label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => updateTextProperty('fontFamily', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs mt-1"
                >
                  {FONTS.map(font => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Taille</label>
                <input
                  type="number"
                  value={selectedElement.fontSize}
                  onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                  min="10"
                  max="100"
                  className="w-full px-2 py-1 border rounded text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Couleur</label>
              <div className="flex flex-wrap gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => updateTextProperty('color', color)}
                    className={`w-6 h-6 rounded border-2 ${
                      selectedElement.color === color ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedElement.fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTextProperty('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold')}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedElement.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTextProperty('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedElement.textDecoration === 'underline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTextProperty('textDecoration', selectedElement.textDecoration === 'underline' ? 'none' : 'underline')}
              >
                <Underline className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedElement.textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTextProperty('textAlign', 'left')}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedElement.textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTextProperty('textAlign', 'center')}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={selectedElement.textAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTextProperty('textAlign', 'right')}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Contrôle de courbure */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">
                Courbure: {selectedElement.curve}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  value={selectedElement.curve}
                  onChange={(e) => updateTextProperty('curve', parseInt(e.target.value))}
                  min="-355"
                  max="355"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTextProperty('curve', 0)}
                  disabled={selectedElement.curve === 0}
                  className="text-xs"
                >
                  Reset
                </Button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>↑ Haut (-355)</span>
                <span>Droit (0)</span>
                <span>↓ Bas (+355)</span>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles communs (rotation, dimensions) */}
        {selectedElement && (
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Propriétés</h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Largeur</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => {
                    const newWidth = parseInt(e.target.value) || selectedElement.width;
                    setElements(elements.map(el =>
                      el.id === selectedElementId ? { ...el, width: newWidth } : el
                    ));
                  }}
                  min="30"
                  className="w-full px-2 py-1 border rounded text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Hauteur</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => {
                    const newHeight = parseInt(e.target.value) || selectedElement.height;
                    setElements(elements.map(el =>
                      el.id === selectedElementId ? { ...el, height: newHeight } : el
                    ));
                  }}
                  min="30"
                  className="w-full px-2 py-1 border rounded text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Rotation (°)</label>
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="range"
                  value={selectedElement.rotation}
                  onChange={(e) => {
                    const requestedRotation = parseInt(e.target.value);
                    const constrainedRotation = constrainRotationToBounds(selectedElement, requestedRotation);

                    setElements(elements.map(el => {
                      if (el.id === selectedElementId) {
                        const rotatedElement = { ...el, rotation: constrainedRotation };

                        // Si c'est un texte avec courbure, re-contraindre la courbure
                        if (rotatedElement.type === 'text' && rotatedElement.curve !== 0) {
                          const constrainedCurve = constrainCurveToBounds(rotatedElement, rotatedElement.curve);
                          return { ...rotatedElement, curve: constrainedCurve };
                        }

                        return rotatedElement;
                      }
                      return el;
                    }));
                  }}
                  min="0"
                  max="360"
                  className="flex-1"
                />
                <input
                  type="number"
                  value={Math.round(selectedElement.rotation)}
                  onChange={(e) => {
                    const requestedRotation = (parseInt(e.target.value) || 0) % 360;
                    const constrainedRotation = constrainRotationToBounds(selectedElement, requestedRotation);

                    setElements(elements.map(el => {
                      if (el.id === selectedElementId) {
                        const rotatedElement = { ...el, rotation: constrainedRotation };

                        // Si c'est un texte avec courbure, re-contraindre la courbure
                        if (rotatedElement.type === 'text' && rotatedElement.curve !== 0) {
                          const constrainedCurve = constrainCurveToBounds(rotatedElement, rotatedElement.curve);
                          return { ...rotatedElement, curve: constrainedCurve };
                        }

                        return rotatedElement;
                      }
                      return el;
                    }));
                  }}
                  min="0"
                  max="360"
                  className="w-16 px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Bibliothèque de designs */}
      {showDesignLibrary && (() => {
        // Extraire les catégories uniques
        const categories = Array.from(
          new Set(vendorDesigns.map(d => d.category?.name).filter(Boolean))
        ).sort();

        // Filtrer les designs par catégorie et recherche
        const filteredDesigns = vendorDesigns.filter(design => {
          const matchSearch = design.name.toLowerCase().includes(designSearch.toLowerCase()) ||
                             design.creator?.shopName?.toLowerCase().includes(designSearch.toLowerCase());
          const matchCategory = !selectedCategory || design.category?.name === selectedCategory;
          return matchSearch && matchCategory;
        });

        // Compter les designs par catégorie
        const categoryCounts = categories.reduce((acc, cat) => {
          acc[cat] = vendorDesigns.filter(d => d.category?.name === cat).length;
          return acc;
        }, {} as Record<string, number>);

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b bg-gradient-to-r from-primary to-primary/80">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Bibliothèque de designs</h2>
                    <p className="text-primary-foreground/80 text-sm mt-1">
                      Choisissez parmi {vendorDesigns.length} designs de nos créateurs
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDesignLibrary(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un design..."
                    value={designSearch}
                    onChange={(e) => setDesignSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
              </div>

              {/* Onglets de catégories */}
              <div className="border-b bg-gray-50 overflow-x-auto">
                <div className="flex px-6 gap-2 min-w-max">
                  {/* Onglet "Tous" */}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                      selectedCategory === null
                        ? 'border-primary text-primary bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Tous les designs
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-xs font-semibold">
                      {vendorDesigns.length}
                    </span>
                  </button>

                  {/* Onglets de catégories */}
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                        selectedCategory === category
                          ? 'border-primary text-primary bg-white'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        selectedCategory === category
                          ? 'bg-primary/20 text-primary'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {categoryCounts[category]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
              {loadingDesigns ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Chargement des designs...</p>
                  </div>
                </div>
              ) : filteredDesigns.length > 0 ? (
                <>
                  {/* Compteur de résultats */}
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{filteredDesigns.length}</span> design{filteredDesigns.length > 1 ? 's' : ''}
                      {selectedCategory && <span> dans <span className="font-medium">{selectedCategory}</span></span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredDesigns.map((design) => (
                      <div
                        key={design.id}
                        className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => addVendorDesign(design)}
                      >
                        {/* Image */}
                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                          <img
                            src={design.imageUrl || design.thumbnailUrl}
                            alt={design.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {design.name}
                          </h3>

                          {/* Catégorie */}
                          {design.category && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {design.category.name}
                              </span>
                            </div>
                          )}

                          {/* Créateur */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {design.creator?.shopName?.charAt(0) || 'V'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 font-medium line-clamp-1">
                              {design.creator?.shopName || 'Vendeur'}
                            </span>
                          </div>

                          {/* Prix */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div>
                              <div className="text-xl font-bold text-primary">
                                {design.price?.toLocaleString() || 0} FCFA
                              </div>
                              <div className="text-xs text-gray-500">
                                {design.usageCount || 0} utilisations
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                addVendorDesign(design);
                              }}
                            >
                              Utiliser
                            </Button>
                          </div>
                        </div>

                        {/* Badge populaire */}
                        {design.usageCount > 10 && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            ⭐ Populaire
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Aucun design disponible</p>
                  <p className="text-sm text-gray-500">
                    {selectedCategory
                      ? `Aucun design dans la catégorie "${selectedCategory}"`
                      : 'Revenez plus tard pour découvrir de nouveaux designs'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
});

ProductDesignEditor.displayName = 'ProductDesignEditor';

export default ProductDesignEditor;

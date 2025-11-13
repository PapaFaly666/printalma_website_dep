import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import {
  Type,
  Image as ImageIcon,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
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
import { Button } from './ui/button';
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
}

const FONTS = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { name: 'Impact', value: 'Impact, fantasy' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' }
];

const COLORS = [
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
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, startX: 0, startY: 0, aspectRatio: 0, shiftPressed: false });
  const [rotateStart, setRotateStart] = useState({ angle: 0, startX: 0, startY: 0, centerX: 0, centerY: 0 });
  const [isAtBoundary, setIsAtBoundary] = useState(false);

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
    if (initialElements.length > 0 && elements.length === 0) {
      console.log('🔄 [ProductDesignEditor] Initialisation avec initialElements:', initialElements.length);
      setElements(migrateTextElements(initialElements));
    }
  }, [initialElements, elements.length]);

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
    setElements: (els: DesignElement[]) => setElements(migrateTextElements(els))
  }));

  // Générer un ID unique
  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter un texte
  const addText = () => {
    if (!canvasRef.current || !delimitation) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / delimitation.referenceWidth;
    const scaleY = rect.height / delimitation.referenceHeight;

    // Position centrée dans la délimitation
    const delimBounds = {
      x: delimitation.x * scaleX,
      y: delimitation.y * scaleY,
      width: delimitation.width * scaleX,
      height: delimitation.height * scaleY
    };

    const centerX = (delimBounds.x + delimBounds.width / 2) / rect.width;
    const centerY = (delimBounds.y + delimBounds.height / 2) / rect.height;

    const newText: TextElement = {
      id: generateId(),
      type: 'text',
      text: 'Votre texte',
      x: centerX,
      y: centerY,
      width: 150,
      height: 40,
      rotation: 0,
      fontSize: 24,
      baseFontSize: 24,      // Taille de police de base
      baseWidth: 150,         // Largeur de base
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
    console.log('✅ [ProductDesignEditor] Texte ajouté:', newText.id);
  };

  // Ajouter une image
  const addImage = (imageUrl: string, naturalWidth: number, naturalHeight: number) => {
    if (!canvasRef.current || !delimitation) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / delimitation.referenceWidth;
    const scaleY = rect.height / delimitation.referenceHeight;

    // Calculer la taille optimale pour l'image
    const delimBounds = {
      x: delimitation.x * scaleX,
      y: delimitation.y * scaleY,
      width: delimitation.width * scaleX,
      height: delimitation.height * scaleY
    };

    const maxWidth = delimBounds.width * 0.6;
    const maxHeight = delimBounds.height * 0.6;
    const aspectRatio = naturalWidth / naturalHeight;

    let imageWidth = maxWidth;
    let imageHeight = maxWidth / aspectRatio;

    if (imageHeight > maxHeight) {
      imageHeight = maxHeight;
      imageWidth = maxHeight * aspectRatio;
    }

    const centerX = (delimBounds.x + delimBounds.width / 2) / rect.width;
    const centerY = (delimBounds.y + delimBounds.height / 2) / rect.height;

    const newImage: ImageElement = {
      id: generateId(),
      type: 'image',
      imageUrl,
      x: centerX,
      y: centerY,
      width: imageWidth,
      height: imageHeight,
      rotation: 0,
      naturalWidth,
      naturalHeight,
      zIndex: elements.length
    };

    setElements([...elements, newImage]);
    setSelectedElementId(newImage.id);
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
      addImage(design.imageUrl, img.naturalWidth, img.naturalHeight);
      setShowDesignLibrary(false);
    };
    img.src = design.imageUrl;
  };

  // Contraindre la position dans la délimitation
  const constrainToBounds = (element: DesignElement, newX: number, newY: number): { x: number; y: number } => {
    if (!canvasRef.current || !delimitation) return { x: newX, y: newY };

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / delimitation.referenceWidth;
    const scaleY = rect.height / delimitation.referenceHeight;

    // Limites de la délimitation en pixels
    const boundsX = delimitation.x * scaleX;
    const boundsY = delimitation.y * scaleY;
    const boundsWidth = delimitation.width * scaleX;
    const boundsHeight = delimitation.height * scaleY;

    // Position de l'élément en pixels
    const elementPixelX = newX * rect.width - element.width / 2;
    const elementPixelY = newY * rect.height - element.height / 2;

    // Contraindre
    const constrainedX = Math.max(
      boundsX + element.width / 2,
      Math.min(boundsX + boundsWidth - element.width / 2, elementPixelX + element.width / 2)
    );

    const constrainedY = Math.max(
      boundsY + element.height / 2,
      Math.min(boundsY + boundsHeight - element.height / 2, elementPixelY + element.height / 2)
    );

    return {
      x: constrainedX / rect.width,
      y: constrainedY / rect.height
    };
  };

  // Contraindre le redimensionnement dans la délimitation
  const constrainResizeToBounds = (element: DesignElement, newWidth: number, newHeight: number): { width: number; height: number; isAtBoundary: boolean } => {
    if (!canvasRef.current || !delimitation) return { width: newWidth, height: newHeight, isAtBoundary: false };

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / delimitation.referenceWidth;
    const scaleY = rect.height / delimitation.referenceHeight;

    // Limites de la délimitation en pixels
    const boundsWidth = delimitation.width * scaleX;
    const boundsHeight = delimitation.height * scaleY;

    // Position actuelle de l'élément en coordonnées relatives (0-1)
    const elementCenterX = element.x;
    const elementCenterY = element.y;

    // Convertir en pixels
    const elementCenterPixelX = elementCenterX * rect.width;
    const elementCenterPixelY = elementCenterY * rect.height;

    // Calculer l'espace disponible autour de l'élément (en pixels)
    const spaceLeft = elementCenterPixelX - delimitation.x * scaleX;
    const spaceRight = (delimitation.x + delimitation.width) * scaleX - elementCenterPixelX;
    const spaceTop = elementCenterPixelY - delimitation.y * scaleY;
    const spaceBottom = (delimitation.y + delimitation.height) * scaleY - elementCenterPixelY;

    // L'espace maximum disponible (le plus petit des deux côtés opposés)
    const maxHalfWidth = Math.max(30, Math.min(spaceLeft, spaceRight));
    const maxHalfHeight = Math.max(30, Math.min(spaceTop, spaceBottom));

    // Dimensions maximales autorisées
    const maxWidth = maxHalfWidth * 2;
    const maxHeight = maxHalfHeight * 2;

    // Contraindre les nouvelles dimensions
    const constrainedWidth = Math.max(30, Math.min(newWidth, maxWidth));
    const constrainedHeight = Math.max(30, Math.min(newHeight, maxHeight));

    // Vérifier si on est à la limite
    const isAtBoundary = (constrainedWidth < newWidth || constrainedHeight < newHeight);

    console.log('🔲 [BOUNDARY] Element center:', elementCenterPixelX.toFixed(0) + 'x' + elementCenterPixelY.toFixed(0));
    console.log('🔲 [BOUNDARY] Available space:', {
      left: spaceLeft.toFixed(0),
      right: spaceRight.toFixed(0),
      top: spaceTop.toFixed(0),
      bottom: spaceBottom.toFixed(0),
      maxWidth: maxWidth.toFixed(0),
      maxHeight: maxHeight.toFixed(0)
    });
    console.log('🔲 [BOUNDARY] Is at boundary:', isAtBoundary, 'Constrained dimensions:', constrainedWidth.toFixed(0) + 'x' + constrainedHeight.toFixed(0));

    return {
      width: constrainedWidth,
      height: constrainedHeight,
      isAtBoundary
    };
  };

  // Vérifier si un élément tourné sort de la délimitation
  const checkRotatedElementBounds = (element: DesignElement): boolean => {
    if (!canvasRef.current || !delimitation) return false;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / delimitation.referenceWidth;
    const scaleY = rect.height / delimitation.referenceHeight;

    // Position du centre de l'élément en pixels
    const centerX = element.x * rect.width;
    const centerY = element.y * rect.height;

    // Convertir la rotation en radians
    const rotationRad = (element.rotation * Math.PI) / 180;

    // Calculer les 4 coins du rectangle tourné
    const halfWidth = element.width / 2;
    const halfHeight = element.height / 2;

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
    const boundsX = delimitation.x * scaleX;
    const boundsY = delimitation.y * scaleY;
    const boundsWidth = delimitation.width * scaleX;
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

  // Début du drag
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElementId(elementId);
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

      setElements(elements.map(el =>
        el.id === selectedElementId
          ? { ...el, x: constrained.x, y: constrained.y }
          : el
      ));
    }

    // Redimensionnement - TOUJOURS PROPORTIONNEL AVEC CONTRAINTES
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.startX;
      const deltaY = e.clientY - resizeStart.startY;

      let newWidth = Math.max(30, resizeStart.width + deltaX);
      let newHeight = Math.max(30, resizeStart.height + deltaY);

      // 🎨 Comportement TOUJOURS proportionnel (plus besoin de Shift)
      if (resizeStart.aspectRatio > 0) {
        // Utiliser la plus grande variation pour déterminer l'échelle
        const scaleX = newWidth / resizeStart.width;
        const scaleY = newHeight / resizeStart.height;
        const scale = Math.max(scaleX, scaleY);

        // Appliquer le ratio d'aspect original
        newWidth = Math.max(30, resizeStart.width * scale);
        newHeight = Math.max(30, resizeStart.height * scale);

        // Corriger pour respecter exactement le ratio
        if (resizeStart.aspectRatio > 1) { // Format paysage
          newHeight = newWidth / resizeStart.aspectRatio;
        } else { // Format portrait
          newWidth = newHeight * resizeStart.aspectRatio;
        }

        console.log('🔲 [PROPORTIONNEL] Resize - Ratio:', resizeStart.aspectRatio.toFixed(2), 'Scale:', scale.toFixed(2), 'Before constraint:', newWidth.toFixed(0) + 'x' + newHeight.toFixed(0));
      }

      // 🚨 CONTRAINTE: Ne pas sortir de la délimitation
      const element = elements.find(el => el.id === selectedElementId);
      if (element) {
        const constrained = constrainResizeToBounds(element, newWidth, newHeight);
        newWidth = constrained.width;
        newHeight = constrained.height;
        setIsAtBoundary(constrained.isAtBoundary);
      }

      setElements(elements.map(el => {
        if (el.id === selectedElementId) {
          // Pour les éléments texte, ajuster la taille de police proportionnellement
          if (el.type === 'text') {
            const widthRatio = newWidth / el.baseWidth;
            const newFontSize = Math.round(el.baseFontSize * widthRatio);
            console.log('📝 [TEXT SCALE] Width ratio:', widthRatio.toFixed(2), 'Base font:', el.baseFontSize, 'New font:', newFontSize);
            return { ...el, width: newWidth, height: newHeight, fontSize: newFontSize };
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

      // Appliquer la rotation et vérifier les limites
      const updatedElements = elements.map(el => {
        if (el.id === selectedElementId) {
          return { ...el, rotation: newRotation };
        }
        return el;
      });

      setElements(updatedElements);

      // Vérifier si l'élément tourné sort de la délimitation
      const rotatedElement = updatedElements.find(el => el.id === selectedElementId);
      if (rotatedElement) {
        const isOutOfBounds = checkRotatedElementBounds(rotatedElement);
        setIsAtBoundary(isOutOfBounds);
      }
    }
  };

  // Début du redimensionnement
  const handleResizeStart = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

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
    // Si on termine une rotation et que l'élément sort de la zone, le recadrer
    if (isRotating && isAtBoundary && selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId);
      if (element) {
        // Remettre la rotation à 0 pour que l'élément rentre dans la zone
        const constrainedRotation = 0;
        setElements(elements.map(el =>
          el.id === selectedElementId
            ? { ...el, rotation: constrainedRotation }
            : el
        ));

        // Afficher un message à l'utilisateur
        toast({
          title: 'Rotation ajustée',
          description: "L'élément a été remis dans la zone de personnalisation",
          variant: 'destructive',
          duration: 3000
        });
      }
    }

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
    setElements(elements.map(el =>
      el.id === selectedElementId ? { ...el, text } : el
    ));
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
        return { ...el, [key]: value };
      }
      return el;
    }));
  };

  // Supprimer un élément
  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
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
    <div className={`flex gap-4 ${className}`}>
      {/* Canvas */}
      <div className="flex-1">
        <div
          ref={canvasRef}
          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300"
          onClick={(e) => {
            // Ne désélectionner que si on clique directement sur le canvas (pas sur un enfant)
            if (e.target === e.currentTarget) {
              setSelectedElementId(null);
            }
          }}
        >
          {/* Image du produit */}
          <img
            src={productImageUrl}
            alt="Produit"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* Message d'avertissement si hors limites */}
          {isAtBoundary && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
              <p className="text-sm font-semibold">⚠️ L'élément sort de la zone de personnalisation</p>
            </div>
          )}

          {/* Délimitation visible */}
          {delimitation && canvasRef.current && (() => {
            const rect = canvasRef.current.getBoundingClientRect();
            const scaleX = rect.width / delimitation.referenceWidth;
            const scaleY = rect.height / delimitation.referenceHeight;

            const leftPercent = (delimitation.x * scaleX / rect.width) * 100;
            const topPercent = (delimitation.y * scaleY / rect.height) * 100;
            const widthPercent = (delimitation.width * scaleX / rect.width) * 100;
            const heightPercent = (delimitation.height * scaleY / rect.height) * 100;

            return (
              <div
                className={`absolute border-2 border-dashed pointer-events-none transition-colors duration-200 ${
                  isAtBoundary ? 'border-red-500' : 'border-blue-400'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                  backgroundColor: isAtBoundary ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)'
                }}
              />
            );
          })()}

          {/* Éléments de design */}
          {elements.map(element => {
            if (!canvasRef.current) return null;
            const rect = canvasRef.current.getBoundingClientRect();

            const pixelX = element.x * rect.width;
            const pixelY = element.y * rect.height;

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
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    pointerEvents: 'auto'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                >
                  {element.type === 'text' ? (
                    element.curve !== 0 ? (
                      // Rendu avec courbure (SVG)
                      <svg
                        width={element.width}
                        height={element.height}
                        viewBox={`0 0 ${element.width} ${element.height}`}
                        style={{
                          overflow: 'visible',
                          userSelect: 'none'
                        }}
                      >
                        <defs>
                          <path
                            id={`curve-${element.id}`}
                            d={(() => {
                              // Calculer le chemin courbe
                              const w = element.width;
                              const h = element.height;
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
                            fontSize: `${element.fontSize}px`,
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
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                          fontWeight: element.fontWeight,
                          fontStyle: element.fontStyle,
                          textDecoration: element.textDecoration,
                          textAlign: element.textAlign,
                          lineHeight: '1.2',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          userSelect: 'none'
                        }}
                      >
                        {element.text}
                      </div>
                    )
                  ) : (
                    <img
                      src={element.imageUrl}
                      alt="Design"
                      className="w-full h-full object-contain select-none"
                      draggable={false}
                    />
                  )}

                  {/* Bordure de sélection et poignées */}
                  {isSelected && (
                    <>
                      {/* Bordure */}
                      <div className={`absolute inset-0 border-2 ${
                        isResizing
                          ? isAtBoundary
                            ? 'border-red-500'
                            : 'border-green-500'
                          : 'border-blue-500'
                      } pointer-events-none`} />

                      {/* 🎨 Indicateurs de redimensionnement */}
                      {isResizing && (
                        <>
                          {/* Indicateur mode proportionnel TOUJOURS ACTIF */}
                          <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 ${isAtBoundary ? 'bg-orange-500' : 'bg-green-600'} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg pointer-events-none`}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="4" y="4" width="16" height="16" rx="2" />
                              <path d="M12 8v8m-4-4h8" />
                            </svg>
                            <span className="font-medium">
                              {isAtBoundary ? 'LIMITE ATTEINTE' : 'PROPORTIONNEL'}
                            </span>
                          </div>

                          {/* Indicateur visuel quand on est à la limite */}
                          {isAtBoundary && (
                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg pointer-events-none animate-pulse">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 17.657l-.707-.707m12.728 0l-.707.707M6.343 6.343l-.707-.707" />
                              </svg>
                              <span className="font-medium">MAX TAILLE</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Poignée de redimensionnement (coin bas-droit) */}
                      <div
                        className={`absolute w-3 h-3 bg-white border-2 rounded-sm cursor-nwse-resize ${
                          isResizing
                            ? isAtBoundary
                              ? 'border-red-500'
                              : 'border-green-500'
                            : 'border-blue-500'
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
                        className="absolute w-7 h-7 bg-red-500 hover:bg-red-600 border-2 border-white rounded-full cursor-pointer flex items-center justify-center shadow-lg transition-all hover:scale-110"
                        style={{
                          left: '-14px',
                          top: '-14px',
                          pointerEvents: 'auto',
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>

                      {/* Bouton de duplication (coin haut-droit avant rotation) */}
                      <button
                        className="absolute w-7 h-7 bg-blue-500 hover:bg-blue-600 border-2 border-white rounded-full cursor-pointer flex items-center justify-center shadow-lg transition-all hover:scale-110"
                        style={{
                          right: '20px',
                          top: '-14px',
                          pointerEvents: 'auto',
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateElement(element.id);
                        }}
                        title="Dupliquer"
                      >
                        <Copy className="w-3.5 h-3.5 text-white" />
                      </button>

                      {/* Bouton de rotation (coin haut-droit) */}
                      <div
                        className="absolute w-7 h-7 bg-green-500 hover:bg-green-600 border-2 border-white rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg transition-all hover:scale-110"
                        style={{
                          right: '-14px',
                          top: '-14px',
                          pointerEvents: 'auto',
                          zIndex: 10
                        }}
                        onMouseDown={(e) => handleRotateStart(e, element.id)}
                        title="Rotation"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-white" />
                      </div>

                      {/* Poignées aux 4 coins pour redimensionnement */}
                      <div
                        className={`absolute w-3 h-3 bg-white border-2 rounded-sm cursor-nwse-resize ${
                          isResizing
                            ? isAtBoundary
                              ? 'border-red-500'
                              : 'border-green-500'
                            : 'border-blue-500'
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
                          isResizing
                            ? isAtBoundary
                              ? 'border-red-500'
                              : 'border-green-500'
                            : 'border-blue-500'
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
                          isResizing
                            ? isAtBoundary
                              ? 'border-red-500'
                              : 'border-green-500'
                            : 'border-blue-500'
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                addImage(event.target?.result as string, img.width, img.height);
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>

      {/* Panneau latéral */}
      <div className="w-80 space-y-4">
        {/* Éditeur d'élément sélectionné */}
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
                    const newWidth = Math.max(30, parseInt(e.target.value) || 30);
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
                    const newHeight = Math.max(30, parseInt(e.target.value) || 30);
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
                    const newRotation = parseInt(e.target.value);
                    setElements(elements.map(el =>
                      el.id === selectedElementId ? { ...el, rotation: newRotation } : el
                    ));
                  }}
                  min="0"
                  max="360"
                  className="flex-1"
                />
                <input
                  type="number"
                  value={Math.round(selectedElement.rotation)}
                  onChange={(e) => {
                    const newRotation = parseInt(e.target.value) || 0;
                    setElements(elements.map(el =>
                      el.id === selectedElementId ? { ...el, rotation: newRotation % 360 } : el
                    ));
                  }}
                  min="0"
                  max="360"
                  className="w-16 px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Liste des calques */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3">Calques ({elements.length})</h3>

          {elements.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              Aucun élément.<br />Ajoutez du texte ou une image.
            </p>
          ) : (
            <div className="space-y-2">
              {[...elements].reverse().map((element, reverseIndex) => {
                const actualIndex = elements.length - 1 - reverseIndex;
                return (
                  <div
                    key={element.id}
                    className={`flex items-center gap-2 p-2 rounded border ${
                      element.id === selectedElementId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedElementId(element.id)}
                  >
                    <span className="text-xs flex-1 font-medium truncate">
                      {element.type === 'text' ? element.text : 'Image'}
                    </span>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(element.id, 'up');
                        }}
                        disabled={actualIndex === elements.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <MoveUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(element.id, 'down');
                        }}
                        disabled={actualIndex === 0}
                        className="h-6 w-6 p-0"
                      >
                        <MoveDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateElement(element.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { DesignFileChecker } from '../components/vendor/DesignFileChecker';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../services/productService';
import { Loader2, Upload, Image as ImageIcon, CloudUpload, Rocket, Store, Check, Save, Info, Ruler, Palette, X, Package, DollarSign, Edit3, Move, RotateCw, Calculator, ChevronDown, ChevronUp, ChevronRight, TrendingUp, Percent, RotateCcw, Zap, Target, Sparkles, ArrowRight, Eye, BarChart3, PiggyBank, Coins, AlertCircle, Star } from 'lucide-react';
import designService, { Design } from '../services/designService';
import { useAuth } from '../contexts/AuthContext';
import { useVendorPublish } from '../hooks/useVendorPublish';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
// ✅ CORRIGÉ : Retour à useDesignTransforms mais sans création automatique
import { useDesignTransforms } from '../hooks/useDesignTransforms';
// Imports Sheet supprimés - remplacés par Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { useToast } from '../components/ui/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Toaster } from 'sonner';
import { getVendorProductId } from '../utils/vendorProductHelpers';
import commissionService from '../services/commissionService';
import { vendorProductService } from '../services/vendorProductService';
import { vendorProductValidationService } from '../services/vendorProductValidationService';

// 🆕 Imports pour cascade validation
import { PostValidationActionSelectorIntegrated } from '../components/cascade/PostValidationActionSelectorIntegrated';
import { useCascadeValidationIntegrated } from '../hooks/useCascadeValidationIntegrated';
import { PostValidationAction } from '../types/cascadeValidation';
import DesignCategorySelector from '../components/DesignCategorySelector';

// 🆕 Import du nouveau composant Canvas
// import ProductViewWithDesign from '../components/design/ProductViewWithDesign'; // Conflit avec le composant local

// 🆕 Import de l'utilitaire de calcul de bounding box
import {
  calculateDesignPositioning,
  convertDelimitationToAbsolute,
  type DelimitationInfo,
  type DesignTransform as BoundingBoxTransform
} from '../utils/boundingBoxCalculator';

// 🆕 Import du modal de génération d'images multi-produits
import { MultiProductImagesModal } from '../components/vendor/MultiProductImagesModal';

// 🆕 Import du composant de configuration des prix par taille
import { SizePricingConfig } from '../components/vendor/SizePricingConfig';

// Déclaration de type pour dom-to-image-more
declare module 'dom-to-image-more' {
  export function toPng(node: HTMLElement, options?: any): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: any): Promise<string>;
  export function toSvg(node: HTMLElement, options?: any): Promise<string>;
  export function toCanvas(node: HTMLElement, options?: any): Promise<string>;
}

// 🆕 Interface pour les limites de la zone de travail

// 🆕 Interface pour l'état de déplacement (simplifié)

// 🆕 Interface pour les propriétés du design (avec dimensions intrinsèques)
interface DesignProperties {
  width: number;
  height: number;
  scale: number; // Facteur d'échelle général du design
  maintainAspectRatio: boolean;
}

// 🆕 Interface simplifiée pour la transformation (position + rotation)
// 📐 NOTE: Cette interface est utilisée localement dans SellDesignPage pour l'affichage CSS
// Les champs designWidth, designHeight, containerWidth, containerHeight sont utilisés pour l'affichage
// mais NE sont PAS envoyés au backend (le backend les calcule avec fit: 'inside')
interface SimpleTransform {
  x: number;
  y: number;
  // 🔴 Ces champs sont utilisés pour l'affichage CSS dans SellDesignPage
  // mais ne sont PAS envoyés au backend
  designWidth?: number;   // ❌ PAS ENVOYÉ au backend
  designHeight?: number;  // ❌ PAS ENVOYÉ au backend
  designScale?: number;
  rotation?: number; // En degrés
  containerWidth?: number;   // ❌ PAS ENVOYÉ au backend (recalculé)
  containerHeight?: number;  // ❌ PAS ENVOYÉ au backend (recalculé)
  // ✅ SEULS ces champs sont envoyés au backend :
  delimitationWidth?: number;  // ✅ ENVOYÉ au backend
  delimitationHeight?: number; // ✅ ENVOYÉ au backend
}

// 🆕 Fonction utilitaire pour calculer une taille de design adaptée aux délimitations
const calculateOptimalDesignSize = (designNaturalSize: { width: number; height: number }, products: any[]): { width: number; height: number; scale: number } => {
  // Taille par défaut de sécurité - plus conservative pour éviter les débordements
  const defaultSize = { width: 140, height: 140, scale: 0.85 };
  
  if (!products || products.length === 0) {
    return defaultSize;
  }

  // Collecter toutes les délimitations disponibles
  const allDelimitations: any[] = [];
  products.forEach(product => {
    if (product.views) {
      product.views.forEach((view: any) => {
        if (view.delimitations) {
          allDelimitations.push(...view.delimitations);
        }
      });
    }
  });

  if (allDelimitations.length === 0) {
    return defaultSize;
  }

  // Calculer la taille moyenne des délimitations
  const avgDelimitationSize = allDelimitations.reduce((acc, delim) => {
    const width = delim.width || 100;
    const height = delim.height || 100;
    return { width: acc.width + width, height: acc.height + height };
  }, { width: 0, height: 0 });

  avgDelimitationSize.width /= allDelimitations.length;
  avgDelimitationSize.height /= allDelimitations.length;

  // 🔧 NOUVELLE APPROCHE : Calculer une taille garantie pour rester dans la délimitation
  // Utiliser 75% de la taille moyenne pour un rendu plus grand par défaut
  const safetyMargin = 0.75; // 75% pour un design plus grand
  const targetSize = {
    width: Math.max(40, avgDelimitationSize.width * safetyMargin),
    height: Math.max(40, avgDelimitationSize.height * safetyMargin)
  };

  // Maintenir le ratio d'aspect du design
  const aspectRatio = designNaturalSize.width / designNaturalSize.height;
  if (aspectRatio > 1) {
    // Design plus large que haut
    targetSize.height = targetSize.width / aspectRatio;
  } else {
    // Design plus haut que large
    targetSize.width = targetSize.height * aspectRatio;
  }

  // 🔧 S'assurer que la taille finale reste dans des limites raisonnables
  const maxSize = Math.min(avgDelimitationSize.width, avgDelimitationSize.height) * 0.7;
  if (targetSize.width > maxSize || targetSize.height > maxSize) {
    const scaleFactor = maxSize / Math.max(targetSize.width, targetSize.height);
    targetSize.width *= scaleFactor;
    targetSize.height *= scaleFactor;
  }

  return {
    width: targetSize.width,
    height: targetSize.height,
    scale: 0.85 // Échelle par défaut plus grande
  };
};

// 🆕 Hook pour gérer les propriétés du design
const useDesignProperties = (designUrl: string, products: any[] = []) => {
  const [designProperties, setDesignProperties] = useState<DesignProperties>({
    width: 100, // Taille par défaut plus grande
    height: 100,
    scale: 0.85, // Échelle par défaut plus grande
    maintainAspectRatio: true
  });

  const [designNaturalSize, setDesignNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Charger les dimensions naturelles du design
  useEffect(() => {
    if (designUrl) {
      const img = new Image();
      img.onload = () => {
        const naturalSize = { width: img.naturalWidth, height: img.naturalHeight };
        setDesignNaturalSize(naturalSize);
        
        // 🆕 Calculer une taille optimale basée sur les délimitations disponibles
        const optimalSize = calculateOptimalDesignSize(naturalSize, products);
        
        setDesignProperties(prev => ({
          ...prev,
          width: optimalSize.width,
          height: optimalSize.height,
          scale: optimalSize.scale,
        }));
      };
      img.src = designUrl;
    }
  }, [designUrl, products]);

  return {
    designProperties,
    setDesignProperties,
    designNaturalSize
  };
};

// 🆕 Composant moderne pour la zone de travail avec design - Version avec dimensions intrinsèques
const ModernDesignCanvas: React.FC<{
  view: any;
  designUrl: string;
  productId?: number;
  products?: any[];
  vendorDesigns?: any[];
  cropInfo?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    boundingBox: { x: number; y: number; width: number; height: number };
  } | null;
  className?: string;
}> = ({ 
  view, 
  designUrl, 
  productId = 0, 
  products = [], 
  vendorDesigns = [],
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // 🆕 Détection si le produit est un autocollant
  const isSticker = useMemo(() => {
    return products.some((product: any) => product.genre === 'AUTOCOLLANT');
  }, [products]);

  // 🆕 Calcul du ratio d'aspect de l'image pour les autocollants
  const imageAspectRatio = useMemo(() => {
    if (!isSticker || !naturalSize.width || !naturalSize.height) return 1;
    return naturalSize.width / naturalSize.height;
  }, [isSticker, naturalSize]);

  // 🆕 Utilisation du hook pour les propriétés du design
  const { designProperties, designNaturalSize } = useDesignProperties(designUrl, products);

  // 🆕 Utilisation du hook pour gérer les transformations avec sauvegarde automatique
  const {
    updateTransform: updateTransformOriginal,
    getTransform: getTransformOriginal,
    resetTransforms,
    saveNow,
    isSaving,
    lastSaveTime
  } = useDesignTransforms(productId, designUrl, products, vendorDesigns);

  // 🎯 NOUVEAU WRAPPER : Système de ratio constant - ne pas écraser les valeurs fournies
  const updateTransform = useCallback((idx: number, updates: Partial<SimpleTransform>) => {
    updateTransformOriginal(idx, {
      ...updates,
      // 🎯 N'utiliser les valeurs par défaut que si aucune valeur n'est fournie
      ...(updates.designScale === undefined && { designScale: designProperties.scale }),
      ...(updates.rotation === undefined && { rotation: 0 }),
    });
  }, [updateTransformOriginal, designProperties]);

  // 🎯 NOUVEAU WRAPPER : Récupérer les transformations avec le système de ratio constant
  const getTransform = useCallback((idx: number): SimpleTransform => {
    const original = getTransformOriginal(idx);
    return {
      x: original.x,
      y: original.y,
      // 🎯 Dans le nouveau système, on utilise seulement designScale (ratio constant)
      designScale: original.designScale || designProperties.scale || 0.9,
      rotation: original.rotation || 0,
    };
  }, [getTransformOriginal, designProperties]);

  // 🆕 États pour la manipulation directe style Illustrator (drag uniquement)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialTransform, setInitialTransform] = useState<SimpleTransform | null>(null);

  // 🆕 États pour le redimensionnement style Photoshop
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number } | null>(null);
  const [initialSize, setInitialSize] = useState<{ width: number; height: number; scale: number } | null>(null);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);

  // 🆕 États pour la rotation
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState<{ x: number; y: number; angle: number } | null>(null);
  const [initialRotation, setInitialRotation] = useState<number>(0);

  // 🆕 États pour contrôles numériques
  const [showSizeControls, setShowSizeControls] = useState(false);

  // 🆕 Throttling pour fluidité du redimensionnement
  const animationFrameId = useRef<number | null>(null);

  // Observer natural image size
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
    }
  }, [view.url || view.imageUrl]);

  // Observe container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const delimitations = (view.delimitations || []) as Array<any>;

  const computePxPosition = (delim: any) => {
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = naturalSize.width || 1200;
    const imgH = naturalSize.height || 1200;

    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    const { width: contW, height: contH } = containerSize;
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

    const imgRatio = imgW / imgH;
    const contRatio = contW / contH;

    let dispW: number, dispH: number, offsetX: number, offsetY: number;
    if (imgRatio > contRatio) {
      dispW = contW;
      dispH = contW / imgRatio;
      offsetX = 0;
      offsetY = (contH - dispH) / 2;
    } else {
      dispH = contH;
      dispW = contH * imgRatio;
      offsetX = (contW - dispW) / 2;
      offsetY = 0;
    }

    return {
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };
  };

  // 🆕 Déplacement fluide style Illustrator (drag uniquement)
  const handleDesignMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const currentTransform = getTransform(idx);
    
    // Démarrer le drag immédiatement
    setIsDragging(true);
    setDragStart({ x: mouseX, y: mouseY });
    setInitialTransform(currentTransform);
  };

  // 🆕 Support mobile: déplacement via touch events
  const handleDesignTouchStart = (e: React.TouchEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    const currentTransform = getTransform(idx);
    setIsDragging(true);
    setDragStart({ x: touchX, y: touchY });
    setInitialTransform(currentTransform);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !dragStart || !initialTransform || selectedIdx === null || !isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;

    // 📐 NOUVEAU CALCUL COHÉRENT AVEC BACKEND
    const delim = delimitations[selectedIdx];
    const pos = computePxPosition(delim); // Dimensions affichées (viewport)
    const designScale = initialTransform.designScale || 0.9;

    // 🆕 Préparer les infos de délimitation pour le calcul
    const delimInfo: DelimitationInfo = {
      x: delim.x,
      y: delim.y,
      width: delim.width,
      height: delim.height,
      coordinateType: delim.coordinateType,
      imageWidth: naturalSize.width || 1200,
      imageHeight: naturalSize.height || 1200,
    };

    // 🆕 Calculer toutes les infos nécessaires (bounding box, contraintes, etc.)
    const positioning = calculateDesignPositioning(
      delimInfo,
      { x: 0, y: 0, designScale }, // Transform temporaire pour obtenir contraintes
      { width: pos.width, height: pos.height }
    );

    // Calculer la nouvelle position EN PIXELS ABSOLUS
    // Les deltas de la souris sont en coordonnées viewport, on les scale
    const newX = initialTransform.x + (deltaX * positioning.scaleRatio);
    const newY = initialTransform.y + (deltaY * positioning.scaleRatio);

    // Appliquer les contraintes (empêche de sortir de la délimitation)
    const constrainedX = Math.max(positioning.constraints.minX, Math.min(positioning.constraints.maxX, newX));
    const constrainedY = Math.max(positioning.constraints.minY, Math.min(positioning.constraints.maxY, newY));

    // Mise à jour avec toutes les informations nécessaires au backend
    updateTransform(selectedIdx, {
      ...initialTransform,
      x: constrainedX,
      y: constrainedY,
      delimitationWidth: positioning.delimAbsolute.width,
      delimitationHeight: positioning.delimAbsolute.height,
    });
  }, [isDragging, dragStart, initialTransform, selectedIdx, delimitations, naturalSize, updateTransform, computePxPosition]);

  const handleMouseUp = useCallback(() => {
    // 🔧 Annuler toute animation en cours pour un nettoyage propre
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    // 🆕 Sauvegarder immédiatement la position finale après le drag/resize/rotation
    if (isDragging || isResizing || isRotating) {
      console.log('💾 Sauvegarde automatique de la position finale après interaction');
      saveNow();
    }

    // Reset interaction states - ARRÊT IMMÉDIAT comme dans Illustrator
    setIsDragging(false);
    setDragStart(null);
    setInitialTransform(null);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
    setInitialSize(null);
    setIsRotating(false);
    setRotationStart(null);
    setInitialRotation(0);
  }, [isDragging, isResizing, isRotating, saveNow]);

  useEffect(() => {
    if (isDragging) {
      // Gestionnaires globaux pour capturer même quand la souris sort du canvas
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp); // Arrêt si souris sort de la page
      
      // Empêcher la sélection de texte pendant les interactions
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      // 🆕 Support mobile: listeners tactiles
      const touchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        if (!containerRef.current || !dragStart || !initialTransform || selectedIdx === null || !isDragging) return;
        const rect = containerRef.current.getBoundingClientRect();
        const t = ev.touches[0];
        const mouseX = t.clientX - rect.left;
        const mouseY = t.clientY - rect.top;
        const deltaX = mouseX - dragStart.x;
        const deltaY = mouseY - dragStart.y;
        const delim = delimitations[selectedIdx];
        const pos = computePxPosition(delim);
        const delimInPixels = computeDelimitationInPixels(delim); // 🆕 NOUVEAU: Dimensions absolues
        const designScale = (initialTransform.designScale || 0.8);
        const designWidth = pos.width * designScale;
        const designHeight = pos.height * designScale;
        const containerWidth = delimInPixels.width * designScale;   // 🆕 NOUVEAU: Conteneur absolu
        const containerHeight = delimInPixels.height * designScale; // 🆕 NOUVEAU: Conteneur absolu
        const maxX = (pos.width - designWidth) / 2;
        const minX = -(pos.width - designWidth) / 2;
        const maxY = (pos.height - designHeight) / 2;
        const minY = -(pos.height - designHeight) / 2;
        const constrainedX = Math.max(minX, Math.min(maxX, initialTransform.x + deltaX));
        const constrainedY = Math.max(minY, Math.min(maxY, initialTransform.y + deltaY));
        updateTransform(selectedIdx, {
          ...initialTransform,
          x: constrainedX,
          y: constrainedY,
          containerWidth,   // 🆕 NOUVEAU: Taille absolue du conteneur
          containerHeight,  // 🆕 NOUVEAU: Taille absolue du conteneur
          delimitationWidth: delimInPixels.width,   // 🆕 NOUVEAU: Dimensions de la délimitation
          delimitationHeight: delimInPixels.height, // 🆕 NOUVEAU: Dimensions de la délimitation
        });
      };
      const touchEnd = () => handleMouseUp();
      document.addEventListener('touchmove', touchMove, { passive: false });
      document.addEventListener('touchend', touchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
        document.removeEventListener('touchmove', touchMove as any);
        document.removeEventListener('touchend', touchEnd as any);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 🆕 Resize useEffect will be added after handleResizeMove declaration

  // 🆕 Fonction pour obtenir le curseur approprié

  // 🆕 Fonctions de redimensionnement style Photoshop
  const handleResizeStart = (e: React.MouseEvent, idx: number, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const currentTransform = getTransform(idx);
    const delim = delimitations[idx];
    const pos = computePxPosition(delim);
    
    // 🎯 SYSTÈME DE RATIO CONSTANT : utiliser le même système que dans l'affichage
    const designScale = currentTransform.designScale || 0.8;
    const currentDisplayWidth = pos.width * designScale;
    const currentDisplayHeight = pos.height * designScale;
    
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({ x: mouseX, y: mouseY });
    setInitialSize({
      width: currentDisplayWidth, // 🔧 Utiliser les dimensions affichées au lieu des intrinsèques
      height: currentDisplayHeight,
      scale: 1 // 🔧 Simplifier avec scale = 1 car on travaille avec les dimensions affichées
    });
    setInitialTransform(currentTransform);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !resizeStart || !initialSize || !initialTransform || selectedIdx === null || !isResizing || !resizeHandle) return;
    
    // 🚀 RESIZE FLUIDE : Mise à jour directe sans requestAnimationFrame pour plus de fluidité
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const deltaX = mouseX - resizeStart.x;
    const deltaY = mouseY - resizeStart.y;
    
    // Dimensions de départ pour les calculs relatifs
    const currentDisplayWidth = initialSize.width;
    const currentDisplayHeight = initialSize.height;
    
    // Calculer les nouvelles dimensions selon la poignée utilisée
    let newDisplayWidth = currentDisplayWidth;
    let newDisplayHeight = currentDisplayHeight;
    
    const aspectRatio = designNaturalSize.width / designNaturalSize.height;
    
    // Calculs simplifiés selon la direction du resize
    switch (resizeHandle) {
      case 'se': // Coin sud-est - le plus utilisé
        newDisplayWidth = Math.max(20, currentDisplayWidth + deltaX);
        newDisplayHeight = aspectRatioLocked 
          ? newDisplayWidth / aspectRatio 
          : Math.max(20, currentDisplayHeight + deltaY);
        break;
      case 'sw': // Coin sud-ouest
        newDisplayWidth = Math.max(20, currentDisplayWidth - deltaX);
        newDisplayHeight = aspectRatioLocked 
          ? newDisplayWidth / aspectRatio 
          : Math.max(20, currentDisplayHeight + deltaY);
        break;
      case 'ne': // Coin nord-est
        newDisplayWidth = Math.max(20, currentDisplayWidth + deltaX);
        newDisplayHeight = aspectRatioLocked 
          ? newDisplayWidth / aspectRatio 
          : Math.max(20, currentDisplayHeight - deltaY);
        break;
      case 'nw': // Coin nord-ouest
        newDisplayWidth = Math.max(20, currentDisplayWidth - deltaX);
        newDisplayHeight = aspectRatioLocked 
          ? newDisplayWidth / aspectRatio 
          : Math.max(20, currentDisplayHeight - deltaY);
        break;
      case 'e': // Côté est
        newDisplayWidth = Math.max(20, currentDisplayWidth + deltaX);
        if (aspectRatioLocked) newDisplayHeight = newDisplayWidth / aspectRatio;
        break;
      case 'w': // Côté ouest
        newDisplayWidth = Math.max(20, currentDisplayWidth - deltaX);
        if (aspectRatioLocked) newDisplayHeight = newDisplayWidth / aspectRatio;
        break;
      case 'n': // Côté nord
        newDisplayHeight = Math.max(20, currentDisplayHeight - deltaY);
        if (aspectRatioLocked) newDisplayWidth = newDisplayHeight * aspectRatio;
        break;
      case 's': // Côté sud
        newDisplayHeight = Math.max(20, currentDisplayHeight + deltaY);
        if (aspectRatioLocked) newDisplayWidth = newDisplayHeight * aspectRatio;
        break;
    }
    
    // 📐 NOUVEAU CALCUL COHÉRENT AVEC BACKEND
    const delim = delimitations[selectedIdx];
    const pos = computePxPosition(delim);

    // Calcul direct de la nouvelle échelle
    let newScale = Math.min(newDisplayWidth / pos.width, newDisplayHeight / pos.height);

    // Contrainte maximale pour rester dans la délimitation
    if (newScale > 1) newScale = 1;
    if (newScale < 0.1) newScale = 0.1; // Minimum de 10%

    // 🆕 Préparer les infos de délimitation
    const delimInfo: DelimitationInfo = {
      x: delim.x,
      y: delim.y,
      width: delim.width,
      height: delim.height,
      coordinateType: delim.coordinateType,
      imageWidth: naturalSize.width || 1200,
      imageHeight: naturalSize.height || 1200,
    };

    // 🆕 Calculer les dimensions absolues avec le nouveau scale
    const positioning = calculateDesignPositioning(
      delimInfo,
      { x: initialTransform.x, y: initialTransform.y, designScale: newScale },
      { width: pos.width, height: pos.height }
    );

    // Mise à jour immédiate pour la fluidité
    updateTransform(selectedIdx, {
      ...initialTransform,
      designScale: newScale,
      delimitationWidth: positioning.delimAbsolute.width,
      delimitationHeight: positioning.delimAbsolute.height,
    });
  }, [isResizing, resizeStart, initialSize, initialTransform, selectedIdx, delimitations, updateTransform, resizeHandle, aspectRatioLocked, designNaturalSize]);

  // 🆕 UseEffect pour le redimensionnement (ajouté après la déclaration des fonctions)
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp); // Arrêt si souris sort de la page
      
      // Empêcher la sélection de texte pendant le resize
      document.body.style.userSelect = 'none';
      // Curseur dynamique selon la direction du resize
      const getCursorForHandle = (handle: string) => {
        switch (handle) {
          case 'nw': case 'se': return 'nw-resize';
          case 'ne': case 'sw': return 'ne-resize';
          case 'n': case 's': return 'ns-resize';
          case 'e': case 'w': return 'ew-resize';
          default: return 'se-resize';
        }
      };
      document.body.style.cursor = getCursorForHandle(resizeHandle || 'se');
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isResizing, handleResizeMove, handleMouseUp]);

  // 🆕 Fonction pour obtenir le style de curseur selon la poignée

  // 🆕 Fonctions de rotation style design professionnel
  const handleRotationStart = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentTransform = getTransform(idx);
    const delim = delimitations[idx];
    const pos = computePxPosition(delim);
    
    // Centre de l'élément à faire tourner
    const centerX = pos.left + pos.width / 2;
    const centerY = pos.top + pos.height / 2;
    
    // Position de la souris
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculer l'angle initial
    const initialAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
    
    setIsRotating(true);
    setRotationStart({ x: mouseX, y: mouseY, angle: initialAngle });
    setInitialRotation(currentTransform.rotation || 0);
    setInitialTransform(currentTransform);
  };

  const handleRotationMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !rotationStart || !initialTransform || selectedIdx === null || !isRotating) return;
    
    // 🚀 ROTATION FLUIDE : Calculs optimisés et mise à jour directe
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delim = delimitations[selectedIdx];
    const pos = computePxPosition(delim);
    
    // Centre de l'élément pour la rotation
    const centerX = pos.left + pos.width / 2;
    const centerY = pos.top + pos.height / 2;
    
    // Calculer l'angle actuel par rapport au centre
    const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
    
    // Différence d'angle depuis le début de la rotation
    const angleDiff = currentAngle - rotationStart.angle;
    let newRotation = initialRotation + angleDiff;
    
    // Normaliser l'angle entre 0 et 360 degrés
    newRotation = ((newRotation % 360) + 360) % 360;
    
    // Snap à des angles de 15° si Shift est maintenu
    if (e.shiftKey) {
      const snapAngle = 15;
      newRotation = Math.round(newRotation / snapAngle) * snapAngle;
    }
    
    // Mise à jour immédiate pour la fluidité
    updateTransform(selectedIdx, {
      ...initialTransform,
      rotation: newRotation
    });
  }, [isRotating, rotationStart, initialTransform, selectedIdx, delimitations, updateTransform, initialRotation]);

  // 🆕 UseEffect pour la rotation
  useEffect(() => {
    if (isRotating) {
      document.addEventListener('mousemove', handleRotationMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp); // Arrêt si souris sort de la page
      
      // Empêcher la sélection de texte pendant la rotation
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'alias';
      
      return () => {
        document.removeEventListener('mousemove', handleRotationMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isRotating, handleRotationMove, handleMouseUp]);

  // 🆕 Gestion des raccourcis clavier pour la désélection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIdx !== null) {
        setSelectedIdx(null);
        setShowSizeControls(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIdx]);

  // 🆕 Calculer les dimensions de la délimitation en pixels absolus (image originale)
  // Utilisé pour calculer le bounding box à envoyer au backend
  const computeDelimitationInPixels = useCallback((delim: any) => {
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;
    const imgW = naturalSize.width || 1200;
    const imgH = naturalSize.height || 1200;

    return {
      width: isPixel ? delim.width : (delim.width / 100) * imgW,
      height: isPixel ? delim.height : (delim.height / 100) * imgH,
    };
  }, [naturalSize]);

  // 🆕 Fonction pour gérer le clic en dehors
  const handleContainerClick = (e: React.MouseEvent) => {
    // Vérifier si on clique dans une zone vide (pas sur un design ou ses contrôles)
    const clickedElement = e.target as HTMLElement;
    
    // Si on clique sur un design ou ses contrôles, ne pas désélectionner
    if (clickedElement.closest('.modern-design') || 
        clickedElement.closest('.modern-delimitation') ||
        clickedElement.classList.contains('modern-design') ||
        clickedElement.classList.contains('modern-delimitation')) {
      return;
    }
    
    // Si on arrive ici, c'est un clic dans le vide -> désélectionner
    if (selectedIdx !== null) {
      setSelectedIdx(null);
      setShowSizeControls(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Styles CSS intégrés simplifiés */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .modern-design-canvas {
            background: 
              radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, transparent 24%, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.03) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03) 76%, transparent 77%),
              linear-gradient(45deg, transparent 24%, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.03) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03) 76%, transparent 77%);
            background-size: 100% 100%, 20px 20px, 20px 20px;
            background-position: 0 0, 0 0, 10px 10px;
          }
          
          .modern-delimitation {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px dashed rgba(209, 213, 219, 0.6);
            border-radius: 8px;
            overflow: visible;
            backdrop-filter: blur(2px);
          }
          
          .modern-delimitation:hover {
            border-color: rgba(59, 130, 246, 0.8);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
          }
          
          .modern-delimitation.selected {
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.08);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1);
            backdrop-filter: blur(4px);
          }
          
          .modern-design {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 6px;
            position: relative;
            user-select: none;
          }
          
          .modern-design:hover {
            filter: brightness(1.05);
          }
          
          .modern-design.selected {
            filter: brightness(1.05) drop-shadow(0 0 12px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
          }
          
          .modern-design.dragging {
            transition: none;
          }
          
          
          .pulse-dot {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `
      }} />
      
      {/* Indicateur de sauvegarde moderne */}
      {isSaving && (
        <div className="absolute top-3 right-3 z-30 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-lg">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sauvegarde automatique...
        </div>
      )}
      
      
      
      {/* Container principal avec image de fond */}
      <div 
        ref={containerRef} 
        className="modern-design-canvas relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl"
        onClick={handleContainerClick}
      >
        <img
          ref={imgRef}
          src={view.url || view.imageUrl}
          alt="Vue produit"
          className="w-full h-full object-contain"
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />

        {/* Délimitations avec designs déplaçables style Illustrator */}
        {designUrl && delimitations.map((delim: any, idx: number) => {
          const pos = computePxPosition(delim);
          if (pos.width <= 0 || pos.height <= 0) return null;
          
          const t = getTransform(idx);
          const isSelected = selectedIdx === idx;
          const isHovered = hoveredIdx === idx;
          
          // 📐 NOUVEAU CALCUL COHÉRENT AVEC BACKEND
          // Utilise le système de bounding box unifié
          const designScale = t.designScale || 0.8;

          // 🆕 Préparer les infos de délimitation
          const delimInfo: DelimitationInfo = {
            x: delim.x,
            y: delim.y,
            width: delim.width,
            height: delim.height,
            coordinateType: delim.coordinateType,
            imageWidth: naturalSize.width || 1200,
            imageHeight: naturalSize.height || 1200,
          };

          // 🆕 Calculer positionnement avec le système unifié
          const positioning = calculateDesignPositioning(
            delimInfo,
            { x: t.x, y: t.y, designScale },
            { width: pos.width, height: pos.height }
          );

          // Dimensions d'affichage viewport (pour le CSS)
          const designWidth = pos.width * designScale;
          const designHeight = pos.height * designScale;

          // Offsets contraints pour l'affichage
          // On scale les offsets absolus au viewport
          const x = (t.x / positioning.scaleRatio);
          const y = (t.y / positioning.scaleRatio);
          
          return (
            <div
              key={idx}
              className={`modern-delimitation absolute ${
                isSelected ? 'selected' : isHovered ? 'hovered' : ''
              }`}
              style={{
                left: pos.left,
                top: pos.top,
                width: pos.width,
                height: pos.height,
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              title={`Zone de design ${idx + 1} - ${delim.name || 'Sans nom'}`}
            >
             
              
              {/* Design déplaçable style Illustrator épuré */}
              {/* 📐 POSITIONNEMENT CSS - ÉQUIVALENT À L'ALGORITHME BACKEND */}
              {/* - left: 50%, top: 50% → Positionne le coin supérieur gauche au centre de la délimitation */}
              {/* - translate(-50%, -50%) → Centre le design sur ce point */}
              {/* - translate(${x}px, ${y}px) → Applique l'offset depuis le centre */}
              {/* - Résultat: position finale = delimCenter + offset (comme le backend) */}
              <div
                className={`modern-design absolute ${isSelected ? 'selected' : ''} ${isDragging && selectedIdx === idx ? 'dragging' : ''}`}
                onMouseDown={e => handleDesignMouseDown(e, idx)}
                onTouchStart={e => handleDesignTouchStart(e, idx)}
                style={{
                  left: '50%',  // Position au centre horizontal de la délimitation
                  top: '50%',   // Position au centre vertical de la délimitation
                  width: designWidth,   // Largeur du conteneur calculée (delimWidth × scale)
                  height: designHeight, // Hauteur du conteneur calculée (delimHeight × scale)
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${t.rotation || 0}deg)`,
                  transformOrigin: 'center center',
                  cursor: isDragging && selectedIdx === idx ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
                title={isSelected 
                  ? `Design sélectionné - Glissez pour déplacer, utilisez les poignées pour redimensionner/faire tourner, Échap pour désélectionner` 
                  : `Cliquez pour sélectionner ce design`
                }
              >
                {/* Image du design avec object-fit: contain */}
                {/* 📐 REDIMENSIONNEMENT - ÉQUIVALENT À Sharp fit: 'inside' */}
                {/* - object-contain préserve l'aspect ratio du design */}
                {/* - Le design est centré dans le conteneur (designWidth × designHeight) */}
                {/* - Exactement comme le backend fait avec Sharp.resize({ fit: 'inside' }) */}
                <img
                  src={designUrl}
                  alt="Design"
                  className="object-contain pointer-events-none select-none"
                    style={{
                    width: '100%',  // 100% du conteneur calculé
                    height: '100%', // 100% du conteneur calculé
                    transform: `scale(1)`, // Pas de scale supplémentaire
                  }}
                  draggable={false}
                />
              
                {/* 🎨 Poignées de redimensionnement style Illustrator moderne */}
                {isSelected && selectedIdx === idx && (
                <>
                    {/* Poignées des coins - Style Illustrator avec gradients et ombres */}
                  <div 
                      className="absolute w-4 h-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-nw-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -top-2 -left-2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 'nw')}
                      title="Redimensionner (coin nord-ouest)"
                  />
                  <div 
                      className="absolute w-4 h-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-ne-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -top-2 -right-2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 'ne')}
                      title="Redimensionner (coin nord-est)"
                    />
                    <div
                      className="absolute w-4 h-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-sw-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -bottom-2 -left-2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 'sw')}
                      title="Redimensionner (coin sud-ouest)"
                    />
                    <div
                      className="absolute w-4 h-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-se-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -bottom-2 -right-2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 'se')}
                      title="Redimensionner (coin sud-est)"
                    />
                    
                    {/* Poignées des côtés - Plus petites et élégantes */}
                    <div
                      className="absolute w-4 h-3 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-ns-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -top-1.5 left-1/2 -translate-x-1/2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 'n')}
                      title="Redimensionner (côté nord)"
                    />
                    <div
                      className="absolute w-3 h-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-ew-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -right-1.5 top-1/2 -translate-y-1/2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 'e')}
                      title="Redimensionner (côté est)"
                    />
                    <div
                      className="absolute w-4 h-3 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-ns-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -bottom-1.5 left-1/2 -translate-x-1/2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 's')}
                      title="Redimensionner (côté sud)"
                    />
                    <div
                      className="absolute w-3 h-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded cursor-ew-resize hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:border-blue-600 hover:shadow-lg -left-1.5 top-1/2 -translate-y-1/2 z-15 transition-all duration-200"
                      onMouseDown={e => handleResizeStart(e, idx, 'w')}
                      title="Redimensionner (côté ouest)"
                    />
                    
                    {/* 🆕 Poignée de rotation style Illustrator - Plus visible */}
                    <div
                      className="absolute w-8 h-8 bg-gradient-to-br from-white to-gray-50 border-2 border-blue-500 rounded-full cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:border-blue-600 shadow-lg hover:shadow-xl -top-12 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center transition-all duration-200"
                      onMouseDown={e => handleRotationStart(e, idx)}
                      title="Faire tourner le design (Shift pour snap 15°)"
                    >
                      <RotateCw className="w-4 h-4 text-blue-600" />
                      {/* Ligne de connexion vers le design */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-500"></div>
                    </div>
                    
                    {/* Bordure de sélection style Illustrator */}
                    <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none shadow-[0_0_0_1px_rgba(255,255,255,0.8)]" />
                    
                    {/* Overlay de sélection subtil */}
                    <div className="absolute inset-0 bg-blue-500/5 rounded pointer-events-none" />
                  </>
                )}
              </div>
              
              {/* Indicateur de taille style Illustrator moderne */}
              {isSelected && !isDragging && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-900 to-black text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg border border-gray-600 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  {Math.round(designWidth)}×{Math.round(designHeight)}px
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panneau de contrôles style Illustrator moderne */}
      <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 shadow-lg border border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetTransforms}
            className="bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Move className="h-4 w-4 mr-2" />
            Réinitialiser positions
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={saveNow}
            className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-300 text-blue-700 hover:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder maintenant
          </Button>
        
          {/* 🎨 Contrôles de sélection style Illustrator moderne */}
          {selectedIdx !== null && (
            <>
              <div className="w-px h-6 bg-gray-300"></div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedIdx(null);
                  setShowSizeControls(false);
                }}
                className="bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-300 text-red-700 hover:border-red-400 transition-all duration-300 shadow-md hover:shadow-lg"
                title="Désélectionner le design actuel (ou appuyez sur Échap)"
              >
                <X className="h-4 w-4 mr-2" />
                Désélectionner
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSizeControls(!showSizeControls)}
                className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-300 text-purple-700 hover:border-purple-400 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Ruler className="h-4 w-4 mr-2" />
                Dimensions
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                className={`transition-all duration-300 shadow-md hover:shadow-lg ${
                  aspectRatioLocked 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-blue-500 text-white' 
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-current rounded-sm" />
                  <span className="text-xs">Verrouiller proportions</span>
                </div>
              </Button>
            </>
          )}
        
        </div>
        
        {/* Barre d'informations style Illustrator */}
        <div className="mt-4 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 px-6 py-3 rounded-xl text-sm border border-slate-300 shadow-lg flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">{delimitations.length}</span> zone{delimitations.length > 1 ? 's' : ''}
          </div>
          
          {selectedIdx !== null ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Zone {selectedIdx + 1} sélectionnée</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Échap pour désélectionner</span>
            </div>
          ) : (
            <span className="text-slate-500 italic">
              Cliquez sur un design pour le sélectionner
            </span>
          )}
        </div>
        
        {lastSaveTime && (
          <div className="mt-3 flex justify-center">
            <div className="text-xs text-slate-600 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200 shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Dernière sauvegarde: {new Date(lastSaveTime).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* 🎨 Panneau de contrôles numériques style Illustrator moderne */}
      {showSizeControls && selectedIdx !== null && (
        <div className="mt-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Ruler className="h-4 w-4 text-white" />
            </div>
            <span>Contrôles de dimensions</span>
            <span className="text-sm font-normal bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Zone {selectedIdx + 1}</span>
          </h4>
          
          <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
            {(() => {
              const currentTransform = getTransform(selectedIdx);
              const delim = delimitations[selectedIdx];
              const pos = computePxPosition(delim);
              
              // 🎯 NOUVEAU SYSTÈME : Calculer les dimensions actuelles basées sur le ratio
              const designScale = currentTransform.designScale || 0.8;
              const currentWidth = Math.round(pos.width * designScale);
              const currentHeight = Math.round(pos.height * designScale);
              
              return (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                      Largeur (px)
                    </label>
                    <input
                      type="number"
                      value={currentWidth}
                      onChange={(e) => {
                        const newWidth = Number(e.target.value);
                        const newHeight = aspectRatioLocked 
                          ? Math.round(newWidth / (designNaturalSize.width / designNaturalSize.height))
                          : currentHeight;
                        
                        // 🎯 NOUVEAU SYSTÈME : Sauvegarder le ratio basé sur les nouvelles dimensions
                        const newScale = Math.min(newWidth / pos.width, newHeight / pos.height);
                        const delimInPixels = computeDelimitationInPixels(delim); // 🆕 NOUVEAU: Dimensions absolues
                        updateTransform(selectedIdx, {
                          ...currentTransform,
                          designScale: newScale,  // 🎯 Sauvegarder le ratio par rapport à la délimitation
                          containerWidth: delimInPixels.width * newScale,   // 🆕 NOUVEAU: Conteneur recalculé
                          containerHeight: delimInPixels.height * newScale, // 🆕 NOUVEAU: Conteneur recalculé
                          delimitationWidth: delimInPixels.width,   // 🆕 NOUVEAU: Dimensions de la délimitation
                          delimitationHeight: delimInPixels.height, // 🆕 NOUVEAU: Dimensions de la délimitation
                        });
                      }}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      min="20"
                      max="500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                      Hauteur (px)
                    </label>
                    <input
                      type="number"
                      value={currentHeight}
                      onChange={(e) => {
                        const newHeight = Number(e.target.value);
                        const newWidth = aspectRatioLocked 
                          ? Math.round(newHeight * (designNaturalSize.width / designNaturalSize.height))
                          : currentWidth;
                        
                        // 🎯 NOUVEAU SYSTÈME : Sauvegarder le ratio basé sur les nouvelles dimensions
                        const newScale = Math.min(newWidth / pos.width, newHeight / pos.height);
                        const delimInPixels = computeDelimitationInPixels(delim); // 🆕 NOUVEAU: Dimensions absolues
                        updateTransform(selectedIdx, {
                          ...currentTransform,
                          designScale: newScale,  // 🎯 Sauvegarder le ratio par rapport à la délimitation
                          containerWidth: delimInPixels.width * newScale,   // 🆕 NOUVEAU: Conteneur recalculé
                          containerHeight: delimInPixels.height * newScale, // 🆕 NOUVEAU: Conteneur recalculé
                          delimitationWidth: delimInPixels.width,   // 🆕 NOUVEAU: Dimensions de la délimitation
                          delimitationHeight: delimInPixels.height, // 🆕 NOUVEAU: Dimensions de la délimitation
                        });
                      }}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      min="20"
                      max="500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                      Échelle (%)
                    </label>
                    <input
                      type="number"
                      value={Math.round(currentTransform.designScale! * 100)}
                      onChange={(e) => {
                        const newScale = Number(e.target.value) / 100;

                        // 🎯 NOUVEAU SYSTÈME : Sauvegarder directement le nouveau ratio
                        const delimInPixels = computeDelimitationInPixels(delim); // 🆕 NOUVEAU: Dimensions absolues
                        updateTransform(selectedIdx, {
                          ...currentTransform,
                          designScale: newScale,  // 🎯 Sauvegarder le nouveau ratio directement
                          containerWidth: delimInPixels.width * newScale,   // 🆕 NOUVEAU: Conteneur recalculé
                          containerHeight: delimInPixels.height * newScale, // 🆕 NOUVEAU: Conteneur recalculé
                          delimitationWidth: delimInPixels.width,   // 🆕 NOUVEAU: Dimensions de la délimitation
                          delimitationHeight: delimInPixels.height, // 🆕 NOUVEAU: Dimensions de la délimitation
                        });
                      }}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      min="10"
                      max="200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rotation (°)
                    </label>
                    <input
                      type="number"
                      value={Math.round(currentTransform.rotation || 0)}
                      onChange={(e) => {
                        const newRotation = Number(e.target.value);
                        updateTransform(selectedIdx, {
                          ...currentTransform,
                          rotation: ((newRotation % 360) + 360) % 360 // Normaliser entre 0-360
                        });
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      min="0"
                      max="360"
                      step="15"
                    />
                  </div>
                </>
              );
            })()}
          </div>
          
          {/* 🆕 Ligne additionnelle avec ratio d'aspect et boutons de rotation rapide */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ratio d'aspect
              </label>
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                {(designNaturalSize.width / designNaturalSize.height).toFixed(2)}:1
              </div>
            </div>
            
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rotation rapide
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentTransform = getTransform(selectedIdx);
                    updateTransform(selectedIdx, {
                      ...currentTransform,
                      rotation: ((currentTransform.rotation || 0) - 90 + 360) % 360
                    });
                  }}
                  className="text-xs h-7 px-2"
                >
                  -90°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentTransform = getTransform(selectedIdx);
                    updateTransform(selectedIdx, {
                      ...currentTransform,
                      rotation: ((currentTransform.rotation || 0) + 90) % 360
                    });
                  }}
                  className="text-xs h-7 px-2"
                >
                  +90°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateTransform(selectedIdx, {
                      ...getTransform(selectedIdx),
                      rotation: 0
                    });
                  }}
                  className="text-xs h-7 px-2"
                >
                  0°
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Taille originale: {designNaturalSize.width}×{designNaturalSize.height}px
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const optimalSize = calculateOptimalDesignSize(designNaturalSize, []);
                updateTransform(selectedIdx, {
                  ...getTransform(selectedIdx),
                  designWidth: optimalSize.width,
                  designHeight: optimalSize.height,
                  designScale: optimalSize.scale
                });
              }}
              className="text-xs"
            >
              Taille optimale
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple utility to format errors

interface ProductViewWithDesignProps {
  view: any; // contains url & delimitations
  designUrl: string;
  productId?: number; // 🆕 Ajout pour identifier le produit
  products?: any[];
  vendorDesigns?: any[];
  designCropInfo?: {
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    boundingBox: { x: number; y: number; width: number; height: number };
  } | null;
}

// Composant spécial pour la capture d'image - Version propre sans interface
const ProductViewForCapture: React.FC<ProductViewWithDesignProps> = ({ view, designUrl, productId = 0, products = [], vendorDesigns = [] }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 🆕 Utilisation du hook pour les propriétés du design
  const { designProperties } = useDesignProperties(designUrl, products);
  
  // 🆕 Utilisation du hook pour récupérer les transformations sauvegardées
  const { getTransform } = useDesignTransforms(productId, designUrl, products, vendorDesigns);

  // Observer natural image size
  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
    }
  }, [view.url]);

  // Observe container resize
  React.useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const delimitations = (view.delimitations || []) as Array<any>;

  const computePxPosition = (delim: any) => {
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = naturalSize.width || 1200;
    const imgH = naturalSize.height || 1200;

    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    const { width: contW, height: contH } = containerSize;
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

    const imgRatio = imgW / imgH;
    const contRatio = contW / contH;

    let dispW: number, dispH: number, offsetX: number, offsetY: number;
    if (imgRatio > contRatio) {
      dispW = contW;
      dispH = contW / imgRatio;
      offsetX = 0;
      offsetY = (contH - dispH) / 2;
    } else {
      dispH = contH;
      dispW = contH * imgRatio;
      offsetX = (contW - dispW) / 2;
      offsetY = 0;
    }

    return {
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };
  };

  return (
    <div 
      ref={containerRef} 
      className="relative aspect-square bg-transparent"
      style={{ width: '400px', height: '400px' }}
    >
      {/* Image du produit - propre sans bordure */}
      <img
        ref={imgRef}
        src={view.url}
        alt="Produit"
        className="w-full h-full object-contain"
        style={{ border: 'none', outline: 'none' }}
        onLoad={(e) => {
          const img = e.currentTarget;
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        }}
      />

      {/* Design intégré - propre sans bordures ni contrôles avec dimensions intrinsèques */}
      {designUrl && delimitations.map((delim: any, idx: number) => {
        const pos = computePxPosition(delim);
        if (pos.width <= 0 || pos.height <= 0) return null;
        
        // 🆕 Récupérer les transformations et dimensions sauvegardées
        const t = getTransform(idx);
        // 🎯 SYSTÈME DE RATIO CONSTANT : Le design utilise toujours le même pourcentage de la délimitation
        // Comme "le produit et l'image sont fusionnés", le design garde sa proportion constante
        const designScale = t.designScale || designProperties.scale || 0.8; // Ratio constant : 80% de la délimitation par défaut
        const designWidth = pos.width * designScale;
        const designHeight = pos.height * designScale;
        
        // Contraintes pour que le design reste dans la délimitation
        const maxX = (pos.width - designWidth) / 2;
        const minX = -(pos.width - designWidth) / 2;
        const maxY = (pos.height - designHeight) / 2;
        const minY = -(pos.height - designHeight) / 2;
        
        const x = Math.max(minX, Math.min(t.x, maxX));
        const y = Math.max(minY, Math.min(t.y, maxY));
        
        return (
          <div
            key={idx}
            className="absolute overflow-hidden"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              border: 'none',
              outline: 'none',
            }}
          >
            {/* Design appliqué avec dimensions intrinsèques et position sauvegardée */}
            <div
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: designWidth,
                height: designHeight,
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${t.rotation || 0}deg)`,
                transformOrigin: 'center center',
              }}
            >
            <img
              src={designUrl}
              alt="Design"
              className="object-contain"
              style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(1)`, // Pas de scaling supplémentaire
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
              draggable={false}
            />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Display a single view image with the design rendered inside each delimitation
const ProductViewWithDesign: React.FC<ProductViewWithDesignProps> = ({ view, designUrl, productId = 0, products = [], vendorDesigns = [], designCropInfo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [useModernCanvas, setUseModernCanvas] = useState(true); // 🆕 Mode moderne par défaut
  const { toast } = useToast();


  // 🆕 Ref pour l'animation
  const animationFrameId = useRef<number | null>(null);

  // 🆕 Utilisation du hook pour les propriétés du design
  const { designProperties, designNaturalSize } = useDesignProperties(designUrl, products);

  // 🆕 Utilisation du hook pour gérer les transformations avec sauvegarde automatique
  const {
    updateTransform,
    getTransform,
    resetTransforms,
    saveNow,
    isSaving,
    lastSaveTime
  } = useDesignTransforms(productId, designUrl, products, vendorDesigns);

  const dragState = useRef<{ delimIdx: number | null; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Observer natural image size
  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight });
    }
  }, [(view as any).url || (view as any).imageUrl]);

  // Observe container resize
  React.useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const delimitations = (view.delimitations || []) as Array<any>;

  const computePxPosition = (delim: any) => {
    const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;

    const imgW = naturalSize.width || 1200;
    const imgH = naturalSize.height || 1200;

    const pct = {
      x: isPixel ? (delim.x / imgW) * 100 : delim.x,
      y: isPixel ? (delim.y / imgH) * 100 : delim.y,
      w: isPixel ? (delim.width / imgW) * 100 : delim.width,
      h: isPixel ? (delim.height / imgH) * 100 : delim.height,
    };

    const { width: contW, height: contH } = containerSize;
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

    const imgRatio = imgW / imgH;
    const contRatio = contW / contH;

    let dispW: number, dispH: number, offsetX: number, offsetY: number;
    if (imgRatio > contRatio) {
      dispW = contW;
      dispH = contW / imgRatio;
      offsetX = 0;
      offsetY = (contH - dispH) / 2;
    } else {
      dispH = contH;
      dispW = contH * imgRatio;
      offsetX = (contW - dispW) / 2;
      offsetY = 0;
    }

    return {
      left: offsetX + (pct.x / 100) * dispW,
      top: offsetY + (pct.y / 100) * dispH,
      width: (pct.w / 100) * dispW,
      height: (pct.h / 100) * dispH,
    };
  };

  const handleMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    const currentTransform = getTransform(idx);
    dragState.current = {
      delimIdx: idx,
      startX: e.clientX,
      startY: e.clientY,
      origX: currentTransform.x,
      origY: currentTransform.y,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current) return;
    const { delimIdx, startX, startY, origX, origY } = dragState.current;
    if (delimIdx === null) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const currentTransform = getTransform(delimIdx); // 🆕 NOUVEAU: Préserver les autres propriétés
    updateTransform(delimIdx, {
      ...currentTransform, // 🆕 NOUVEAU: Préserver toutes les propriétés existantes
      x: origX + dx,
      y: origY + dy
    });
  }, [updateTransform, getTransform]);

  const handleMouseUp = useCallback(() => {
    // 🔧 Annuler toute animation en cours pour un nettoyage propre
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    // 🆕 Sauvegarder immédiatement la position finale après le drag (mode classique)
    if (dragState.current !== null) {
      console.log('💾 Sauvegarde automatique de la position finale après interaction (mode classique)');
      saveNow();
    }

    // Reset interaction states - ARRÊT IMMÉDIAT comme dans Illustrator
    dragState.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, saveNow]);

  // 🆕 Mode moderne par défaut avec possibilité de basculer vers le mode classique
  if (useModernCanvas && designUrl && delimitations.length > 0) {
    return (
      <div className="relative">
        {/* Toggle pour basculer entre les modes */}
        

        {/* Canvas moderne avec délimitations */}
        <ModernDesignCanvas
          view={view}
          designUrl={designUrl}
          productId={productId}
          products={products}
          vendorDesigns={vendorDesigns}
          cropInfo={designCropInfo}
          className="w-full"
        />
      </div>
    );
  }

  // Mode classique avec dimensions intrinsèques (même logique que le mode moderne)
  return (
    <div ref={containerRef} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
      {/* 🆕 Toggle pour basculer vers le mode moderne */}
      <div className="absolute top-2 right-2 z-30 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUseModernCanvas(true);
              toast({
                title: "🎨 Mode moderne activé !",
              description: "Interface améliorée avec délimitations visibles et contrôles avancés.",
              duration: 3000,
              });
            }}
            className="bg-white/90 hover:bg-white text-xs"
            title="Activer le mode moderne avec zone délimitée"
          >
            <Palette className="h-3 w-3 mr-1" />
            Mode moderne
          </Button>
        {isSaving && (
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sauvegarde...
          </div>
        )}
      </div>
      
      <img
        ref={imgRef}
        src={(view as any).url || (view as any).imageUrl}
        alt="Vue produit"
        className="w-full h-full object-contain"
        onLoad={(e) => {
          const img = e.currentTarget;
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        }}
      />

      {/* 🆕 Mode classique avec dimensions intrinsèques du design */}
      {designUrl && delimitations.map((delim: any, idx: number) => {
        const pos = computePxPosition(delim);
        if (pos.width <= 0 || pos.height <= 0) return null;
        
        const t = getTransform(idx);
        
        // 🆕 MODIFICATION : Utiliser les dimensions intrinsèques du design avec contraintes strictes
        // 🎯 SYSTÈME DE RATIO CONSTANT : Le design utilise toujours le même pourcentage de la délimitation
        // Comme "le produit et l'image sont fusionnés", le design garde sa proportion constante
        const designScale = t.designScale || designProperties.scale || 0.8; // Ratio constant : 80% de la délimitation par défaut
        const designWidth = pos.width * designScale;
        const designHeight = pos.height * designScale;
        
        // Limiter le déplacement pour que le design reste entièrement dans la délimitation
        const maxX = (pos.width - designWidth) / 2;
        const minX = -(pos.width - designWidth) / 2;
        const maxY = (pos.height - designHeight) / 2;
        const minY = -(pos.height - designHeight) / 2;
        
        const x = Math.max(minX, Math.min(t.x, maxX));
        const y = Math.max(minY, Math.min(t.y, maxY));
        
        return (
          <div
            key={idx}
            className={`absolute overflow-hidden group ${hoveredIdx === idx ? 'z-10' : ''}`}
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              cursor: 'grab',
            }}
            onMouseDown={e => handleMouseDown(e, idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            tabIndex={0}
            title="Déplacez le design - Mode classique avec dimensions intrinsèques"
          >
            <div
              className={`absolute inset-0 pointer-events-none rounded border-2 transition-all duration-150 ${hoveredIdx === idx ? 'border-indigo-500 shadow-lg' : 'border-transparent'}`}
              style={{ zIndex: 2 }}
            />
            <div
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: designWidth,
                height: designHeight,
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${t.rotation || 0}deg)`,
                transformOrigin: 'center center',
              }}
            >
            <img
              src={designUrl}
              alt="Design"
              className="object-contain pointer-events-none select-none"
              style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(1)`, // Pas de scaling supplémentaire
                transition: 'box-shadow 0.2s',
                boxShadow: hoveredIdx === idx ? '0 0 0 2px #6366f1' : undefined,
              }}
              draggable={false}
            />
            </div>
            
            {/* 🆕 Indicateur de dimensions en mode classique */}
            {hoveredIdx === idx && (
              <div className="absolute -bottom-5 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">
                {Math.round(designWidth)}×{Math.round(designHeight)}px
              </div>
            )}
          </div>
        );
      })}

      {/* 🆕 Boutons de contrôle avec même logique */}
      <div className="absolute bottom-2 left-2 flex gap-2 z-20">
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-xs bg-white/90 hover:bg-white"
          onClick={resetTransforms}
          title="Réinitialiser les positions"
        >
          <Move className="h-3 w-3 mr-1" />
          Reset
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-xs bg-white/90 hover:bg-white"
          onClick={saveNow}
          title="Sauvegarder maintenant"
        >
          <Save className="h-3 w-3 mr-1" />
          Sauver
        </Button>
      </div>
    </div>
  );
};

interface Size {
  id: number;
  sizeName: string;
  isActive: boolean;
}

interface Color {
  id: number;
  name: string;
  colorCode: string;
  isActive: boolean;
}

// Composant spécialement conçu pour les vendeurs (sans étape délimitations)
const VendorProductForm: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: 0,
    colorVariations: [] as any[],
    sizes: [] as any[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, title: 'Informations de base', icon: Package },
    { id: 2, title: 'Variations de couleur', icon: Palette },
    { id: 3, title: 'Thèmes et tailles', icon: Store },
    { id: 4, title: 'Validation finale', icon: Check }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Ici on appellerait l'API pour créer le produit vendeur
      console.log('Création produit vendeur:', formData);
      
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Produit créé avec succès !",
        description: "Votre produit a été ajouté à votre catalogue.",
        variant: "success",
        duration: 5000,
      });

      // Reset du formulaire
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        categoryId: 0,
        colorVariations: [],
        sizes: []
      });
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: "Erreur lors de la création",
        description: "Une erreur est survenue lors de la création du produit.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info vendeur */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Mode Vendeur</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Créez vos produits sans zones de personnalisation. Vos clients pourront commander vos produits tels quels.
            </p>
          </div>
        </div>
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isActive 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-px mx-4 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Contenu des étapes */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations de base</h3>
            
            <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  placeholder="Ex: T-shirt personnalisé"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prix (FCFA) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value === '' ? 0 : Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                placeholder="Décrivez votre produit..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock disponible
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                placeholder="100"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Variations de couleur</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cette étape sera développée prochainement. Pour l'instant, votre produit sera créé avec une couleur par défaut.
            </p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thèmes et tailles</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cette étape sera développée prochainement. Votre produit sera classé dans un thème par défaut.
            </p>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Validation finale</h3>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Résumé de votre produit</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                  <span className="font-medium">{formData.name || 'Non défini'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Prix:</span>
                  <span className="font-medium">{formData.price} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                  <span className="font-medium">{formData.stock} unités</span>
                </div>
                {formData.description && (
                  <div className="pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <p className="text-sm mt-1">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Votre produit est prêt à être créé !
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Précédent
        </Button>

        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            disabled={currentStep === 1 && (!formData.name || !formData.price)}
          >
            Suivant
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name || !formData.price}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Créer le produit
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const SellDesignPage: React.FC = () => {
  console.log('📄 SellDesignPage chargée!');
  
  const { toast } = useToast();
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designUrl, setDesignUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [savingProductIds, setSavingProductIds] = useState<number[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [editStates, setEditStates] = useState<Record<number, Partial<Product>>>({});
  const [productSizes, setProductSizes] = useState<Record<number, Size[]>>({});
  const [productColors, setProductColors] = useState<Record<number, Color[]>>({});
  const [selectedColorIds, setSelectedColorIds] = useState<Record<number, number>>({});
  const [defaultColorIds, setDefaultColorIds] = useState<Record<number, number>>({});
  const [priceErrors, setPriceErrors] = useState<Record<number, string>>({});
  const [expandedPricingIds, setExpandedPricingIds] = useState<Record<number, boolean>>({});
  const [customProfits, setCustomProfits] = useState<Record<number, number>>({});
  const [editingProfitIds, setEditingProfitIds] = useState<Record<number, boolean>>({});
  const ALL_COLORS = 'ALL';
  const [filterColorName, setFilterColorName] = useState<string>(ALL_COLORS);
  
  // Nouvel état pour stocker les prix de base (admin) - ne change jamais côté vendeur
  const [basePrices, setBasePrices] = useState<Record<number, number>>({});
  
  // 🆕 Valeurs brutes saisies dans l'input prix (permet champ vide)
  const [pricingInputValues, setPricingInputValues] = useState<Record<number, string>>({});

  // Déclarer d'abord les états nécessaires aux helpers
  // 🔒 NOUVEAU: État pour stocker les prix de revient mockup FIXES (ne changent jamais)
  const [prixDeRevientOriginaux, setPrixDeRevientOriginaux] = useState<Record<number, number>>({});
  // 🆕 États pour la commission du vendeur
  const [vendorCommission, setVendorCommission] = useState<number | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);

  // 🆕 États pour les prix par taille
  const [sizePricingByProduct, setSizePricingByProduct] = useState<Record<number, Record<string, { salePrice: number; profit: number }>>>({});

  // 🧮 Helpers unifiés de calcul (source de vérité cohérente)
  const getSalePrice = useCallback((p: Product): number => {
    const editedPrice = editStates[p.id]?.price as number | undefined;

    // ✅ CORRIGÉ: Si on a un prix édité, l'utiliser
    if (editedPrice !== undefined && editedPrice > 0) {
      return editedPrice;
    }

    // ✅ NOUVEAU: Si on a un bénéfice personnalisé, calculer le prix de vente
    const customProfit = customProfits[p.id];
    if (customProfit !== undefined && customProfit >= 0) {
      const costPrice = prixDeRevientOriginaux[p.id] ?? p.price;
      return costPrice + customProfit;
    }

    // Sinon, utiliser le prix suggéré ou le prix de base
    return p.suggestedPrice ?? p.price;
  }, [editStates, customProfits, prixDeRevientOriginaux]);

  const getCost = useCallback((p: Product): number => {
    // Utiliser prixDeRevientOriginaux s'il existe, sinon utiliser le prix du produit comme coût de base
    return prixDeRevientOriginaux[p.id] ?? p.price;
  }, [prixDeRevientOriginaux]);

  const getProfit = useCallback((p: Product): number => {
    const salePrice = getSalePrice(p);
    const costPrice = getCost(p);

    // ✅ NOUVEAU: Validation - éviter les calculs invalides
    if (!Number.isFinite(salePrice) || !Number.isFinite(costPrice) || salePrice < 0 || costPrice < 0) {
      return 0;
    }

    return Math.max(0, salePrice - costPrice);
  }, [getSalePrice, getCost]);

  const getCommissionAmount = useCallback((p: Product): number => {
    // ✅ CORRIGÉ: Commission = ce qui reste après la part vendeur
    const rawRate = (vendorCommission ?? 40);
    const clampedRate = Math.max(1, Math.round(rawRate));
    const salePrice = getSalePrice(p); // Prix de vente total

    // Validation
    if (!Number.isFinite(salePrice) || salePrice < 0 || !Number.isFinite(clampedRate)) {
      return 0;
    }

    const vendorShare = (salePrice * clampedRate) / 100; // Part du vendeur
    return Math.max(0, salePrice - vendorShare); // Ce qui reste pour l'admin
  }, [vendorCommission, getSalePrice]);

  const getVendorRevenue = useCallback((p: Product): number => {
    // ✅ CORRIGÉ: Revenus vendeur = bénéfice - commission
    // Le vendeur reçoit son bénéfice moins la commission de l'admin
    const rawRate = (vendorCommission ?? 40);
    const clampedRate = Math.max(1, Math.round(rawRate));
    const profit = getProfit(p); // Bénéfice du vendeur (customProfit)

    // ✅ NOUVEAU: Validation - ne pas afficher si les données sont invalides
    if (!Number.isFinite(profit) || profit < 0 || !Number.isFinite(clampedRate)) {
      return 0;
    }

    // Commission calculée sur le bénéfice
    const commission = (profit * clampedRate) / 100;
    const vendorRevenue = profit - commission;

    return Math.max(0, vendorRevenue); // Ce que le vendeur reçoit réellement
  }, [vendorCommission, getProfit]);

  // Nouvel état pour gérer le mode sélectionné
  const [selectedMode, setSelectedMode] = useState<'design' | 'product' | null>(null);

  // Nouveaux états pour gérer le prix du design
  const [showDesignPriceModal, setShowDesignPriceModal] = useState(false);
  const [designPrice, setDesignPrice] = useState<number>(0);
  const [designName, setDesignName] = useState<string>('');
  const [designDescription, setDesignDescription] = useState<string>('');
  const [tempDesignFile, setTempDesignFile] = useState<File | null>(null);
  const [checkerFile, setCheckerFile] = useState<File | null>(null);
  const [fileIsValid, setFileIsValid] = useState(false);
  const [tempDesignUrl, setTempDesignUrl] = useState<string>('');
  const [designPriceError, setDesignPriceError] = useState<string>('');
  const [designNameError, setDesignNameError] = useState<string>('');
  const [designCategoryId, setDesignCategoryId] = useState<number | null>(null);
  const [designCategoryError, setDesignCategoryError] = useState<string>('');

  // Designs existants du vendeur
  const [loadingExistingDesigns, setLoadingExistingDesigns] = useState(false);
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  
  // (déplacé plus haut avec les helpers)

  // Nouveaux états pour gérer le statut de validation du design
  const [designValidationStatus, setDesignValidationStatus] = useState<{
    isValidated: boolean;
    needsValidation: boolean;
    message: string;
  }>({ isValidated: false, needsValidation: false, message: '' });
  
  // Nouvel état pour les designs existants avec informations de validation
  const [existingDesignsWithValidation, setExistingDesignsWithValidation] = useState<(Design & { isValidated?: boolean; validatedAt?: string; rejectionReason?: string })[]>([]);

  // 🆕 Hook cascade validation
  const {
    postValidationAction,
    setPostValidationAction
  } = useCascadeValidationIntegrated();

  // 🆕 États pour le modal de génération
  const [generationProgress, setGenerationProgress] = useState(() => {
    const saved = localStorage.getItem('vendor_upload_progress');
    return saved ? JSON.parse(saved).progress : 0;
  });
  const [generationMessage, setGenerationMessage] = useState('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [colorsProcessed, setColorsProcessed] = useState(0);
  const [totalColors, setTotalColors] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [backgroundUploadActive, setBackgroundUploadActive] = useState(() => {
    const saved = localStorage.getItem('vendor_upload_progress');
    return saved ? JSON.parse(saved).active : false;
  });

  // 🆕 États pour le modal de génération d'images multi-produits
  const [createdProductIds, setCreatedProductIds] = useState<number[]>([]);
  const [showImagesModal, setShowImagesModal] = useState(false);

  // 🆕 Persister l'état de l'upload dans localStorage
  useEffect(() => {
    if (backgroundUploadActive) {
      localStorage.setItem('vendor_upload_progress', JSON.stringify({
        active: true,
        progress: generationProgress,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('vendor_upload_progress');
    }
  }, [backgroundUploadActive, generationProgress]);

  // Hook de publication vendeur avec gestion intégrée
  const { publishProducts, isPublishing, publishProgress, currentStep } = useVendorPublish({
    onSuccess: (results) => {
      console.log('🎉 Publication réussie:', results);
      setCheckoutOpen(false);
      setShowProgressModal(false);
      setGenerationProgress(100);
      setGenerationMessage('Produits créés avec succès !');
      setBackgroundUploadActive(false);

      // Afficher une notification de succès
      toast({
        title: 'Produits publiés !',
        description: `${results.length} produit(s) ont été créés avec succès.`,
        variant: 'success',
        duration: 5000
      });

      // Optionnel: réinitialiser pour une nouvelle session
      // setSelectedProductIds([]);
      // setDesignUrl('');
      // setDesignFile(null);
    },
    onError: (error) => {
      console.error('❌ Erreur publication:', error);
      setGenerationMessage('Erreur lors de la génération');
      setBackgroundUploadActive(false);
    },
    onProgress: (step, progress) => {
      console.log(`📊 ${step} - ${progress}%`);
    }
  });

  // Fonction pour composer et télécharger l'image finale (produit + design)
  const downloadProductWithDesign = async (productId: number, specificColor?: Color | null): Promise<string | null> => {
    try {
      console.log(`📁 Téléchargement et composition pour le produit ${productId}${specificColor ? ` - couleur ${specificColor.name}` : ''}...`);
      
      // Trouver le produit et sa vue
      const product = products.find(p => p.id === productId);
      if (!product) {
        console.warn(`⚠️ Produit ${productId} non trouvé`);
        return null;
      }

      // Informations détaillées sur les couleurs disponibles
      const availableColors = productColors[productId] || [];
      const selectedColorId = specificColor ? specificColor.id : selectedColorIds[productId];
      const activeColors = availableColors.filter(c => c.isActive);
      
      console.log(`🎨 Couleurs pour le produit ${productId}:`, {
        total: availableColors.length,
        active: activeColors.length,
        selectedId: selectedColorId,
        specificColor: specificColor?.name || 'aucune',
        colorVariations: product.colorVariations?.length || 0,
        filterGlobal: filterColorName
      });

      // Fonction pour obtenir la vue avec la couleur spécifique
      const getViewForColor = (product: Product, color?: Color | null) => {
        if (!product.colorVariations || product.colorVariations.length === 0) {
          // Pas de variations de couleur - utiliser la vue par défaut
          const frontFallback = product.views?.find(v => (v.viewType || '').toUpperCase() === 'FRONT');
          return frontFallback || product.views?.[0];
        }

        // Si une couleur spécifique est demandée
        if (color) {
          const variation = product.colorVariations.find(cv => 
            cv.name.toLowerCase() === color.name.toLowerCase() || cv.id === color.id
          );
          
          if (variation?.images && variation.images.length > 0) {
            const frontImage = variation.images.find((img: any) => (img.view || '').toUpperCase() === 'FRONT');
            return frontImage || variation.images[0];
          }
        }

        // 🔧 CORRECTION : Ne pas utiliser getPreviewView qui utilise des états globaux
        // Fallback vers la première variation si aucune couleur spécifique
        if (product.colorVariations.length > 0) {
          const firstVariation = product.colorVariations[0];
          if (firstVariation?.images && firstVariation.images.length > 0) {
            const frontImage = firstVariation.images.find((img: any) => (img.view || '').toUpperCase() === 'FRONT');
            return frontImage || firstVariation.images[0];
          }
        }

        // Dernier recours : vue par défaut du produit
        const frontFallback = product.views?.find(v => (v.viewType || '').toUpperCase() === 'FRONT');
        return frontFallback || product.views?.[0];
      };

      let view = getViewForColor(product, specificColor);
      if (view && !(view as any).url) {
        view = {
          ...view,
          url: (view as any).imageUrl || (view as any).src || ''
        };
      }

      // Normaliser toutes les propriétés de la vue
      const normalizedView = view ? {
        url: (view as any).url || (view as any).imageUrl || (view as any).src || '',
        viewType: (view as any).viewType || (view as any).view || 'FRONT',
        id: (view as any).id || null,
        width: (view as any).width || null,
        height: (view as any).height || null,
        naturalWidth: (view as any).naturalWidth || null,
        naturalHeight: (view as any).naturalHeight || null,
        delimitations: (view as any).delimitations || []
      } : null;

      if (!normalizedView || !normalizedView.url) {
        console.warn(`⚠️ Aucune vue disponible pour le produit ${productId}${specificColor ? ` - couleur ${specificColor.name}` : ''}`);
        console.log(`📋 Debug - Variations de couleur:`, product.colorVariations);
        console.log(`📋 Debug - Vues disponibles:`, product.views);
        return null;
      }

      // Log détaillé de la vue sélectionnée avec normalisation des propriétés
      console.log(`🖼️ Vue sélectionnée pour le produit ${productId}${specificColor ? ` - ${specificColor.name}` : ''}:`, {
        url: normalizedView.url,
        viewType: normalizedView.viewType,
        colorVariation: (view as any).colorVariation || 'none',
        delimitations: normalizedView.delimitations.length
      });

      // Créer un canvas pour la composition
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ Impossible de créer le contexte canvas');
        return null;
      }

      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);

      console.log(`🖼️ Chargement de l'image produit: ${normalizedView.url}`);

      // Charger l'image du produit avec gestion d'erreur améliorée
      const productImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          console.log(`✅ Image produit chargée: ${img.width}x${img.height}`);
          resolve(img);
        };
        
        img.onerror = (error) => {
          console.error(`❌ Erreur chargement image produit:`, error);
          console.log(`🔄 URL problématique: ${normalizedView.url}`);
          reject(new Error('Erreur chargement image produit'));
        };
        
        img.src = normalizedView.url;
      });

      // Dessiner l'image du produit (centré, aspect ratio préservé)
      const imgRatio = productImg.width / productImg.height;
      const canvasRatio = 1; // 400/400
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgRatio > canvasRatio) {
        // Image plus large - limiter par la largeur
        drawWidth = 400;
        drawHeight = 400 / imgRatio;
        offsetX = 0;
        offsetY = (400 - drawHeight) / 2;
      } else {
        // Image plus haute - limiter par la hauteur
        drawHeight = 400;
        drawWidth = 400 * imgRatio;
        offsetX = (400 - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.drawImage(productImg, offsetX, offsetY, drawWidth, drawHeight);
      console.log(`✅ Image produit dessinée: ${drawWidth.toFixed(1)}x${drawHeight.toFixed(1)} à (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);

      // Ajouter le design si disponible et si il y a des délimitations
      if (designUrl && normalizedView.delimitations && normalizedView.delimitations.length > 0) {
        console.log(`🎨 Chargement du design: ${designUrl}`);
        
        try {
          // Charger l'image du design
          const designImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              console.log(`✅ Design chargé: ${img.width}x${img.height}`);
              resolve(img);
            };
            
            img.onerror = (error) => {
              console.error(`❌ Erreur chargement design:`, error);
              reject(new Error('Erreur chargement design'));
            };
            
            img.src = designUrl;
          });

          // Appliquer le design sur chaque délimitation
          normalizedView.delimitations.forEach((delim: any, idx: number) => {
            console.log(`🎯 Application design sur délimitation ${idx}:`, {
              x: delim.x,
              y: delim.y, 
              width: delim.width,
              height: delim.height,
              coordinateType: delim.coordinateType || 'unknown'
            });
            
            // Calculer la position de la délimitation sur le canvas
            const isPixel = delim.coordinateType === 'PIXEL' || delim.x > 100 || delim.y > 100;
            
            // Dimensions de l'image originale
            const originalWidth = normalizedView.naturalWidth || productImg.width;
            const originalHeight = normalizedView.naturalHeight || productImg.height;
            
            // Convertir en pourcentages si nécessaire
            const pctX = isPixel ? (delim.x / originalWidth) * 100 : delim.x;
            const pctY = isPixel ? (delim.y / originalHeight) * 100 : delim.y;
            const pctW = isPixel ? (delim.width / originalWidth) * 100 : delim.width;
            const pctH = isPixel ? (delim.height / originalHeight) * 100 : delim.height;
            
            // Calculer la position sur le canvas redimensionné
            const delimX = offsetX + (pctX / 100) * drawWidth;
            const delimY = offsetY + (pctY / 100) * drawHeight;
            const delimW = (pctW / 100) * drawWidth;
            const delimH = (pctH / 100) * drawHeight;
            
            console.log(`📍 Position délimitation ${idx}: ${delimX.toFixed(1)}, ${delimY.toFixed(1)}, ${delimW.toFixed(1)}x${delimH.toFixed(1)}`);
            
            // Appliquer le scale de 0.8 pour une meilleure visibilité
            const scale = 0.8;
            const scaledW = delimW * scale;
            const scaledH = delimH * scale;
            const centerX = delimX + (delimW - scaledW) / 2;
            const centerY = delimY + (delimH - scaledH) / 2;
            
            // Dessiner le design dans la délimitation
            ctx.drawImage(designImg, centerX, centerY, scaledW, scaledH);
            console.log(`✅ Design appliqué à la position: ${centerX.toFixed(1)}, ${centerY.toFixed(1)}, ${scaledW.toFixed(1)}x${scaledH.toFixed(1)}`);
          });
          
        } catch (designError) {
          console.warn(`⚠️ Erreur lors du chargement du design:`, designError);
          // Continuer sans le design - juste l'image du produit
        }
      } else {
        if (!designUrl) {
          console.log(`ℹ️ Aucun design à appliquer`);
        } else if (!normalizedView.delimitations || normalizedView.delimitations.length === 0) {
          console.log(`ℹ️ Aucune délimitation trouvée pour ce produit`);
        }
      }

      // Convertir en blob URL
      return new Promise<string>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            console.log(`✅ Image finale créée pour le produit ${productId}${specificColor ? ` - ${specificColor.name}` : ''} - Blob URL: ${blobUrl}`);
            
            // Debug : informations sur l'image finale
            console.log(`📊 Statistiques image finale:`, {
              size: `${blob.size} bytes`,
              type: blob.type,
              url: blobUrl.substring(0, 50) + '...'
            });
            
            resolve(blobUrl);
          } else {
            console.error(`❌ Erreur création blob pour le produit ${productId}`);
            generatePlaceholderImage(productId).then(resolve);
          }
        }, 'image/png', 0.9);
      });

    } catch (error) {
      console.error(`❌ Erreur générale composition produit ${productId}:`, error);
      return generatePlaceholderImage(productId);
    }
  };

  // Alias pour compatibilité

  // Fonction helper pour générer une image placeholder avec blob URL
  const generatePlaceholderImage = (productId: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fond blanc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        
        // Bordure
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 380, 380);
        
        // Texte principal
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Produit ${productId}`, 200, 180);
        
        // Sous-texte
        ctx.font = '16px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Image générée automatiquement', 200, 210);
        ctx.fillText('(capture impossible)', 200, 235);
        
        // Icône simple
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(160, 120, 80, 40);
        ctx.stroke();
        
        // Convertir en blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            console.log(`🎨 Placeholder blob URL créé pour le produit ${productId}: ${blobUrl}`);
            resolve(blobUrl);
          } else {
            // Fallback vers data URL si blob échoue
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            resolve(dataUrl);
          }
        }, 'image/png', 0.9);
      } else {
        // Fallback ultime si pas de contexte 2D
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzc0MTUxIiBmb250LXNpemU9IjE2Ij5QbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=');
      }
    });
  };

  // Fonction pour capturer toutes les images des produits sélectionnés avec toutes leurs couleurs actives
  const captureAllProductImages_unused = async (): Promise<Record<string, string>> => {
    console.log('📸 Début de la capture de toutes les images avec couleurs...');
    const capturedImages: Record<string, string> = {}; // Key: "productId_colorId", Value: blobUrl

    for (const idStr of selectedProductIds) {
      const productId = Number(idStr);
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        console.warn(`⚠️ Produit ${productId} non trouvé`);
        continue;
      }

      // Récupérer toutes les couleurs actives pour ce produit
      const activeColors = (productColors[productId] || []).filter(c => c.isActive);
      
      if (activeColors.length === 0) {
        console.warn(`⚠️ Aucune couleur active pour le produit ${productId}`);
        // Capturer sans couleur spécifique
        const imageDataUrl = await downloadProductWithDesign(productId, null);
        if (imageDataUrl) {
          capturedImages[`${productId}_default`] = imageDataUrl;
        }
        continue;
      }

      console.log(`🎨 Capture de ${activeColors.length} couleurs pour le produit ${productId}:`, 
        activeColors.map(c => `${c.name} (${c.colorCode})`));

      // Capturer une image pour chaque couleur active
      for (const color of activeColors) {
        console.log(`📸 Capture couleur "${color.name}" pour le produit ${productId}...`);
        
        const imageDataUrl = await downloadProductWithDesign(productId, color);
        
        let finalImageUrl = imageDataUrl;
        if (!finalImageUrl) {
          console.warn(`⚠️ Impossible de capturer: Produit ${productId} - ${color.name}. Génération placeholder…`);
          try {
            finalImageUrl = await generatePlaceholderImage(productId);
            console.log(`🖼️ Placeholder généré pour ${productId} - ${color.name}`);
          } catch (err) {
            console.error(`❌ Impossible de générer le placeholder pour ${productId} - ${color.name}`);
          }
        }

        if (finalImageUrl) {
          const key = `${productId}_${color.id}`;
          capturedImages[key] = finalImageUrl;
          console.log(`✅ Image sauvegardée: Produit ${productId} - ${color.name} (${key})`);
        }
        
        // Petite pause entre les captures
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const totalImages = Object.keys(capturedImages).length;
    const totalColors = selectedProductIds.reduce((sum, idStr) => {
      const productId = Number(idStr);
      return sum + (productColors[productId] || []).filter(c => c.isActive).length;
    }, 0);

    console.log(`📸 Capture terminée: ${totalImages}/${totalColors} images de couleurs générées`);
    
    // Afficher le récapitulatif détaillé
    console.log('\n🖼️ === RÉCAPITULATIF DES IMAGES PAR COULEUR ===');
    Object.entries(capturedImages).forEach(([key, blobUrl]) => {
      const [productIdStr, colorIdStr] = key.split('_');
      const productId = Number(productIdStr);
      const product = products.find(p => p.id === productId);
      const colorId = colorIdStr === 'default' ? null : Number(colorIdStr);
      const color = colorId ? (productColors[productId] || []).find(c => c.id === colorId) : null;
      
      console.log(`\n📷 ${product?.name || `Produit ${productId}`}`);
      console.log(`   🎨 Couleur: ${color?.name || 'Par défaut'} ${color?.colorCode ? `(${color.colorCode})` : ''}`);
      console.log(`   🔗 Blob URL: ${blobUrl}`);
      console.log(`   📋 Clé: ${key}`);
      
      // Créer les fonctions de téléchargement et copie
      (window as any)[`downloadImage_${key}`] = () => {
        const link = document.createElement('a');
        link.download = `${(product?.name || `Produit_${productId}`).replace(/\s+/g, '_')}_${(color?.name || 'default').replace(/\s+/g, '_')}.png`;
        link.href = blobUrl;
        link.click();
      };
      
      (window as any)[`copyImageLink_${key}`] = () => {
        navigator.clipboard.writeText(blobUrl).then(() => {
          console.log(`📋 Blob URL copié pour ${product?.name} - ${color?.name || 'défaut'}`);
        });
      };
      
      console.log(`   💾 Télécharger: downloadImage_${key}()`);
      console.log(`   📋 Copier URL: copyImageLink_${key}()`);
    });
    
    console.log('=== FIN DU RÉCAPITULATIF ===\n');

    return capturedImages;
  };

  // Cleanup object URL – doit être avant tout retour conditionnel pour respecter les hooks
  useEffect(() => {
    return () => {
      if (designUrl) URL.revokeObjectURL(designUrl);
    };
  }, [designUrl]);

  // Auth & navigation helpers
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // 🆕 Charger la commission du vendeur à l'initialisation
  useEffect(() => {
    const loadVendorCommission = async () => {
      if (isAuthenticated && user?.role === 'VENDEUR') {
        setCommissionLoading(true);
        try {
          // Utiliser le nouvel endpoint /vendor/my-commission
          const commission = await commissionService.getMyCommission();
          setVendorCommission(commission.commissionRate || 40);
          
          // Log pour débug
          console.log('✅ Commission vendeur chargée:', commission);
          
          if (commission.isDefault) {
            console.warn('⚠️ Utilisation de la commission par défaut (40%) - Endpoint backend manquant?');
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement de la commission:', error);
          setVendorCommission(40); // Valeur par défaut selon commission.md
        } finally {
          setCommissionLoading(false);
        }
      }
    };
    
    loadVendorCommission();
  }, [isAuthenticated, user?.role]);

  // Pendant la vérification de l'auth, afficher un petit loader
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté OU n'est pas vendeur, afficher la page d'atterrissage
  if (!isAuthenticated || user?.role !== 'VENDEUR') {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-black">
        <div className="flex-grow flex flex-col items-center justify-center px-4 py-16">
          {/* Hero principal */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium mb-8">
              <Store className="w-4 h-4 mr-2" />
              Rejoignez PrintAlma
            </div>
            
            {/* Titre principal */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-black dark:text-white mb-8 tracking-tight leading-none">
              Créez.
              <span className="block bg-gradient-to-r from-gray-600 to-black dark:from-gray-300 dark:to-white bg-clip-text text-transparent">
                Vendez.
              </span>
              <span className="block text-gray-600 dark:text-gray-400">
                Prospérez.
              </span>
          </h1>
            
            {/* Sous-titre */}
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 font-light leading-relaxed max-w-2xl mx-auto mb-12">
              Transformez votre créativité en business prospère. Rejoignez des milliers de créateurs qui génèrent des revenus avec leurs œuvres.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Button 
                size="lg"
                className="h-14 px-8 text-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-all duration-300 hover:scale-105" 
                onClick={() => navigate('/vendeur/register')}
              >
                Commencer à vendre
                <Rocket className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-14 px-8 text-lg border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-full transition-all duration-300" 
                onClick={() => navigate('/vendeur/login')}
              >
                Se connecter
              </Button>
            </div>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-8 mb-16 w-full max-w-4xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">2M+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Produits vendus</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">50K+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Créateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">15M€</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Revenus générés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">4.9★</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Satisfaction</div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-8 w-full max-w-6xl">
            {/* Feature 1 */}
            <div className="group text-center p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-8 w-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">Upload Simplifié</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Téléchargez vos créations en quelques clics. Notre système optimise automatiquement vos designs pour tous les produits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group text-center p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Rocket className="h-8 w-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">Mise en Ligne Rapide</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Vos produits sont disponibles à la vente en moins de 24h. Marketing, production et livraison : on s'occupe de tout.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group text-center p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Store className="h-8 w-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">Revenus Passifs</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Gagnez de l'argent pendant que vous dormez. Chaque vente vous rapporte des royalties automatiquement versées.
              </p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-16 max-w-3xl mx-auto text-center">
            <blockquote className="text-xl sm:text-2xl italic text-gray-600 dark:text-gray-400 mb-6">
              "En 6 mois, j'ai généré plus de 10 000€ de revenus passifs avec mes designs. PrintAlma a changé ma vie."
            </blockquote>
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full mr-4"></div>
              <div className="text-left">
                <div className="font-semibold text-black dark:text-white">Sarah Martinez</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Illustratrice, Lyon</div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const fetchProducts = async () => {
    setLoading(true);

    try {
      // Utiliser le nouvel endpoint backend avec le paramètre forVendorDesign=true
      // 🔧 UTILISER LOCALHOST pour le développement
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';
      const response = await fetch(`${API_URL}/products?forVendorDesign=true&limit=50`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Logs de debug pour voir tous les produits avant filtrage
        console.log('🚀 PRODUITS AVANT FILTRAGE (page principale):');
        result.data.forEach((product: any) => {
          console.log(`- ${product.name} (isReady: ${product.isReadyProduct}, hasDelimitations: ${product.hasDelimitations})`);
        });
        console.log('---');
        
        // Le backend fait déjà le filtrage, on utilise directement les données
        const filteredProducts = result.data;
        
        // Logs de debug pour le résultat final
        console.log('📊 RÉSULTAT DU FILTRAGE (page principale):');
        console.log(`- Produits totaux: ${result.data.length}`);
        console.log(`- Produits filtrés: ${filteredProducts.length}`);
        console.log('- Produits affichés:', filteredProducts.map((p: any) => p.name));
        console.log('---');
        
        setProducts(filteredProducts);
        
      // Sauvegarder les prix de base lors du premier chargement
      const initialBasePrices: Record<number, number> = {};
        filteredProducts.forEach((product: any) => {
        // 🔄 NOUVEAU: Utiliser suggestedPrice en priorité, puis basePrice, puis price
        // Le vendeur travaille maintenant sur le prix suggéré comme base
        const suggestedPrice = product.suggestedPrice;
        const basePrice = (product as any).basePrice || product.price;
        
        // Si suggestedPrice existe et est valide, l'utiliser comme nouvelle base
        if (suggestedPrice && suggestedPrice > 0) {
          initialBasePrices[product.id] = suggestedPrice;
          console.log(`🎯 [SellDesignPage] Produit ${product.id}: Base = suggestedPrice (${suggestedPrice} FCFA)`);
        } else {
          // Sinon, utiliser l'ancien système
          initialBasePrices[product.id] = basePrice;
          console.log(`⚠️ [SellDesignPage] Produit ${product.id}: Base = basePrice/price (${basePrice} FCFA), pas de suggestedPrice`);
        }
      });
      setBasePrices(initialBasePrices);
      
      // 🔒 INITIALISER les prix de revient mockup originaux (ne changent JAMAIS)
      const prixRevientOriginaux: Record<number, number> = {};
      filteredProducts.forEach((product: any) => {
        prixRevientOriginaux[product.id] = product.price; // Stocker le prix de revient original
        console.log(`🔒 [FIXE] Prix de revient mockup ${product.id}: ${product.price} FCFA`);
      });
      setPrixDeRevientOriginaux(prixRevientOriginaux);
    } else {
        setError(result.message || 'Erreur lors du chargement des produits');
    }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setError('Erreur lors du chargement des produits');
    } finally {
    setLoading(false);
    }
  };

  // 🆕 Fonctions utilitaires pour la détection de bounding box et le recadrage automatique
  
  // Fonction pour détecter la bounding box d'une image (zone non-transparente)
  const detectBoundingBox = (imageData: ImageData): { x: number; y: number; width: number; height: number } | null => {
    const { data, width, height } = imageData;
    
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    
    // Seuil de tolérance pour les pixels quasi-transparents (évite les artefacts)
    const alphaThreshold = 10; // Pixels avec alpha < 10 sont considérés comme transparents
    
    // Parcourir tous les pixels pour trouver ceux qui ne sont pas transparents
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const alpha = data[pixelIndex + 3]; // Canal alpha
        
        // Si le pixel n'est pas transparent (alpha > seuil)
        if (alpha > alphaThreshold) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Si aucun pixel non-transparent trouvé
    if (maxX === -1) {
      return null;
    }
    
    // Ajouter une petite marge de sécurité (1 pixel) pour éviter les coupures
    const margin = 1;
    
    return {
      x: Math.max(0, minX - margin),
      y: Math.max(0, minY - margin),
      width: Math.min(width - Math.max(0, minX - margin), maxX - Math.max(0, minX - margin) + 1 + (margin * 2)),
      height: Math.min(height - Math.max(0, minY - margin), maxY - Math.max(0, minY - margin) + 1 + (margin * 2))
    };
  };

  // Fonction pour recadrer une image selon sa bounding box avec optimisation
  const cropImageToBoundingBox_unused = async (file: File): Promise<{ croppedFile: File; croppedUrl: string; originalSize: { width: number; height: number }; croppedSize: { width: number; height: number }; boundingBox: { x: number; y: number; width: number; height: number } } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        // Dessiner l'image originale sur le canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Obtenir les données de l'image
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // Détecter la bounding box
        const boundingBox = detectBoundingBox(imageData);
        
        if (!boundingBox) {
          console.warn('Aucune zone non-transparente détectée');
          resolve(null);
          return;
        }
        
        // Vérifier si le recadrage est nécessaire (économie d'espace significative)
        const originalArea = img.width * img.height;
        const croppedArea = boundingBox.width * boundingBox.height;
        const spaceSavingPercentage = (1 - croppedArea / originalArea) * 100;
        
        // Si moins de 5% d'économie d'espace, garder l'image originale
        if (spaceSavingPercentage < 5) {
          console.log('Recadrage non nécessaire (moins de 5% d\'économie d\'espace)');
          resolve(null);
          return;
        }
        
        // Créer un nouveau canvas pour l'image recadrée
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        
        if (!croppedCtx) {
          resolve(null);
          return;
        }
        
        // Redimensionner le canvas aux dimensions de la bounding box
        croppedCanvas.width = boundingBox.width;
        croppedCanvas.height = boundingBox.height;
        
        // Dessiner la partie recadrée avec antialiasing
        croppedCtx.imageSmoothingEnabled = true;
        croppedCtx.imageSmoothingQuality = 'high';
        
        croppedCtx.drawImage(
          img,
          boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height,
          0, 0, boundingBox.width, boundingBox.height
        );
        
        // Convertir en blob avec qualité optimisée
        croppedCanvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          
          // Créer un nouveau fichier avec un nom descriptif
          const fileExtension = file.name.split('.').pop() || 'png';
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const croppedFileName = `${baseName}_cropped.${fileExtension}`;
          
          const croppedFile = new File([blob], croppedFileName, { type: file.type });
          const croppedUrl = URL.createObjectURL(croppedFile);
          
          console.log(`✅ Recadrage réussi: ${img.width}×${img.height} → ${boundingBox.width}×${boundingBox.height} (${spaceSavingPercentage.toFixed(1)}% d'économie)`);
          
          resolve({
            croppedFile,
            croppedUrl,
            originalSize: { width: img.width, height: img.height },
            croppedSize: { width: boundingBox.width, height: boundingBox.height },
            boundingBox
          });
        }, file.type, 0.95);
      };
      
      img.onerror = () => {
        console.error('Erreur lors du chargement de l\'image');
        resolve(null);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // État pour stocker les informations de recadrage
  const [cropInfo, setCropInfo] = useState<{
    originalSize: { width: number; height: number };
    croppedSize: { width: number; height: number };
    boundingBox: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Toujours afficher le checker, même pour les fichiers invalides
    setCheckerFile(file);

    // Vérifier le type de fichier
    const isValidImageType = file.type.startsWith('image/') ||
                           file.type === 'image/svg+xml' ||
                           file.name.toLowerCase().endsWith('.svg');

    if (!isValidImageType) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner un fichier image (PNG, JPG, SVG).",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Taille max 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "Le fichier ne doit pas dépasser 5 Mo.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    const applyFile = () => {
      setTempDesignFile(file);
      const objectUrl = URL.createObjectURL(file);
      setTempDesignUrl(objectUrl);
      setCropInfo(null);
      toast({
        title: "📁 Design importé",
        description: "Votre design a été importé avec ses dimensions originales.",
        variant: "success",
        duration: 3000,
      });
      setDesignPrice(0);
      setDesignName(file.name.replace(/\.[^/.]+$/, ""));
      setDesignDescription('');
      setDesignPriceError('');
      setDesignNameError('');
      setDesignCategoryId(null);
      setDesignCategoryError('');
      setShowDesignPriceModal(true);
    };

    // SVG : pas de vérification de dimensions
    if (isSvg) {
      applyFile();
      return;
    }

    // Vérification des dimensions min 1000×1000 px
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      URL.revokeObjectURL(objectUrl);
      if (w < 1000 || h < 1000) {
        toast({
          title: "Dimensions insuffisantes",
          description: `Image ${w}×${h}px. Minimum requis : 1000×1000px (100 DPI min).`,
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      applyFile();
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire le fichier image.",
        variant: "destructive",
        duration: 4000,
      });
    };
    img.src = objectUrl;
  };

  // Nouvelle fonction pour confirmer le prix et charger les produits
  const handleConfirmDesignPrice = async () => {
    // Reset des erreurs
    setDesignPriceError('');
    setDesignNameError('');
    setDesignCategoryError('');

    // Validation du nom
    if (!designName.trim()) {
      setDesignNameError('Veuillez entrer un nom pour votre design');
      return;
    }

    if (designName.trim().length < 3) {
      setDesignNameError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    // Validation du thème
    if (!designCategoryId) {
      setDesignCategoryError('Veuillez sélectionner un thème pour votre design');
      return;
    }

    // Validation du prix
    if (!designPrice || designPrice < 0) {
      setDesignPriceError('Veuillez entrer un prix valide pour votre design');
      return;
    }

    // On masque le modal et indique le chargement
    setShowDesignPriceModal(false);
    setLoading(true);

    try {
      // 📡 Création réelle du design côté backend afin qu'il apparaisse dans /vendeur/designs
      if (tempDesignFile) {
        const createdDesign = await designService.createDesign({
          file: tempDesignFile,
          name: designName.trim(),
          description: designDescription,
          price: designPrice,
          categoryId: designCategoryId // Utilise la catégorie sélectionnée dynamiquement
        });

        // Ajouter immédiatement le design à la liste locale pour la sélection éventuelle
        setExistingDesignsWithValidation(prev => [
          {
            ...createdDesign,
            isValidated: (createdDesign as any).isValidated ?? false,
            validatedAt: (createdDesign as any).validatedAt,
            rejectionReason: (createdDesign as any).rejectionReason
          },
          ...prev
        ]);

        // Mettre à jour le statut de validation affiché
        setDesignValidationStatus({
          isValidated: (createdDesign as any).isValidated ?? false,
          needsValidation: !((createdDesign as any).isValidated ?? false),
          message: !((createdDesign as any).isValidated ?? false)
            ? 'Nouveau design ajouté. Vos produits seront en attente de validation admin.'
            : 'Design déjà validé.'
        });
      }

      // Recharger la liste des designs pour le picker
      await loadExistingDesignsWithValidation();

      // Toast de succès
      toast({
        title: '✅ Design créé avec succès !',
        description: `"${designName}" a été créé (${designPrice} FCFA). Les administrateurs ont été automatiquement notifiés par email et procéderont à la validation.`,
        variant: 'success',
        duration: 6000
      });

      // Ouvrir automatiquement le sélecteur de designs afin que l'utilisateur choisisse son nouveau design
      setShowDesignPicker(true);

    } catch (err: any) {
      console.error('❌ Erreur création design:', err);
      toast({
        title: 'Erreur lors de la création du design',
        description: err?.message || 'Une erreur est survenue lors de l\'enregistrement du design.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour annuler l'ajout du design
  const handleCancelDesignPrice = () => {
    // Nettoyer les données temporaires
    if (tempDesignUrl) {
      URL.revokeObjectURL(tempDesignUrl);
    }
    setTempDesignFile(null);
    setTempDesignUrl('');
    setCropInfo(null);
    setDesignPrice(0);
    setDesignName('');
    setDesignDescription('');
    setDesignPriceError('');
    setDesignNameError('');
    setDesignCategoryId(null);
    setDesignCategoryError('');
    setShowDesignPriceModal(false);
  };

  // When products change, select all by default if design is uploaded
  useEffect(() => {
    if (designUrl && products.length > 0) {
      setSelectedProductIds(products.map((p) => String(p.id)));
    }
  }, [designUrl, products]);

  // Helper to handle inline edit and save
  const handleFieldChange = (id: number, field: keyof Product, value: string | number) => {
    setEditStates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const updates = editStates[id] || {};
    const payload: Record<string, any> = {};

    // 🔄 NOUVEAU: Validation non-bloquante du prix basée sur suggestedPrice ou prix minimum
    if (updates.price !== undefined) {
      const basePrice = basePrices[id] || product.price;
      const hasSuggestedPrice = product.suggestedPrice && product.suggestedPrice > 0;
      
      if (updates.price < basePrice) {
        const priceType = hasSuggestedPrice ? "prix suggéré" : "prix minimum";
        const msg = `⚠️ Prix inférieur au ${priceType} (${basePrice.toLocaleString()} FCFA)`;
        
        console.log(`⚠️ [SellDesignPage] Prix inférieur au minimum pour produit ${id}:`, {
          tentative: updates.price,
          minimum: basePrice,
          type: priceType,
          hasSuggestedPrice
        });
        
        // Mettre un message d'avertissement inline (non bloquant)
        setPriceErrors(prev => ({ ...prev, [id]: msg }));
        
        // 🆕 NE PLUS BLOQUER : Continuer la sauvegarde même avec prix inférieur
      } else {
        // Clear error if any
        if (priceErrors[id]) {
          setPriceErrors(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        }
      }
    }

    (['name', 'price', 'stock', 'description'] as (keyof Product)[]).forEach((field) => {
      if (updates[field] !== undefined && updates[field] !== product[field]) {
        // 🔒 PROTECTION: Ne jamais modifier product.price (prix de revient mockup FIXE)
        if (field === 'price') {
          // Le price ici représente le prix de vente final du vendeur, pas le prix de revient
          console.log('📝 Mise à jour du prix de vente vendeur:', updates[field]);
          (payload as any)[field] = updates[field];
        } else {
          (payload as any)[field] = updates[field];
        }
      }
    });
    if (Object.keys(payload).length === 0) return;
    setSavingProductIds((prev) => [...prev, id]);

    try {
      // Pas d'appel API pour l'instant – on conserve la modification localement.
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...payload } : p));
      setSavedProductIds((prev) => [...prev, id]);
      setTimeout(() => setSavedProductIds((prev) => prev.filter((pid) => pid !== id)), 1200);

      // ✅ CORRIGÉ: Réinitialiser editStates seulement après que products soit mis à jour
      // Utiliser un setTimeout pour s'assurer que la mise à jour de products est terminée
      setTimeout(() => {
        setEditStates((prev) => ({ ...prev, [id]: {} }));
      }, 0);

      // Afficher le toast de succès
      toast({
        title: "Modifications enregistrées",
        description: `Les modifications de "${product.name}" ont été sauvegardées avec succès.`,
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      // Afficher le toast d'erreur
      toast({
        title: "Erreur lors de la sauvegarde",
        description: "Une erreur est survenue lors de l'enregistrement des modifications.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSavingProductIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  // Fonctions utilitaires pour le système de pricing moderne
  const togglePricingExpansion = (productId: number) => {
    setExpandedPricingIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleProfitChange = (productId: number, newProfit: number) => {
    setCustomProfits(prev => ({
      ...prev,
      [productId]: Math.max(0, newProfit)
    }));
  };

  // 🆕 Fonction de callback pour gérer les changements de prix par taille
  const handleSizePricesChange = (productId: number, prices: Record<string, { salePrice: number; profit: number }>) => {
    setSizePricingByProduct(prev => ({
      ...prev,
      // ✅ FUSION: Conserver les prix existants et mettre à jour uniquement la taille modifiée
      [productId]: { ...(prev[productId] || {}), ...prices }
    }));

    // Mettre à jour le prix principal avec la moyenne de TOUS les prix (pas seulement ceux qui viennent d'être modifiés)
    const allPrices = { ...(sizePricingByProduct[productId] || {}), ...prices };
    const priceValues = Object.values(allPrices);
    if (priceValues.length > 0) {
      const avgPrice = priceValues.reduce((sum, p) => sum + p.salePrice, 0) / priceValues.length;
      const avgProfit = priceValues.reduce((sum, p) => sum + p.profit, 0) / priceValues.length;

      setCustomProfits(prev => ({ ...prev, [productId]: avgProfit }));
      handleFieldChange(productId, 'price', avgPrice);
    }
  };

  const handleSavePricing = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // ✅ CORRECTION: Utiliser getSalePrice qui gère correctement le prix suggéré
    // au lieu de recalculer manuellement avec basePrice + customProfit
    const newPrice = getSalePrice(product);

    handleFieldChange(productId, 'price', newPrice);
    handleSave(productId);
    setEditingProfitIds(prev => ({ ...prev, [productId]: false }));
  };

  const handleResetPricing = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // 🔒 CORRECTION: Utiliser prixDeRevientOriginaux (FIXE) pour calculer le reset
    const prixDeRevientFixe = prixDeRevientOriginaux[productId];
    const basePrice = basePrices[productId];
    
    if (prixDeRevientFixe !== undefined && basePrice !== undefined) {
      setCustomProfits(prev => ({
        ...prev,
        [productId]: Math.max(0, product.price - prixDeRevientFixe)
      }));
    }
    setEditingProfitIds(prev => ({ ...prev, [productId]: false }));
  };

  // Initialiser les tailles au chargement du produit
  useEffect(() => {
    if (products.length > 0) {
      const initialSizes: Record<number, Size[]> = {};
      products.forEach(product => {
        if (product.sizes) {
          initialSizes[product.id] = product.sizes.map(size => ({
            id: size.id,
            sizeName: size.sizeName,
            isActive: true
          }));
        }
      });
      setProductSizes(initialSizes);
    }
  }, [products]);

  // Initialiser les couleurs au chargement des produits
  useEffect(() => {
    if (products.length > 0) {
      const initialColors: Record<number, Color[]> = {};
      products.forEach((product) => {
        // Source des couleurs : soit product.colors (transformProduct), soit colorVariations
        const rawColors: Array<any> | undefined = (product as any).colors || product.colorVariations?.map(cv => ({
          id: cv.id,
          name: cv.name,
          colorCode: (cv as any).colorCode || '#000000'
        }));

        if (rawColors && rawColors.length > 0) {
          initialColors[product.id] = rawColors.map((c) => ({
            id: c.id,
            name: c.name,
            colorCode: c.colorCode,
            isActive: true,
          }));
        }
      });
      setProductColors(initialColors);
    }
  }, [products]);

  // Initialiser les profits personnalisés au chargement des produits (sans écraser une saisie existante)
  useEffect(() => {
    if (products.length > 0 && Object.keys(prixDeRevientOriginaux).length > 0) {
      setCustomProfits(prev => {
        const next: Record<number, number> = { ...prev };
      products.forEach(product => {
          if (next[product.id] === undefined) {
            const cost = prixDeRevientOriginaux[product.id] ?? product.price;
            const plannedSale = (editStates[product.id]?.price as number | undefined) ?? product.suggestedPrice ?? product.price;
            next[product.id] = Math.max(0, plannedSale - cost);
          }
        });
        return next;
      });
    }
  }, [products, prixDeRevientOriginaux, editStates]);

  // Initialiser la couleur sélectionnée (couleur par défaut > première couleur active > première variation)
  useEffect(() => {
    const initialSel: Record<number, number> = {};
    products.forEach((product) => {
      if (!selectedColorIds[product.id]) {
        const activeColors = (productColors[product.id] || []).filter(c => c.isActive);

        // Priorité 1: Couleur par défaut si définie et active
        if (defaultColorIds[product.id]) {
          const defaultColor = activeColors.find(c => c.id === defaultColorIds[product.id]);
          if (defaultColor) {
            initialSel[product.id] = defaultColor.id;
            return;
          }
        }

        // Priorité 2: Première couleur active
        if (activeColors.length > 0) {
          initialSel[product.id] = activeColors[0].id;
        } else if (product.colorVariations && product.colorVariations.length > 0) {
          // Priorité 3: Première variation de couleur
          initialSel[product.id] = product.colorVariations[0].id;
        }
      }
    });
    if (Object.keys(initialSel).length > 0) {
      setSelectedColorIds(prev => ({ ...prev, ...initialSel }));
    }
  }, [products, productColors, defaultColorIds]);

  const handleSelectColor = (productId: number, colorId: number) => {
    setSelectedColorIds(prev => ({ ...prev, [productId]: colorId }));
  };

  // Helper pour récupérer la vue correspondante à la couleur sélectionnée
  const getPreviewView = (product: Product) => {
    const selId = selectedColorIds[product.id];
    
    let selectedView: any = null;
    
    if (!product.colorVariations || product.colorVariations.length === 0) {
      // Aucun système de variations : fallback sur la première vue front ou la première vue tout court
      const frontFallback = product.views?.find(v => (v.viewType || '').toUpperCase() === 'FRONT');
      selectedView = frontFallback || product.views?.[0];
    } else {
      // 🔧 CORRECTION : Donner priorité à la sélection spécifique du produit
      let variation: any | undefined;

      // 1) PRIORITÉ : Correspondance directe par ID sauvegardé pour ce produit spécifique
      if (selId) {
        variation = product.colorVariations.find(cv => cv.id === selId);
      }

      // 2) FALLBACK : Correspondance par nom via la liste des couleurs actives du produit
      if (!variation && selId) {
        const colorList = productColors[product.id] || [];
        const selectedColor = colorList.find(c => c.id === selId);
        if (selectedColor) {
          variation = product.colorVariations.find(cv => cv.name.toLowerCase() === selectedColor.name.toLowerCase());
        }
      }

      // 3) FALLBACK SECONDAIRE : Si aucune sélection spécifique et un filtre couleur global est actif
      if (!variation && filterColorName !== ALL_COLORS) {
        variation = product.colorVariations.find(cv => cv.name.toLowerCase() === filterColorName.toLowerCase());
      }

      // 4) Fallback final sur la première variation si rien trouvé
      if (!variation) {
        variation = product.colorVariations[0];
      }

      // Sélection de l'image : priorité à la vue FRONT
      if (variation?.images && variation.images.length > 0) {
        const frontImage = variation.images.find((img: any) => (img.view || '').toUpperCase() === 'FRONT');
        selectedView = frontImage || variation.images[0];
      }

      // Dernier recours : chercher une vue FRONT au niveau produit, sinon première vue
      if (!selectedView) {
        const frontFallback = product.views?.find(v => (v.viewType || '').toUpperCase() === 'FRONT');
        selectedView = frontFallback || product.views?.[0];
      }
    }

    // ✅ Normaliser la structure de la vue pour garantir que viewType existe
    if (selectedView) {
      return {
        ...selectedView,
        viewType: selectedView.viewType || selectedView.view || 'FRONT', // ✅ Normalisation
        url: selectedView.url || (selectedView as any).imageUrl || (selectedView as any).src || '',
        id: selectedView.id || null,
        width: selectedView.width || null,
        height: selectedView.height || null,
        naturalWidth: selectedView.naturalWidth || null,
        naturalHeight: selectedView.naturalHeight || null,
        delimitations: selectedView.delimitations || []
      };
    }

    // ✅ Fallback complet si aucune vue trouvée
    return {
      viewType: 'FRONT',
      url: '',
      id: null,
      width: null,
      height: null,
      naturalWidth: null,
      naturalHeight: null,
      delimitations: []
    };
  };

  // Options de filtre couleur avec comptage de produits
  const colorFilterOptions = React.useMemo(() => {
    const map = new Map<string, { name: string; colorCode: string; count: number }>();
    products.forEach((p) => {
      p.colorVariations?.forEach((cv) => {
        const key = cv.name.toLowerCase();
        const entry = map.get(key);
        if (entry) {
          entry.count += 1;
        } else {
          map.set(key, { name: cv.name, colorCode: cv.colorCode, count: 1 });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Ne masquez plus les cartes ; le filtre couleur sert uniquement à choisir l'aperçu d'image
  const filteredProducts = products;

  // Fonction pour gérer les tailles
  const handleSizeToggle = async (productId: number, sizeId: number) => {
    const currentSizes = productSizes[productId] || [];
    const activeSizesCount = currentSizes.filter(s => s.isActive).length;
    const sizeToToggle = currentSizes.find(s => s.id === sizeId);

    if (!sizeToToggle) return;

    // Empêcher la désactivation si c'est la dernière taille active
    if (activeSizesCount === 1 && sizeToToggle.isActive) {
      toast({
        title: "Action impossible",
        description: "Vous devez conserver au moins une taille disponible.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Mettre à jour l'état local
    const updatedSizes = currentSizes.map(size => 
      size.id === sizeId ? { ...size, isActive: !size.isActive } : size
    );

    setProductSizes(prev => ({
      ...prev,
      [productId]: updatedSizes
    }));

    // Pas d'appel API pour le moment – on conserve la modification localement.
    toast({
      title: "Tailles mises à jour",
      description: "Les tailles disponibles ont été modifiées localement.",
      variant: "success",
      duration: 2000,
    });
  };

  // Fonction pour gérer les couleurs
  const handleColorToggle = async (productId: number, colorId: number) => {
    const currentColors = productColors[productId] || [];
    const activeColorsCount = currentColors.filter(c => c.isActive).length;
    const colorToToggle = currentColors.find(c => c.id === colorId);

    if (!colorToToggle) return;

    // Empêcher la désactivation si c'est la dernière couleur active
    if (activeColorsCount === 1 && colorToToggle.isActive) {
      toast({
        title: "Action impossible",
        description: "Vous devez conserver au moins une couleur disponible.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const updatedColors = currentColors.map(color => 
      color.id === colorId ? { ...color, isActive: !color.isActive } : color
    );

    setProductColors(prev => ({
      ...prev,
      [productId]: updatedColors
    }));

    // Pas d'appel API pour le moment – on conserve la modification localement.
    toast({
      title: "Couleurs mises à jour",
      description: "Les couleurs disponibles ont été modifiées localement.",
      variant: "success",
      duration: 2000,
    });
  };

  // Nouvelle fonction pour charger les designs existants avec informations de validation
  const loadExistingDesignsWithValidation = async () => {
    try {
      setLoadingExistingDesigns(true);
      
      // Charger les designs normaux
      const resp = await designService.getDesigns({ limit: 100 });
      
      // Enrichir avec les informations de validation
      const designsWithValidation = await Promise.all(
        resp.designs.map(async (design) => {
          try {
            const validationStatus = await checkDesignValidationStatus(design.id as number);
            return {
              ...design,
              isValidated: validationStatus.isValidated,
              validationMessage: validationStatus.message
            };
          } catch {
            return {
              ...design,
              isValidated: false,
              validationMessage: 'Statut inconnu'
            };
          }
        })
      );
      
      setExistingDesignsWithValidation(designsWithValidation);
    } catch (err: any) {
      console.error('Erreur chargement designs avec validation:', err);
      toast({ 
        title: 'Erreur', 
        description: err.message || 'Impossible de charger vos designs.',
        variant: 'destructive'
      });
    } finally {
      setLoadingExistingDesigns(false);
    }
  };

  // Fonction pour vérifier le statut de validation d'un design
  const checkDesignValidationStatus = async (designId?: number): Promise<{
    isValidated: boolean;
    needsValidation: boolean;
    message: string;
  }> => {
    try {
      if (!designId) {
        // Nouveau design uploadé - sera en attente de validation
        return {
          isValidated: false,
          needsValidation: true,
          message: 'Nouveau design détecté. Vos produits seront créés en attente de validation.'
        };
      }

      // Vérifier le statut via l'API des designs
      const data = await designService.getDesignValidationStatus(designId);
      
      if (data.isValidated) {
        return {
          isValidated: true,
          needsValidation: false,
          message: 'Design validé ! Vos produits seront directement publiés.'
        };
      } else {
        const reason = data.rejectionReason 
          ? `Design rejeté précédemment: ${data.rejectionReason}. Vous pouvez créer de nouveaux produits qui seront en attente de validation.` 
          : `Le design "${data.name}" n'est pas encore validé. Vos produits seront créés en attente de validation.`;
        
        return {
          isValidated: false,
          needsValidation: true,
          message: reason
        };
      }
    } catch (error) {
      console.error('Erreur vérification validation design:', error);
      return {
        isValidated: false,
        needsValidation: true,
        message: 'Impossible de vérifier le statut. Vos produits seront créés en attente de validation.'
      };
    }
  };

  // 🆕 Nouvelle fonction pour sauvegarder en brouillon
  const handleSaveAsDraft = async () => {
    try {
      // Laisser la modale ouverte pendant le traitement pour afficher la progression
      setCheckoutOpen(true);

      // 🆕 VALIDATION FINALE DES PRIX : Vérification non-bloquante avec avertissement pour brouillon
      const produitsAvecPrixInferieur: Array<{id: number, name: string, currentPrice: number, minimumPrice: number, type: string}> = [];
      
      selectedProductIds.forEach(idStr => {
        const productId = Number(idStr);
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const currentPrice = editStates[productId]?.price ?? product.suggestedPrice ?? product.price;
        const basePrice = basePrices[productId] || product.price;
        const hasSuggestedPrice = product.suggestedPrice && product.suggestedPrice > 0;

        if (currentPrice < basePrice) {
          const priceType = hasSuggestedPrice ? "prix suggéré" : "prix minimum";
          produitsAvecPrixInferieur.push({
            id: productId,
            name: product.name,
            currentPrice,
            minimumPrice: basePrice,
            type: priceType
          });
        }
      });

      // 🆕 AFFICHER UN AVERTISSEMENT SI PRIX INFÉRIEURS (MAIS NE PAS BLOQUER LA SAUVEGARDE)
      if (produitsAvecPrixInferieur.length > 0) {
        const details = produitsAvecPrixInferieur.map(p => 
          `• ${p.name}: ${p.currentPrice.toLocaleString()} FCFA (${p.type}: ${p.minimumPrice.toLocaleString()} FCFA)`
        ).join('\n');
        
        toast({
          title: `💡 Info: ${produitsAvecPrixInferieur.length} produit(s) avec prix inférieur sauvegardé(s)`,
          description: `Les produits suivants ont un prix inférieur au minimum recommandé mais ont été sauvegardés en brouillon:\n${details}`,
          variant: "default",
          duration: 8000,
        });
      }

      // 🆕 IMPORTANT: Forcer TO_DRAFT pour la sauvegarde en brouillon
      const originalAction = postValidationAction;
      setPostValidationAction(PostValidationAction.TO_DRAFT);

      // Récupérer le design sélectionné (nouveau ou existant)
      const selectedDesign = existingDesignsWithValidation.find(
        d => d.imageUrl === designUrl || d.thumbnailUrl === designUrl
      );

      // Vérifier (à titre informatif) le statut de validation, mais on forcera le brouillon quoi qu'il arrive
      const validationStatus = await checkDesignValidationStatus(selectedDesign?.id as number);
      setDesignValidationStatus(validationStatus);

      // Statut forcé = DRAFT pour le workflow MANUAL-PUBLISH
      const forcedStatus: 'DRAFT' = 'DRAFT';

      console.log('💾 Sauvegarde en brouillon avec nouveau système:', {
        designId: selectedDesign?.id,
        postValidationAction: PostValidationAction.TO_DRAFT
      });

      // 🔧 CORRECTION: Transférer les prix calculés avec customProfits vers editStates avant publication
      const updatedEditStates = { ...editStates };
      selectedProductIds.forEach(idStr => {
        const productId = Number(idStr);
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Si pas de prix déjà édité, calculer le prix final avec getSalePrice
        if (updatedEditStates[productId]?.price === undefined) {
          const finalPrice = getSalePrice(product);
          updatedEditStates[productId] = {
            ...updatedEditStates[productId],
            price: finalPrice
          };
          console.log(`💰 Prix final calculé pour ${product.name}: ${finalPrice} FCFA`);
        }
      });

      // 🆕 PREMIÈRE CRÉATION DES PRODUITS (toujours forcé en DRAFT)
      const results = await publishProducts(
        selectedProductIds,
        products,
        productColors,
        productSizes,
        updatedEditStates,
        basePrices,
        {
          designUrl,
          designFile,
          ...(selectedDesign?.id && { designId: Number(selectedDesign.id) }),
          designName: designName || selectedDesign?.name,
          designPrice: designPrice || selectedDesign?.price,
          postValidationAction: PostValidationAction.TO_DRAFT
        },
        getPreviewView,
        'DRAFT',
        defaultColorIds,
        sizePricingByProduct // 🆕 Prix par taille
      );

      const successful = (results || []).filter(r => r.success);
      
      if (successful.length > 0) {
        // 🆕 NOUVEAU SYSTÈME : Utiliser le service de validation pour chaque produit créé
        const statusPromises = successful.map(async (result) => {
          if (result.productId) {
            try {
              return await vendorProductValidationService.setProductStatus(result.productId, true); // true = isDraft
            } catch (error) {
              console.error(`Erreur lors de la mise en brouillon du produit ${result.productId}:`, error);
              return null;
            }
          }
          return null;
        });

        const statusResults = await Promise.all(statusPromises);
        const validatedDrafts = statusResults.filter(r => r && r.success);

        toast({
          title: `${validatedDrafts.length} produit(s) créé(s) en brouillon !`,
          description: validatedDrafts.some(r => r?.isValidated)
            ? 'Certains designs sont validés - vous pourrez les publier immédiatement.'
            : 'Vos produits sont en brouillon et seront publiables après validation des designs.',
          variant: 'success',
          duration: 8000
        });
      } else {
      toast({
        title: `${successful.length} produit(s) créé(s) en brouillon !`,
          description: 'Vos produits sont en brouillon et seront publiables après validation des designs.',
        variant: 'success',
        duration: 8000
      });
      }

      // Fermer la modale après succès
      setCheckoutOpen(false);

      // Restaurer l'action originale
      setPostValidationAction(originalAction);

      // Redirection vers la liste des produits brouillons
      setTimeout(() => {
        navigate('/vendeur/products');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde en brouillon:', error);
      toast({
        title: 'Erreur lors de la sauvegarde',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
        duration: 6000
      });
    }
  };

  // 🆕 Nouvelle fonction pour publier des brouillons existants selon pub.md
  const handlePublishFromDraft = async () => {
    try {
      setLoading(true);

      // 🔧 CORRECTION: Transférer les prix calculés avec customProfits vers editStates avant publication
      const updatedEditStates = { ...editStates };
      selectedProductIds.forEach(idStr => {
        const productId = Number(idStr);
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Si pas de prix déjà édité, calculer le prix final avec getSalePrice
        if (updatedEditStates[productId]?.price === undefined) {
          const finalPrice = getSalePrice(product);
          updatedEditStates[productId] = {
            ...updatedEditStates[productId],
            price: finalPrice
          };
          console.log(`💰 Prix final calculé pour ${product.name}: ${finalPrice} FCFA`);
        }
      });

      // Récupérer le design sélectionné
      const selectedDesign = existingDesignsWithValidation.find(d => d.imageUrl === designUrl || d.thumbnailUrl === designUrl);
      if (!selectedDesign) {
        toast({
          title: 'Erreur',
          description: 'Design introuvable pour la publication',
          variant: 'destructive'
        });
        return;
      }

      // 🆕 CRÉATION AVEC INTENTION DE PUBLICATION DIRECTE
      const results = await publishProducts(
        selectedProductIds,
        products,
        productColors,
        productSizes,
        updatedEditStates,
        basePrices,
        {
          designUrl,
          designFile,
          designId: Number(selectedDesign.id),
          designName: designName || selectedDesign.name,
          designPrice: designPrice || selectedDesign.price,
          postValidationAction: PostValidationAction.AUTO_PUBLISH
        },
        getPreviewView,
        'DRAFT',
        defaultColorIds,
        sizePricingByProduct // 🆕 Prix par taille
      );

      const successful = (results || []).filter(r => r.success);

      if (successful.length > 0) {
        // 🆕 NOUVEAU SYSTÈME : Utiliser le service de validation pour publication directe
        const publishPromises = successful.map(async (result) => {
          if (result.productId) {
            try {
              return await vendorProductValidationService.setProductStatus(result.productId, false); // false = publication directe
            } catch (error) {
              console.error(`Erreur lors de la publication du produit ${result.productId}:`, error);
              return null;
            }
          }
          return null;
        });

        const publishResults = await Promise.all(publishPromises);
        const publishedProducts = publishResults.filter(r => r && r.success);

        if (publishedProducts.length > 0) {
          const publishedCount = publishedProducts.filter(r => r?.status === 'PUBLISHED').length;
          const pendingCount = publishedProducts.filter(r => r?.status === 'PENDING').length;

          let description = '';
          if (publishedCount > 0) {
            description += `${publishedCount} produit(s) publié(s) immédiatement (design validé). `;
          }
          if (pendingCount > 0) {
            description += `${pendingCount} produit(s) en attente de validation design.`;
          }

      toast({
            title: `${publishedProducts.length} produit(s) traité(s) !`,
            description: description.trim(),
        variant: 'success',
        duration: 6000
      });
        } else {
          throw new Error('Aucun produit n\'a pu être publié');
        }
      }

      // Fermer la modale et rediriger
      setCheckoutOpen(false);
      setTimeout(() => {
        navigate('/vendeur/products');
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la publication depuis brouillon:', error);
      toast({
        title: 'Erreur lors de la publication',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishProducts = async () => {
    // 🆕 Variable pour collecter tous les productIds créés
    let allCreatedProductIds: number[] = [];

    try {
      // 🆕 Fermer le modal de confirmation et afficher le modal de progression
      setCheckoutOpen(false);

      // 🆕 Calculer le nombre total de couleurs sélectionnées pour l'estimation
      let totalColorCount = 0;
      selectedProductIds.forEach(idStr => {
        const productId = Number(idStr);
        const activeColors = (productColors[productId] || []).filter(c => c.isActive);
        totalColorCount += activeColors.length;
      });

      // 🆕 Estimation du temps de traitement
      const AVERAGE_TIME_PER_COLOR = 3000; // 3 secondes par couleur
      const totalEstimatedTime = totalColorCount * AVERAGE_TIME_PER_COLOR;

      // 🆕 Afficher le modal avec message initial
      setTotalColors(totalColorCount);
      setColorsProcessed(0);
      setGenerationProgress(0);
      setEstimatedTimeRemaining(totalEstimatedTime);
      setGenerationMessage('Transmission des données au serveur...');
      setShowProgressModal(true);
      setBackgroundUploadActive(true);

      // 🆕 VALIDATION FINALE DES PRIX : Vérification non-bloquante avec avertissement
      const produitsAvecPrixInferieur: Array<{id: number, name: string, currentPrice: number, minimumPrice: number, type: string}> = [];

      selectedProductIds.forEach(idStr => {
        const productId = Number(idStr);
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const currentPrice = editStates[productId]?.price ?? product.suggestedPrice ?? product.price;
        const basePrice = basePrices[productId] || product.price;
        const hasSuggestedPrice = product.suggestedPrice && product.suggestedPrice > 0;

        if (currentPrice < basePrice) {
          const priceType = hasSuggestedPrice ? "prix suggéré" : "prix minimum";
          produitsAvecPrixInferieur.push({
            id: productId,
            name: product.name,
            currentPrice,
            minimumPrice: basePrice,
            type: priceType
          });
        }
      });

      // 🆕 AFFICHER UN AVERTISSEMENT SI PRIX INFÉRIEURS (MAIS NE PAS BLOQUER)
      if (produitsAvecPrixInferieur.length > 0) {
        const details = produitsAvecPrixInferieur.map(p =>
          `• ${p.name}: ${p.currentPrice.toLocaleString()} FCFA (${p.type}: ${p.minimumPrice.toLocaleString()} FCFA)`
        ).join('\n');

        toast({
          title: `⚠️ Attention: ${produitsAvecPrixInferieur.length} produit(s) avec prix inférieur`,
          description: `Les produits suivants ont un prix inférieur au minimum recommandé mais seront tout de même publiés:\n${details}`,
          variant: "default",
          duration: 8000,
        });
      }

      // 🔧 CORRECTION: Transférer les prix calculés avec customProfits vers editStates avant publication
      const updatedEditStates = { ...editStates };
      selectedProductIds.forEach(idStr => {
        const productId = Number(idStr);
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Si pas de prix déjà édité, calculer le prix final avec getSalePrice
        if (updatedEditStates[productId]?.price === undefined) {
          const finalPrice = getSalePrice(product);
          updatedEditStates[productId] = {
            ...updatedEditStates[productId],
            price: finalPrice
          };
          console.log(`💰 Prix final calculé pour ${product.name}: ${finalPrice} FCFA`);
        }
      });

      // 🆕 NOUVEAU WORKFLOW ASYNCHRONE : Pas de blocage, création directe avec statut approprié
      const selectedDesign = existingDesignsWithValidation.find(d => d.imageUrl === designUrl || d.thumbnailUrl === designUrl);
      const validationStatus = await checkDesignValidationStatus(selectedDesign?.id as number);

      setDesignValidationStatus(validationStatus);

      // 🚀 Détermination du workflow selon la validation du design ET l'action choisie
      if (!validationStatus.isValidated) {
        // Design non validé - créer en PENDING peu importe l'action
        console.log('🚀 Design non validé - création en PENDING avec postValidationAction:', postValidationAction);

        const results = await publishProducts(
          selectedProductIds,
          products,
          productColors,
          productSizes,
          updatedEditStates,
          basePrices,
          {
            designUrl,
            designFile,
            ...(selectedDesign?.id && { designId: Number(selectedDesign.id) }),
            designName: designName || selectedDesign?.name,
            designPrice: designPrice || selectedDesign?.price,
            postValidationAction
          },
          getPreviewView,
          'PENDING',
          defaultColorIds,
          sizePricingByProduct // 🆕 Prix par taille
        );

        const successful = (results || []).filter(r => r.success);
        const actionText = postValidationAction === PostValidationAction.AUTO_PUBLISH
          ? 'automatiquement publiés après validation'
          : 'mis en brouillon après validation';

        // 🆕 Collecter les productIds créés
        const createdIds = successful.map(r => r.productId).filter((id): id is number => id !== undefined);
        allCreatedProductIds.push(...createdIds);
        console.log(`📦 [Design non validé] ${createdIds.length} produits créés:`, createdIds);

        toast({
          title: `${successful.length} produit(s) en attente de validation`,
          description: `⏳ Votre design doit être validé par l'administrateur. Vos produits seront ${actionText}.`,
          variant: 'default',
          duration: 8000
        });

      } else if (postValidationAction === PostValidationAction.AUTO_PUBLISH) {
        // Design validé + Publication directe = PUBLIER IMMÉDIATEMENT
        console.log('🚀 Design validé + Publication directe - Publication immédiate');

        // Utiliser le service de publication immédiate pour designs validés
        const results = await publishProducts(
          selectedProductIds,
          products,
          productColors,
          productSizes,
          updatedEditStates,
          basePrices,
          {
            designUrl,
            designFile,
            ...(selectedDesign?.id && { designId: Number(selectedDesign.id) }),
            designName: designName || selectedDesign?.name,
            designPrice: designPrice || selectedDesign?.price,
            postValidationAction
          },
          getPreviewView,
          'DRAFT',
          defaultColorIds,
          sizePricingByProduct // 🆕 Prix par taille
        );

        // 🚀 PUBLICATION IMMÉDIATE des produits créés (design validé)
        const successful = (results || []).filter(r => r.success);

        // 🆕 Collecter les productIds créés
        const createdIds = successful.map(r => r.productId).filter((id): id is number => id !== undefined);
        allCreatedProductIds.push(...createdIds);
        console.log(`📦 [Design validé + AUTO_PUBLISH] ${createdIds.length} produits créés:`, createdIds);

        let publishResults: any[] = [];

        if (successful.length > 0) {
          console.log('🚀 Publication immédiate des produits créés...');

          // 🆕 Publier chaque produit créé immédiatement avec le nouveau service
          const publishPromises = successful.map(async (result) => {
            if (result.productId) {
              try {
                const publishResult = await vendorProductValidationService.setProductStatus(result.productId, false); // false = publication directe
                console.log(`✅ Produit ${result.productId} publié immédiatement:`, publishResult.status);
                return publishResult;
              } catch (error) {
                console.error(`❌ Erreur publication immédiate produit ${result.productId}:`, error);
                return null;
              }
            }
            return null;
          });

          publishResults = await Promise.all(publishPromises);
          const actuallyPublished = publishResults.filter(r => r && r.status === 'PUBLISHED').length;

          console.log(`📊 Résultat publication: ${actuallyPublished}/${successful.length} produits effectivement publiés`);
        }

        // Mise à jour du toast avec les vraies données
        const actuallyPublished = publishResults.filter(r => r && r.status === 'PUBLISHED').length;
        const stillPending = publishResults.filter(r => r && r.status === 'PENDING').length;

        if (actuallyPublished > 0) {
        toast({
            title: `🎉 ${actuallyPublished} produit(s) publié(s) immédiatement !`,
            description: stillPending > 0
              ? `${stillPending} produit(s) restent en attente de validation admin.`
              : '🚀 Vos produits sont maintenant visibles par tous les clients.',
          variant: 'success',
          duration: 6000
        });
        } else if (stillPending > 0) {
          toast({
            title: `⏳ ${stillPending} produit(s) en attente`,
            description: 'Les designs doivent être validés par l\'admin avant publication.',
            variant: 'default',
            duration: 6000
          });
        }

      } else {
        // Design validé + Sauvegarde en brouillon
        console.log('🚀 Design validé + Brouillon - Création en DRAFT');

        const results = await publishProducts(
          selectedProductIds,
          products,
          productColors,
          productSizes,
          updatedEditStates,
          basePrices,
          {
            designUrl,
            designFile,
            ...(selectedDesign?.id && { designId: Number(selectedDesign.id) }),
            designName: designName || selectedDesign?.name,
            designPrice: designPrice || selectedDesign?.price,
            postValidationAction
          },
          getPreviewView,
          'DRAFT',
          defaultColorIds,
          sizePricingByProduct // 🆕 Prix par taille
        );

        const successful = (results || []).filter(r => r.success);

        // 🆕 Collecter les productIds créés
        const createdIds = successful.map(r => r.productId).filter((id): id is number => id !== undefined);
        allCreatedProductIds.push(...createdIds);
        console.log(`📦 [Design validé + TO_DRAFT] ${createdIds.length} produits créés:`, createdIds);

        toast({
          title: `${successful.length} produit(s) sauvé(s) en brouillon`,
          description: `💾 Votre produit est prêt. Vous pouvez le publier à tout moment.`,
          variant: 'success',
          duration: 6000
        });
      }

      // 🆕 Fermer l'ancien modal de progression
      setShowProgressModal(false);
      setBackgroundUploadActive(false);

      // 🆕 Ouvrir le modal de génération d'images si des produits ont été créés
      if (allCreatedProductIds.length > 0) {
        console.log(`🖼️ Ouverture du modal de génération pour ${allCreatedProductIds.length} produit(s):`, allCreatedProductIds);
        setCreatedProductIds(allCreatedProductIds);
        setShowImagesModal(true);
      } else {
        // Pas de produits créés, rediriger immédiatement
        console.log('⚠️ Aucun produit créé, redirection immédiate');
        setTimeout(() => {
          navigate('/vendeur/products');
        }, 2000);
      }

    } catch (error) {
      console.error('Erreur lors de la publication:', error);

      // Fermer les modals en cas d'erreur
      setShowProgressModal(false);
      setBackgroundUploadActive(false);
      setShowImagesModal(false);

      toast({
        title: 'Erreur lors de la publication',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive'
      });
    }
  };

  // Chargement des designs existants lors de l'ouverture du picker
  React.useEffect(() => {
    if (showDesignPicker && existingDesignsWithValidation.length === 0) {
      (async () => {
        try {
          await loadExistingDesignsWithValidation();
        } catch (err: any) {
          console.error('Erreur chargement designs existants:', err);
          toast({ 
            title: 'Erreur', 
            description: err.message || 'Impossible de charger vos designs.',
            variant: 'destructive'
          });
        }
      })();
    }
  }, [showDesignPicker, existingDesignsWithValidation.length]);

  const handleSelectExistingDesign = async (d: Design) => {
    try {
      // Vérifier le statut de validation du design sélectionné
      const validationStatus = await checkDesignValidationStatus(d.id as number);
      setDesignValidationStatus(validationStatus);
      
      // Nettoyer anciens états
      if (designUrl) URL.revokeObjectURL(designUrl);
      setDesignFile(null);
      setDesignName(d.name);
      setDesignDescription(d.description || '');
      setDesignPrice(d.price);
      setDesignUrl(d.imageUrl || d.thumbnailUrl || '');
      setShowDesignPicker(false);
      setSelectedMode('design');
      setLoading(true);
      setError(null);
      
      // 🆕 Messages adaptés au nouveau workflow permissif
      if (!validationStatus.isValidated) {
        toast({
          title: '✨ Design sélectionné',
          description: `"${d.name}" va être appliqué aux produits. Vos produits seront créés en attente de validation et automatiquement publiés dès validation.`,
          variant: 'default',
          duration: 6000
        });
      } else {
        toast({
          title: '✅ Design validé sélectionné',
          description: `"${d.name}" est déjà validé ! Vos produits seront créés et publiés immédiatement.`,
          variant: 'success',
          duration: 5000
        });
      }
      
      await fetchProducts();
    } catch (err: any) {
      console.error('Erreur sélection design:', err);
      setError(err.message || 'Erreur lors de la sélection du design');
    } finally {
      setLoading(false);
    }
  };

  // États pour la prévisualisation détaillée
  const [showDetailedPreview, setShowDetailedPreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewMode, setPreviewMode] = useState<'grid' | 'single'>('grid');
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  // Fonction pour ouvrir la prévisualisation détaillée
  const openDetailedPreview = (product: Product) => {
    setPreviewProduct(product);
    setShowDetailedPreview(true);
  };

  // Composant de prévisualisation par couleur
  const ColorPreview: React.FC<{ product: Product; color: Color }> = ({ product, color }) => {
    const view = getViewForColor(product, color);
    if (!view) return null;

    // Déterminer l'ID VendorProduct selon la règle d'or
    const vendorProductId = getVendorProductId(product) ?? 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 mb-3">
          <ProductViewWithDesign 
            view={view} 
            designUrl={designUrl} 
            productId={vendorProductId} // Utilise l'ID VendorProduct pour les appels backend
            products={products}
            vendorDesigns={existingDesignsWithValidation}
          />
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: color.colorCode }}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {color.name}
          </span>
        </div>
      </div>
    );
  };

  // Fonction pour obtenir la vue par couleur (basée sur getPreviewView)
  const getViewForColor = (product: Product, color?: Color | null) => {
    if (!product.colorVariations || product.colorVariations.length === 0) {
      // Aucun système de variations : fallback sur la première vue front ou la première vue tout court
      const frontFallback = product.views?.find(v => (v.viewType || '').toUpperCase() === 'FRONT');
      const selectedView = frontFallback || product.views?.[0];
      
      // ✅ CORRECTION: Vérifier que l'URL n'est pas vide (utiliser imageUrl pour les vues produit)
      const imageUrl = selectedView?.imageUrl || '';
      if (!selectedView || !imageUrl.trim()) {
        return null; // Retourner null au lieu d'un objet avec URL vide
      }
      
      return {
        ...selectedView,
        imageUrl // 🆕 CORRECTION: Garder imageUrl au lieu de normaliser vers url
      };
    }
    
    let variation: any | undefined;
    
    if (color) {
      // Trouver la variation correspondant à la couleur spécifiée
      variation = product.colorVariations.find(cv => 
        cv.id === color.id || 
        cv.name.toLowerCase() === color.name.toLowerCase() ||
        cv.colorCode === color.colorCode
      );
    }
    
    // Fallback sur la première variation si couleur non trouvée
    if (!variation) {
      variation = product.colorVariations[0];
    }
    
    // Sélection de l'image : priorité à la vue FRONT
    if (variation?.images && variation.images.length > 0) {
      const frontImage = variation.images.find((img: any) => (img.view || '').toUpperCase() === 'FRONT');
      const selectedView = frontImage || variation.images[0];
      
      // ✅ CORRECTION: Construire l'URL proprement et vérifier qu'elle n'est pas vide
      const imageUrl = selectedView.url || selectedView.imageUrl || selectedView.src || '';
      
      if (!imageUrl.trim()) {
        // Si pas d'URL valide dans cette variation, essayer les vues du produit
        const frontFallback = product.views?.find(v => (v.viewType || '').toUpperCase() === 'FRONT');
        const fallbackView = frontFallback || product.views?.[0];
        const fallbackUrl = fallbackView?.imageUrl || '';
        
        if (!fallbackView || !fallbackUrl.trim()) {
          return null; // Pas d'image valide trouvée
        }
        
        return {
          ...fallbackView,
          imageUrl: fallbackUrl // 🆕 CORRECTION: Garder imageUrl
        };
      }
      
      return {
        ...selectedView,
        viewType: selectedView.viewType || selectedView.view || 'FRONT',
        imageUrl, // 🆕 CORRECTION: Utiliser imageUrl au lieu de url
        id: selectedView.id || null,
        width: selectedView.width || null,
        height: selectedView.height || null,
        naturalWidth: selectedView.naturalWidth || null,
        naturalHeight: selectedView.naturalHeight || null,
        delimitations: selectedView.delimitations || []
      };
    }
    
    // Dernier recours : chercher une vue FRONT au niveau produit
    const frontFallback = product.views?.find(v => (v.viewType || '').toUpperCase() === 'FRONT');
    const fallbackView = frontFallback || product.views?.[0];
    const fallbackUrl = fallbackView?.imageUrl || '';
    
    // ✅ CORRECTION: Vérifier que l'URL de fallback n'est pas vide
    if (!fallbackView || !fallbackUrl.trim()) {
      return null;
    }
    
    return {
      ...fallbackView,
      imageUrl: fallbackUrl // 🆕 CORRECTION: Garder imageUrl
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-grow w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        {/* Hero section moderne */}
        <div className="text-center mb-16 pt-8">
          <div className="max-w-3xl mx-auto">
            {/* Titre principal */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              Vendez vos designs
            </h1>
            
            {/* Sous-titre */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Transformez votre créativité en revenus. Choisissez votre méthode.
            </p>
          </div>
        </div>


        {/* Sélecteur d'options */}
        {!selectedMode && (
          <div className="max-w-4xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Comment souhaitez-vous vendre ?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Option 1: Ajouter des designs aux produits existants */}
              <button 
                className="group text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-900 dark:hover:border-white transition-all duration-200"
                onClick={() => setSelectedMode('design')}
              >
                <div className="mb-4">
                  <Palette className="w-8 h-8 text-gray-900 dark:text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Appliquer vos designs
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Utilisez nos produits configurés. Ajoutez votre design et vendez immédiatement.
                </p>
                
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                  Recommandé pour débuter
                </div>
              </button>

              {/* Option 2: Créer ses propres produits */}
              <button
                className="group text-left bg-gray-900 dark:bg-white border border-gray-900 dark:border-white rounded-lg p-6 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200"
                onClick={() => navigate('/vendeur/create-product')}
              >
                <div className="mb-4">
                  <Package className="w-8 h-8 text-white dark:text-gray-900" />
                </div>
                
                <h3 className="text-xl font-semibold text-white dark:text-gray-900 mb-2">
                  Créer vos produits
                </h3>
                
                <p className="text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                  Créez entièrement vos produits. Contrôlez images, prix et descriptions.
                </p>
                
                <div className="mt-4 text-xs text-gray-400 dark:text-gray-600">
                  Pour les créateurs avancés
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Bouton de retour */}
        {selectedMode && (
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMode(null)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Retour
            </Button>
          </div>
        )}

        {/* Mode: Ajouter un design aux produits existants */}
        {selectedMode === 'design' && (
          <div className="space-y-8">
            {/* Section d'upload */}
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ajoutez votre design
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Téléchargez votre création
                </p>
              </div>

              {/* Zone d'upload */}
              <div className="relative">
                {!designUrl ? (
                  /* État initial - deux options séparées */
                  <div className="space-y-6">
                    {/* Onglets modernes */}
                    <div className="flex items-center justify-center">
                      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button
                          type="button"
                          className="px-6 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        >
                          Nouveau fichier
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDesignPicker(true)}
                          className="px-6 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          Mes designs
                        </button>
                      </div>
                    </div>

                    {/* Zone d'upload pour nouveau fichier */}
                    <div className="relative">
                      <input
                        id="design-upload"
                        type="file"
                        accept="image/*,.svg,image/svg+xml"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-900 dark:hover:border-white transition-colors duration-200">
                        <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                          <CloudUpload className="w-full h-full" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Glissez votre fichier ici
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          ou cliquez pour parcourir
                        </p>
                        <div className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium">
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir un fichier
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                          PNG, JPG, SVG • Max 5 Mo
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Min. 1000×1000 px · Min. 100 DPI
                        </p>
                      </div>
                      <DesignFileChecker file={checkerFile} onValidationChange={setFileIsValid} />
                    </div>
                  </div>
                ) : (
                  /* État avec design chargé */
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <img 
                          src={designUrl} 
                          alt="Design sélectionné" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {designName || designFile?.name || 'Design sélectionné'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {designFile ? `${Math.round(designFile.size / 1024)} KB` : 'Design existant'}
                        </p>
                        {designDescription && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                            {designDescription}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                            <Check className="w-4 h-4 mr-1" />
                            Prêt à appliquer
                          </div>
                          {designPrice > 0 && (
                            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                              {designPrice} FCFA
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDesignUrl('');
                          setDesignFile(null);
                          setDesignName('');
                          setDesignDescription('');
                          setDesignPrice(0);
                          setProducts([]);
                          setSelectedProductIds([]);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-white flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded">
                      <Loader2 className="w-4 h-4 animate-spin" aria-label="Chargement" />
                      <span className="text-sm">Upload en cours...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

           

            {error && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
              </div>
            )}

            {/* Info panel modernisé */}
            {designUrl && (
              <div className="max-w-4xl mx-auto">
                {/* Statut de validation du design */}
                {designValidationStatus.message && (
                  <div className={`mb-6 p-4 rounded-xl border ${
                    designValidationStatus.isValidated 
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        designValidationStatus.isValidated 
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {designValidationStatus.isValidated ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Info className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${
                          designValidationStatus.isValidated 
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-blue-800 dark:text-blue-200'
                        }`}>
                          {designValidationStatus.isValidated 
                            ? '✅ Design validé - Publication immédiate' 
                            : '⏳ Design en cours de validation - Création permise'
                          }
                        </h3>
                        <p className={`text-sm ${
                          designValidationStatus.isValidated 
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-blue-700 dark:text-blue-300'
                        }`}>
                          {designValidationStatus.isValidated 
                            ? 'Votre design est approuvé ! Créez vos produits, ils seront directement publiés.'
                            : 'Vous pouvez créer vos produits maintenant. Ils seront en attente et automatiquement publiés dès que votre design sera validé par l\'équipe.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-black to-gray-800 dark:from-white dark:to-gray-200 rounded-2xl p-6 text-white dark:text-black">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-black flex items-center justify-center flex-shrink-0">
                      <Info className="h-6 w-6 text-black dark:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                Personnalisez vos produits
              </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
                          Modifiez les noms et prix directement
              </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
                          Cliquez sur les couleurs pour prévisualiser
            </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
                          Activez/désactivez couleurs et tailles
          </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
                          Prévisualisez avant publication
        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid des produits modernisé */}
        {designUrl && !loading && (
              <div className="space-y-8">
                {/* En-tête de section */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-black dark:text-white mb-2">
                    Vos produits personnalisés
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''} • {selectedProductIds.length} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grille responsive: 1 col mobile, 2 cols sm, 3 cols md+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const isChecked = selectedProductIds.includes(String(product.id));
                  const isSaving = savingProductIds.includes(product.id);
                  const isSaved = savedProductIds.includes(product.id);
                    
                  return (
                    <div
                      key={product.id}
                      data-product-id={product.id}
                      className={`group relative bg-white dark:bg-black border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                          isChecked 
                            ? 'border-black dark:border-white shadow-lg' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        {/* Badge type de produit (autocollant ou tableau) */}
                        {(product.genre as string === 'AUTOCOLLANT' || product.genre as string === 'TABLEAU') && (
                          <div className="absolute top-4 left-4 z-20">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {(product.genre as string) === 'AUTOCOLLANT' ? 'Autocollant' : 'Tableau'}
                            </div>
                          </div>
                        )}

                        {/* Indicateur de sélection moderne */}
                        <div className="absolute top-4 right-4 z-20">
                          <button
                        onClick={() => {
                          setSelectedProductIds((prev) =>
                            prev.includes(String(product.id))
                              ? prev.filter((id) => id !== String(product.id))
                              : [...prev, String(product.id)]
                          );
                        }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-black dark:bg-white border-black dark:border-white'
                                : 'bg-white dark:bg-black border-blue-400 dark:border-blue-600 hover:border-blue-600 dark:hover:border-blue-400'
                            }`}
                          >
                            {isChecked && (
                              <Check className="w-3 h-3 text-white dark:text-black" />
                            )}
                          </button>
                        </div>

                        {/* Image du produit */}
                        <div className="aspect-square p-4">
                        <div 
                            className="relative w-full h-full cursor-pointer rounded-xl overflow-hidden"
                          onClick={() => {
                              // Clic sur l'image pour revenir à la vue par défaut
                            if (selectedColorIds[product.id] && selectedColorIds[product.id] !== 0) {
                              setSelectedColorIds(prev => ({ ...prev, [product.id]: 0 }));
                              toast({
                                title: "Vue par défaut",
                                description: "Retour à l'affichage par défaut",
                                duration: 2000,
                              });
                            }
                          }}
                          title={selectedColorIds[product.id] && selectedColorIds[product.id] !== 0 ? "Cliquer pour revenir à la vue par défaut" : "Vue par défaut"}
                        >
                          {(() => {
                            const view = getPreviewView(product);
                            return view ? (
                              <div className="relative w-full h-full">
                                <ProductViewWithDesign 
                                  view={view} 
                                  designUrl={designUrl} 
                                  productId={getVendorProductId(product) ?? 0} 
                                  products={products} 
                                  vendorDesigns={existingDesignsWithValidation}
                                />
                                
                                  {/* Indicateur de couleur sélectionnée */}
                                {selectedColorIds[product.id] && selectedColorIds[product.id] !== 0 && (
                                    <div className="absolute top-2 left-2 bg-white dark:bg-black rounded-full px-3 py-1 shadow-lg border border-gray-200 dark:border-gray-800 flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ 
                                        backgroundColor: (productColors[product.id] || [])
                                          .find(c => c.id === selectedColorIds[product.id])?.colorCode || '#000'
                                      }}
                                    />
                                      <span className="text-xs font-medium text-black dark:text-white">
                                      {(productColors[product.id] || [])
                                        .find(c => c.id === selectedColorIds[product.id])?.name || 'Couleur'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                        {/* Contenu de la carte */}
                        <div className="p-6 space-y-4">
                          {/* Nom et description */}
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editStates[product.id]?.name ?? product.name}
                              onChange={e => handleFieldChange(product.id, 'name', e.target.value)}
                              onBlur={() => handleSave(product.id)}
                              className="w-full text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 text-black dark:text-white placeholder-gray-400"
                              placeholder="Nom du produit"
                            />

                            <textarea
                              value={editStates[product.id]?.description ?? (product.description || '')}
                              onChange={e => handleFieldChange(product.id, 'description', e.target.value)}
                              onBlur={() => handleSave(product.id)}
                              className="w-full text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none focus:ring-0 p-0 resize-none placeholder-gray-400"
                              placeholder="Description du produit..."
                              rows={2}
                            />
                          </div>
                          
                          {/* 🔄 NOUVEAU: Système de pricing basé sur suggestedPrice */}
                          <div className="space-y-3">
                            {(() => {
                              // 🏭 Prix de revient mockup (coût de production) - FIXE, NE CHANGE JAMAIS
                              const prixDeRevientMockup = prixDeRevientOriginaux[product.id] || product.price; // Prix de revient original FIXE
                              // 📈 Bénéfice du vendeur
                              const customProfit = customProfits[product.id] || 0;
                              // 🛒 Prix de vente final = Prix de revient mockup + Bénéfice vendeur
                              const currentPrice = prixDeRevientMockup + customProfit;
                              // 🔄 CALCUL LOGIQUE: Pourcentage de marge par rapport au prix de revient
                              const profitPercentage = prixDeRevientMockup > 0 ? 
                                Math.round((customProfit / prixDeRevientMockup) * 100) : 0;
                              const isExpanded = expandedPricingIds[product.id];
                              
                              // 🎯 NOUVEAU: Déterminer si on utilise suggestedPrice
                              const hasSuggestedPrice = product.suggestedPrice && product.suggestedPrice > 0;
                              const originalPrice = product.price;
                              const isUsingSuggestedPrice = hasSuggestedPrice && currentPrice >= (product.suggestedPrice || 0);
                              const isEditing = editingProfitIds[product.id];

                              return (
                                <>
                                  {/* Affichage principal responsive avec indicateurs intelligents */}
                                  <motion.div
                                    className="relative overflow-hidden"
                                    layout
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                  >
                                    <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                                      {/* Header avec plage de prix par taille */}
                                      <div className="p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                                                Prix par taille
                                              </span>
                                              <div className="flex items-center gap-1">
                                                {isSaving && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                                                {isSaved && (
                                                  <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                                                  >
                                                    <Check className="h-2 w-2 text-white" />
                                                  </motion.div>
                                                )}
                                              </div>
                                            </div>
                                            {/* 🔄 Plage de prix ou "À partir de" */}
                                            <div className="mb-2">
                                              {(() => {
                                                // Récupérer tous les prix des tailles actives
                                                const activeSizes = (productSizes[product.id] || []).filter(s => s.isActive);
                                                const prices = activeSizes.map(size => {
                                                  const sizePrice = sizePricingByProduct[product.id]?.[size.sizeName];
                                                  const hasCustomPrice = sizePrice && sizePrice.salePrice > 0;
                                                  const defaultPrice = product.sizePrices?.find(sp => sp.size === size.sizeName)?.suggestedPrice || product.suggestedPrice || product.price;
                                                  return hasCustomPrice ? sizePrice.salePrice : defaultPrice;
                                                }).filter(p => p > 0);

                                                if (prices.length === 0) {
                                                  return (
                                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                                      {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'XOF',
                                                        maximumFractionDigits: 0
                                                      }).format(currentPrice)}
                                                    </div>
                                                  );
                                                }

                                                const minPrice = Math.min(...prices);
                                                const maxPrice = Math.max(...prices);

                                                if (minPrice === maxPrice) {
                                                  // Un seul prix
                                                  return (
                                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                                      {minPrice.toLocaleString()} F CFA
                                                    </div>
                                                  );
                                                }

                                                // Plage de prix
                                                return (
                                                  <div>
                                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                                              À partir de {minPrice.toLocaleString()} F CFA
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                              jusqu'à {maxPrice.toLocaleString()} F CFA
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </div>

                                          </div>

                                          {/* Bouton flèche pour panneau latéral moderne */}
                                          <button
                                            onClick={() => togglePricingExpansion(product.id)}
                                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                                          >
                                            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform group-hover:translate-x-0.5" />
                                          </button>
                                        </div>
                                      </div>

                                    </div>

                                    {/* Effet de lueur pour état actif */}
                                    {isExpanded && (
                                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl" />
                                    )}
                                  </motion.div>

                                  {priceErrors[product.id] && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
                                    >
                                      <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                        <div className="flex-shrink-0">
                                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        {priceErrors[product.id]}
                                      </p>
                                    </motion.div>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Couleurs et tailles */}
                          <div className="space-y-4">
                            {/* Couleurs */}
                          {(productColors[product.id] || []).length > 0 && (
                              <div>
                              <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-black dark:text-white">
                                    Couleurs ({(productColors[product.id] || []).filter(c => c.isActive).length}/{(productColors[product.id] || []).length})
                                  </span>
                                {selectedColorIds[product.id] && selectedColorIds[product.id] !== 0 && (
                                  <button
                                    onClick={() => {
                                      setSelectedColorIds(prev => ({ ...prev, [product.id]: 0 }));
                                      toast({
                                        title: "Vue par défaut",
                                        description: "Retour à l'affichage par défaut",
                                        duration: 2000,
                                      });
                                    }}
                                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium"
                                  >
                                      Défaut
                                  </button>
                                )}
                              </div>
                              
                                <div className="grid grid-cols-3 gap-2">
                                  {(productColors[product.id] || []).slice(0, 6).map((color) => {
                                  const isSelected = selectedColorIds[product.id] === color.id;
                                  const isDefault = defaultColorIds[product.id] === color.id;
                                    const activeColorsCount = (productColors[product.id] || []).filter(c => c.isActive).length;
                                    const canDeactivate = !(activeColorsCount === 1 && color.isActive);

                                  return (
                                      <div key={color.id} className="text-center relative">
                                        <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                            if (color.isActive) {
                                          handleSelectColor(product.id, color.id);
                                          toast({
                                            title: "Couleur sélectionnée",
                                            description: `Affichage en ${color.name}`,
                                            duration: 2000,
                                          });
                                        }
                                      }}
                                          className={`relative w-10 h-10 rounded-full border-2 mx-auto mb-1 transition-all ${
                                            isSelected && color.isActive
                                              ? 'border-black dark:border-white scale-110'
                                              : color.isActive
                                                ? 'border-gray-300 dark:border-gray-600 hover:scale-105'
                                                : 'border-gray-300 dark:border-gray-600 opacity-50'
                                          }`}
                                          style={{ backgroundColor: color.colorCode }}
                                          title={`${color.name} - ${color.isActive ? 'Cliquer pour prévisualiser' : 'Couleur désactivée'}`}
                                        >
                                          {isSelected && color.isActive && (
                                            <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-sm" />
                                          )}
                                          {!color.isActive && (
                                            <X className="absolute inset-0 m-auto w-4 h-4 text-red-500 bg-white rounded-full" />
                                          )}
                                        </button>

                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {color.name}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (color.isActive) {
                                                setDefaultColorIds(prev => ({ ...prev, [product.id]: color.id }));
                                                toast({
                                                  title: "Couleur par défaut définie",
                                                  description: `${color.name} sera affichée en premier aux clients`,
                                                  duration: 2000,
                                                });
                                              }
                                            }}
                                            className={`p-0.5 rounded transition-colors ${
                                              isDefault && color.isActive
                                                ? 'text-yellow-500'
                                                : color.isActive
                                                  ? 'text-gray-400 hover:text-yellow-500'
                                                  : 'text-gray-300 opacity-50 cursor-not-allowed'
                                            }`}
                                            title={isDefault ? "Couleur par défaut" : "Définir comme couleur par défaut"}
                                          >
                                            <Star className={`w-3 h-3 ${isDefault ? 'fill-yellow-500' : ''}`} />
                                          </button>
                                        </div>
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (canDeactivate) {
                                            handleColorToggle(product.id, color.id);
                                            } else {
                                              toast({
                                                title: "Action impossible",
                                                description: "Vous devez conserver au moins une couleur active",
                                                variant: "destructive",
                                                duration: 3000,
                                              });
                                            }
                                          }}
                                          className={`w-6 h-3 rounded-full transition-all mx-auto block ${
                                            color.isActive 
                                              ? 'bg-green-500' 
                                              : 'bg-gray-300 dark:bg-gray-600'
                                          } ${!canDeactivate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                                          title={color.isActive ? 'Désactiver cette couleur' : 'Activer cette couleur'}
                                        >
                                          <div className={`w-2 h-2 bg-white rounded-full transition-transform mt-0.5 ${
                                            color.isActive ? 'translate-x-3' : 'translate-x-0.5'
                                          }`} />
                                        </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                            {/* Tailles avec prix */}
                            {(productSizes[product.id] || []).length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-black dark:text-white block mb-3">
                                  Tailles et prix
                                </span>
                                <div className="space-y-2">
                                  {(productSizes[product.id] || []).map((size) => {
                                    // Récupérer le prix personnalisé pour cette taille
                                    const sizePrice = sizePricingByProduct[product.id]?.[size.sizeName];
                                    const hasCustomPrice = sizePrice && sizePrice.salePrice > 0;

                                    // Calculer le prix suggéré par défaut pour cette taille
                                    const defaultPrice = product.sizePrices?.find(sp => sp.size === size.sizeName)?.suggestedPrice || product.suggestedPrice || product.price;

                                    // Prix final à afficher
                                    const displayPrice = hasCustomPrice ? sizePrice.salePrice : defaultPrice;

                                    return (
                                      <button
                                        key={size.id}
                                        onClick={() => handleSizeToggle(product.id, size.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                                          size.isActive
                                            ? 'bg-black dark:bg-white text-white dark:text-black'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        } hover:opacity-80`}
                                      >
                                        <span className="text-xs font-medium">{size.sizeName}</span>
                                        <div className="flex items-center gap-2">
                                          {hasCustomPrice && (
                                            <span className="text-xs opacity-75 line-through">
                                              {defaultPrice.toLocaleString()} FCFA
                                            </span>
                                          )}
                                          <span className="text-sm font-bold">
                                            {displayPrice.toLocaleString()} FCFA
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Compteur de produits sélectionnés */}
                {selectedProductIds.length > 0 && (
                  <div className="text-center pt-8 pb-8">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedProductIds.length} produit{selectedProductIds.length > 1 ? 's' : ''} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
                      </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode: Créer ses propres produits */}
        {selectedMode === 'product' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Créer un nouveau produit
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configurez entièrement votre produit personnalisé
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <VendorProductForm />
            </div>
          </div>
        )}
      </div>
      
      {/* Panneau latéral moderne pour la configuration des prix */}
      <AnimatePresence>
        {Object.keys(expandedPricingIds).some(id => expandedPricingIds[Number(id)]) && (
          <>
            {/* Backdrop avec transparence */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setExpandedPricingIds({})}
            />

            {/* Panneau latéral */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 40
              }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Configuration des prix
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Ajustez vos prix et bénéfices
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedPricingIds({})}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {products.filter(product => expandedPricingIds[product.id]).map(product => {
                  const prixDeRevientMockup = prixDeRevientOriginaux[product.id] || product.price;
                  const customProfit = customProfits[product.id] || 0;
                  const currentPrice = prixDeRevientMockup + customProfit;
                  const profitPercentage = prixDeRevientMockup > 0 ?
                    Math.round((customProfit / prixDeRevientMockup) * 100) : 0;
                  const hasSuggestedPrice = product.suggestedPrice && product.suggestedPrice > 0;
                  // 🆕 Vérifier si le produit a des prix par taille (sizePrices)
                  const hasSizePricing = product.sizePrices && product.sizePrices.length > 0;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50"
                    >
                      {/* En-tête produit */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Prix actuel: {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                              maximumFractionDigits: 0
                            }).format(currentPrice)}
                          </p>
                        </div>
                      </div>

                      {/* 🆕 Utiliser SizePricingConfig si le produit a des prix par taille */}
                      {hasSizePricing ? (
                        <SizePricingConfig
                          product={product}
                          onPricesChange={handleSizePricesChange}
                          currentPrices={sizePricingByProduct}
                          commissionRate={vendorCommission ?? undefined}
                          activeSizes={productSizes[product.id]?.filter(s => s.isActive)}
                        />
                      ) : (
                        <>
                          {/* Section prix suggéré (ancien système) */}
                          {hasSuggestedPrice && (
                            <div className="mb-6">
                              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  <h5 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                    Système de prix suggéré activé
                                  </h5>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="bg-white/50 dark:bg-gray-800/50 rounded p-3 border border-purple-100 dark:border-purple-800">
                                    <div className="text-gray-600 dark:text-gray-400 mb-1">Prix de revient</div>
                                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                                      {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: 'XOF',
                                        maximumFractionDigits: 0
                                      }).format(prixDeRevientMockup)}
                                    </div>
                                  </div>

                                  <div className="bg-purple-100/50 dark:bg-purple-900/50 rounded p-3 border border-purple-200 dark:border-purple-700">
                                    <div className="text-purple-600 dark:text-purple-300 mb-1">Prix suggéré</div>
                                    <div className="font-bold text-purple-800 dark:text-purple-200">
                                      {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: 'XOF',
                                        maximumFractionDigits: 0
                                      }).format(product.suggestedPrice)}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 text-xs text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-900/30 rounded p-2">
                                  <span className="font-medium">💡 Info:</span> Ajoutez votre bénéfice au-dessus de ce prix suggéré.
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Configuration du prix */}
                          <div className="space-y-4">
                            {/* Info sur la marge maximale */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                              <div className="text-xs text-blue-700 dark:text-blue-300">
                                <span className="font-medium">💡 MARGE RECOMMANDÉE:</span> Il est conseillé de vendre au minimum à prix de revient + 10%
                                <br />
                                <span className="text-blue-600 dark:text-blue-400">
                                  Prix de revient 6000 FCFA → Prix recommandé: 6600 FCFA (vous pouvez vendre moins ou plus)
                                </span>
                              </div>
                            </div>
                            {/* Prix de vente */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {(() => {
                                  const currentValue = pricingInputValues[product.id] !== undefined
                                    ? Number(pricingInputValues[product.id])
                                    : currentPrice;
                                  const suggestedPrice = product.suggestedPrice ?? product.price;
                                  const isUsingSuggestedPrice = currentValue === suggestedPrice;
                                  return isUsingSuggestedPrice ? "Prix de vente suggéré" : "Prix de vente personnalisé";
                                })()}
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="100"
                                  value={pricingInputValues[product.id] !== undefined
                                    ? pricingInputValues[product.id]
                                    : String(product.suggestedPrice ?? product.price)}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    setPricingInputValues(prev => ({ ...prev, [product.id]: raw }));

                                    const nouveauPrixDeVente = Number(raw);
                                    if (Number.isFinite(nouveauPrixDeVente) && nouveauPrixDeVente > 0) {
                                      // ✅ NOUVEAU: Pas de blocage - juste avertissement
                                      const prixMinimumAvecMarge = prixDeRevientMockup * 1.10; // Prix recommandé avec 10% de marge
                                      const nouveauBenefice = Math.max(0, nouveauPrixDeVente - prixDeRevientMockup);

                                      // Toujours mettre à jour les valeurs
                                      setCustomProfits(prev => ({ ...prev, [product.id]: nouveauBenefice }));
                                      handleFieldChange(product.id, 'price', nouveauPrixDeVente);

                                      // Avertissement si en dessous du minimum recommandé
                                      if (nouveauPrixDeVente < prixMinimumAvecMarge) {
                                        setPriceErrors(prev => ({
                                          ...prev,
                                          [product.id]: `⚠️ Prix recommandé minimum: ${Math.round(prixMinimumAvecMarge).toLocaleString()} FCFA (prix de revient + 10% de marge)`
                                        }));
                                      } else {
                                        // Prix correct - pas d'erreur
                                        setPriceErrors(prev => { const { [product.id]: _, ...rest } = prev; return rest; });
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // ✅ CORRIGÉ: Ne sauvegarder que si on quitte vraiment le champ, pas lors de la fermeture du panneau
                                    setTimeout(() => {
                                      if (expandedPricingIds[product.id]) {
                                        handleSave(product.id);
                                      }
                                    }, 100);
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                                />
                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">FCFA</span>
                              </div>
                              {priceErrors[product.id] && (
                                <div className="text-xs text-red-600 dark:text-red-400">{priceErrors[product.id]}</div>
                              )}
                            </div>

                            {/* Bénéfice */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-green-700 dark:text-green-300">
                                Votre bénéfice
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="100"
                                  value={customProfit}
                                  onChange={(e) => {
                                    const newProfit = Math.max(0, Number(e.target.value));
                                    const nouveauPrixDeVente = prixDeRevientMockup + newProfit;

                                    // ✅ NOUVEAU: Pas de blocage - juste avertissement
                                    const beneficeMinimumRecommande = prixDeRevientMockup * 0.10; // 10% de marge recommandée

                                    // Toujours mettre à jour les valeurs
                                    setCustomProfits(prev => ({ ...prev, [product.id]: newProfit }));
                                    handleFieldChange(product.id, 'price', nouveauPrixDeVente);

                                    // ✅ NOUVEAU: Synchroniser le champ prix de vente pour qu'il s'affiche
                                    setPricingInputValues(prev => ({ ...prev, [product.id]: String(nouveauPrixDeVente) }));

                                    // Avertissement si bénéfice trop faible
                                    if (newProfit < beneficeMinimumRecommande) {
                                      setPriceErrors(prev => ({
                                        ...prev,
                                        [product.id]: `⚠️ Bénéfice recommandé minimum: ${Math.round(beneficeMinimumRecommande).toLocaleString()} FCFA (10% de marge)`
                                      }));
                                    } else {
                                      // Bénéfice correct - pas d'erreur
                                      setPriceErrors(prev => { const { [product.id]: _, ...rest } = prev; return rest; });
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // ✅ CORRIGÉ: Ne sauvegarder que si on quitte vraiment le champ, pas lors de la fermeture du panneau
                                    setTimeout(() => {
                                      if (expandedPricingIds[product.id]) {
                                        handleSave(product.id);
                                      }
                                    }, 100);
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
                                />
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">FCFA</span>
                              </div>
                            </div>
                          </div>

                          {/* Résumé des revenus - Affiché seulement si valeurs valides */}
                          {(() => {
                            const revenue = getVendorRevenue(product);
                            const isValidRevenue = Number.isFinite(revenue) && revenue >= 0;

                            if (!isValidRevenue && !commissionLoading) {
                              return null; // Ne pas afficher si invalide
                            }

                            return (
                              <div className="mt-6 bg-green-50 dark:bg-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                      Vos revenus par vente
                                    </span>
                                  </div>
                                  <div className="text-lg font-bold text-green-800 dark:text-green-200">
                                    {commissionLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                    ) : (
                                      commissionService.formatCFA(revenue)
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bouton flottant qui suit le scroll */}
      <AnimatePresence>
        {selectedProductIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => {
                console.log('🔥 Bouton flottant cliqué, ouverture modal...', { selectedProductIds });
                setCheckoutOpen(true);
              }}
              size="lg"
              className="px-6 py-4 bg-green-600 text-white hover:bg-green-700 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 font-semibold flex items-center gap-3"
            >
              <Eye className="h-5 w-5" />
              <span className="hidden sm:inline">Prévisualiser et publier</span>
              <span className="sm:hidden">Publier</span>
              <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-xs font-bold">
                {selectedProductIds.length}
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toaster pour les notifications */}
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
      />

      {/* Modal de confirmation avant publication */}
      <Dialog open={checkoutOpen && !isPublishing} onOpenChange={(open) => {
        console.log('🔥 Modal state change:', { open, checkoutOpen });
        setCheckoutOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              Publier {selectedProductIds.length} produit{selectedProductIds.length > 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-3">
              {(() => {
                let totalColorCount = 0;
                selectedProductIds.forEach(idStr => {
                  const productId = Number(idStr);
                  const activeColors = (productColors[productId] || []).filter(c => c.isActive);
                  totalColorCount += activeColors.length;
                });
                const totalSeconds = Math.round((totalColorCount * 3000) / 1000);
                const timeText = totalSeconds < 60 ? `${totalSeconds} secondes` : `${Math.floor(totalSeconds / 60)} min ${totalSeconds % 60} sec`;
                return `Temps de préparation : environ ${timeText}`;
              })()}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={handleSaveAsDraft}
              variant="outline"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Enregistrer en brouillon
            </Button>
            <Button
              onClick={handlePublishProducts}
              className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white"
            >
              Publier maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de progression - Design minimaliste fermable */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {/* Animation de chargement */}
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>

            {/* Message principal */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Préparation en cours
            </h3>

            <p className="text-sm text-gray-500 mb-8 text-center">
              Vos produits sont en cours de préparation
            </p>

            {/* Barre de progression minimaliste */}
            <div className="w-full space-y-3">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-black h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>

              {/* Compteur simple - seulement le pourcentage */}
              <div className="flex items-center justify-center text-sm">
                <span className="text-gray-500">
                  {Math.round(generationProgress)}%
                </span>
              </div>
            </div>

            {/* Temps restant */}
            {estimatedTimeRemaining > 1000 && (
              <p className="text-xs text-gray-400 mt-6">
                {Math.round(estimatedTimeRemaining / 1000)}s restantes
              </p>
            )}

            {/* Message pour indiquer que c'est fermable */}
            <p className="text-xs text-gray-400 mt-6 text-center">
              Vous pouvez fermer cette fenêtre, la préparation continuera en arrière-plan
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Indicateur de progression persistant en bas */}
      <AnimatePresence>
        {backgroundUploadActive && !showProgressModal && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 z-50"
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-2xl p-4">
              <div className="flex items-start gap-3">
                {/* Animation de chargement */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 border-3 border-gray-200 rounded-full"></div>
                  <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Préparation en cours
                    </h4>
                    <button
                      onClick={() => setShowProgressModal(true)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Détails
                    </button>
                  </div>

                  {/* Barre de progression */}
                  <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden mb-2">
                    <div
                      className="bg-black h-full transition-all duration-300 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>

                  {/* Pourcentage */}
                  <p className="text-xs text-gray-500">
                    {Math.round(generationProgress)}% terminé
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal pour définir le prix du design */}
      <Dialog open={showDesignPriceModal} onOpenChange={setShowDesignPriceModal}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Configurer votre design
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Donnez un nom à votre design et définissez son prix.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Aperçu du design */}
            {tempDesignUrl && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 mx-auto sm:mx-0">
                  <img 
                    src={tempDesignUrl} 
                    alt="Aperçu design" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {tempDesignFile?.name || 'Votre design'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {tempDesignFile ? `${Math.round(tempDesignFile.size / 1024)} KB` : 'Design uploadé'}
                  </p>
                </div>
              </div>
            )}

            {/* Champ de nom du design */}
            <div className="space-y-2">
              <Label htmlFor="design-name" className="text-sm font-medium text-gray-900 dark:text-white">
                Nom du design *
              </Label>
              <Input
                id="design-name"
                type="text"
                value={designName}
                onChange={(e) => {
                  setDesignName(e.target.value);
                  setDesignNameError('');
                }}
                placeholder="Ex: Logo moderne, Motif floral..."
                className={`w-full ${designNameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-gray-900 dark:focus:border-white`}
              />
              {designNameError && (
                <p className="text-xs text-red-600">{designNameError}</p>
              )}
            </div>

            {/* Sélecteur de catégorie */}
            <div className="space-y-2">
              <Label htmlFor="design-category" className="text-sm font-medium text-gray-900 dark:text-white">
                Thème de design *
              </Label>
              <DesignCategorySelector
                value={designCategoryId}
                onChange={(categoryId) => {
                  setDesignCategoryId(categoryId);
                  setDesignCategoryError('');
                }}
                required
                className={designCategoryError ? 'border-red-500' : ''}
                placeholder="-- Choisir un thème --"
              />
              {designCategoryError && (
                <p className="text-xs text-red-600">{designCategoryError}</p>
              )}
            </div>

            {/* Champ de description (optionnel) */}
            <div className="space-y-2">
              <Label htmlFor="design-description" className="text-sm font-medium text-gray-900 dark:text-white">
                Description (optionnel)
              </Label>
              <textarea
                id="design-description"
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                placeholder="Décrivez votre design..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white resize-none text-sm"
                rows={3}
              />
            </div>

            {/* Champ de saisie du prix */}
            <div className="space-y-2">
              <Label htmlFor="design-price" className="text-sm font-medium text-gray-900 dark:text-white">
                Prix design (FCFA) *
              </Label>
              <div className="relative">
                <Input
                  id="design-price"
                  type="number"
                  step="50"
                  min="0"
                  value={designPrice || ''}
                  onChange={(e) => {
                    setDesignPrice(Number(e.target.value));
                    setDesignPriceError('');
                  }}
                  placeholder="Entrez votre prix de vente"
                  className={`w-full pr-12 ${designPriceError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-gray-900 dark:focus:border-white`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  FCFA
                </span>
              </div>
              {designPriceError && (
                <p className="text-xs text-red-600">{designPriceError}</p>
              )}
              <p className="text-xs text-gray-500">
                Minimum 0 FCFA. Revenus que vous recevrez par vente.
              </p>
            </div>

            {/* Information simple */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">"{designName || 'Votre design'}"</span> sera appliqué aux produits. 
                Vous recevrez <span className="font-medium">{designPrice || 0} FCFA</span> par vente.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDesignPrice}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDesignPrice}
              disabled={!fileIsValid}
              className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Picker Design existant */}
      <Dialog open={showDesignPicker} onOpenChange={setShowDesignPicker}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Choisir un design existant
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Sélectionnez l'un de vos designs pour l'appliquer aux produits. Les designs non validés créeront des produits en attente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingExistingDesigns ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : existingDesignsWithValidation.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Vous n'avez encore créé aucun design
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Rendez-vous dans "Mes designs" pour en créer un
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {existingDesignsWithValidation.map((design) => (
                  <div key={design.id} className="relative">
                  <button
                    onClick={() => handleSelectExistingDesign(design)}
                    className="relative group aspect-square overflow-hidden rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white focus:ring-gray-900 dark:focus:ring-white"
                    aria-label={`Sélectionner ${design.name}`}
                  >
                    {/* Image du design */}
                    <img
                      src={design.thumbnailUrl || design.imageUrl}
                      alt={design.name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    
                    {/* Overlay avec infos */}
                    <div className="absolute inset-0 transition-colors duration-200 bg-black/0 group-hover:bg-black/20" />
                    
                    {/* Badge statut de validation */}
                    <div className="absolute top-2 left-2">
                      {(design as any).isValidated === false ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded">
                          En attente
                        </span>
                      ) : (design as any).isValidated === true ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500 text-white rounded">
                          Validé ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded">
                          Nouveau
                        </span>
                      )}
                    </div>
                    
                    {/* Prix en bas */}
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white rounded backdrop-blur-sm">
                        {design.price} FCFA
                      </span>
                    </div>
                    
                    {/* Nom en bas (visible au hover) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-200 p-3 opacity-0 group-hover:opacity-100">
                      <p className="text-white text-xs font-medium truncate">
                        {design.name}
                      </p>
                      {(design as any).isValidated === false && (
                        <p className="text-yellow-300 text-xs mt-1">
                          ✨ Utilisable - Produits en attente de validation
                        </p>
                      )}
                      {(design as any).isValidated === true && (
                        <p className="text-green-300 text-xs mt-1">
                          ✅ Validé - Produits publiés immédiatement
                        </p>
                      )}
                    </div>
                  </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDesignPicker(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de prévisualisation détaillée */}
      <Dialog open={showDetailedPreview} onOpenChange={setShowDetailedPreview}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Aperçu détaillé du produit
            </DialogTitle>
            <DialogDescription>
              {previewProduct?.name} - Votre design appliqué sur toutes les couleurs sélectionnées
            </DialogDescription>
          </DialogHeader>

          {previewProduct && (
            <div className="py-4 space-y-6">
              {/* Informations du produit */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {editStates[previewProduct.id]?.name || previewProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">
                      {editStates[previewProduct.id]?.price || previewProduct.price} FCFA
                    </p>
                    {(editStates[previewProduct.id]?.description || previewProduct.description) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {editStates[previewProduct.id]?.description || previewProduct.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPreviewMode(previewMode === 'grid' ? 'single' : 'grid')}
                      variant="outline"
                      size="sm"
                    >
                      {previewMode === 'grid' ? 'Vue unique' : 'Grille'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Aperçu par couleur */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Aperçu avec votre design sur chaque couleur
                </h4>
                
                {(() => {
                  const activeColors = (productColors[previewProduct.id] || []).filter(c => c.isActive);
                  
                  if (activeColors.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Aucune couleur sélectionnée pour ce produit</p>
                      </div>
                    );
                  }

                  if (previewMode === 'single') {
                    const currentColor = activeColors[currentColorIndex];
                    
                    return (
                      <div className="space-y-4">
                        {/* Navigation entre couleurs */}
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            onClick={() => setCurrentColorIndex(Math.max(0, currentColorIndex - 1))}
                            disabled={currentColorIndex === 0}
                            variant="outline"
                            size="sm"
                          >
                            ← Précédent
                          </Button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {currentColorIndex + 1} / {activeColors.length}
                          </span>
                          <Button
                            onClick={() => setCurrentColorIndex(Math.min(activeColors.length - 1, currentColorIndex + 1))}
                            disabled={currentColorIndex === activeColors.length - 1}
                            variant="outline"
                            size="sm"
                          >
                            Suivant →
                          </Button>
                        </div>
                        
                        {/* Vue unique grande */}
                        <div className="flex justify-center">
                          <div className="w-80 h-80">
                            <ColorPreview product={previewProduct} color={activeColors[currentColorIndex]} />
                          </div>
                        </div>
                        
                        {/* Sélecteur de couleur */}
                        <div className="flex justify-center gap-2">
                          {activeColors.map((color, index) => (
                            <button
                              key={color.id}
                              onClick={() => setCurrentColorIndex(index)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                index === currentColorIndex 
                                  ? 'border-gray-900 dark:border-white scale-110' 
                                  : 'border-gray-300 hover:border-gray-500'
                              }`}
                              style={{ backgroundColor: color.colorCode }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // Mode grille
                  return (
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6">
                      {activeColors.map(color => (
                        <ColorPreview key={color.id} product={previewProduct} color={color} />
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Information sur le design */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Architecture "Produit Admin + Design Positionné"
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Votre design est appliqué directement sur l'image du produit admin selon vos délimitations. 
                      Aucun mockup fusionné n'est généré - nous gardons la flexibilité de repositionnement.
                    </p>
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      <strong>Design :</strong> {designName || designFile?.name || 'Design personnalisé'} 
                      {designPrice > 0 && ` • Revenus: ${designPrice} FCFA par vente`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailedPreview(false)}
            >
              Fermer l'aperçu
            </Button>
            <Button
              onClick={() => {
                setShowDetailedPreview(false);
                // Optionnel : revenir à la modal de confirmation
                // setCheckoutOpen(true);
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Valider ce rendu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🆕 Modal de génération d'images multi-produits */}
      <MultiProductImagesModal
        productIds={createdProductIds}
        isOpen={showImagesModal}
        onClose={() => {
          setShowImagesModal(false);
          setCreatedProductIds([]);
        }}
        onComplete={(results) => {
          console.log('✅ Génération terminée pour tous les produits!', results);
          setShowImagesModal(false);
          setCreatedProductIds([]);

          // Rediriger vers la liste des produits
          setTimeout(() => {
            navigate('/vendeur/products');
          }, 500);
        }}
        onError={(error) => {
          console.error('❌ Erreur génération images:', error);
          toast({
            title: 'Erreur de génération',
            description: error,
            variant: 'destructive',
            duration: 5000
          });
        }}
        autoCloseDelay={2000}
      />
    </div>
  );
};

export default SellDesignPage; 
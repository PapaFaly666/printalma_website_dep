import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../services/productService';
import { Loader2, Upload, Image as ImageIcon, CloudUpload, Rocket, Store, Check, Save, Info, Ruler, Palette, X, Package, DollarSign, Edit3, Move, RotateCw, Calculator, ChevronDown, ChevronUp, TrendingUp, Percent, RotateCcw, Zap, Target, Sparkles, ArrowRight, Eye, BarChart3, PiggyBank, Coins } from 'lucide-react';
import designService, { Design } from '../services/designService';
import { useAuth } from '../contexts/AuthContext';
import { useVendorPublish } from '../hooks/useVendorPublish';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
// ✅ CORRIGÉ : Retour à useDesignTransforms mais sans création automatique
import { useDesignTransforms } from '../hooks/useDesignTransforms';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from '../components/ui/sheet';
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

// 🆕 Imports pour cascade validation
import { PostValidationActionSelectorIntegrated } from '../components/cascade/PostValidationActionSelectorIntegrated';
import { useCascadeValidationIntegrated } from '../hooks/useCascadeValidationIntegrated';
import { PostValidationAction } from '../types/cascadeValidation';

// 🆕 Import du nouveau composant Canvas
// import ProductViewWithDesign from '../components/design/ProductViewWithDesign'; // Conflit avec le composant local

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
interface SimpleTransform {
  x: number;
  y: number;
  // 🆕 Ajout des propriétés de design
  designWidth?: number;
  designHeight?: number;
  designScale?: number;
  // 🆕 Ajout de la rotation
  rotation?: number; // En degrés
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
    
    // Déplacement fluide
    const newX = initialTransform.x + deltaX;
    const newY = initialTransform.y + deltaY;
    
    // Contraintes pour garder le design dans la délimitation avec nouveau système de ratio
    const delim = delimitations[selectedIdx];
    const pos = computePxPosition(delim);
    
    // 🎯 SYSTÈME DE RATIO CONSTANT : utiliser le même système que dans l'affichage
    const designScale = initialTransform.designScale || 0.9;
    const designWidth = pos.width * designScale;
    const designHeight = pos.height * designScale;
    
    const maxX = (pos.width - designWidth) / 2;
    const minX = -(pos.width - designWidth) / 2;
    const maxY = (pos.height - designHeight) / 2;
    const minY = -(pos.height - designHeight) / 2;
    
    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));

    // Mise à jour temps réel
    updateTransform(selectedIdx, {
      ...initialTransform,
      x: constrainedX,
      y: constrainedY
    });
  }, [isDragging, dragStart, initialTransform, selectedIdx, delimitations, updateTransform]);

  const handleMouseUp = useCallback(() => {
    // 🔧 Annuler toute animation en cours pour un nettoyage propre
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
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
  }, []);

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
        const designScale = (initialTransform.designScale || 0.8);
        const designWidth = pos.width * designScale;
        const designHeight = pos.height * designScale;
        const maxX = (pos.width - designWidth) / 2;
        const minX = -(pos.width - designWidth) / 2;
        const maxY = (pos.height - designHeight) / 2;
        const minY = -(pos.height - designHeight) / 2;
        const constrainedX = Math.max(minX, Math.min(maxX, initialTransform.x + deltaX));
        const constrainedY = Math.max(minY, Math.min(maxY, initialTransform.y + deltaY));
        updateTransform(selectedIdx, { ...initialTransform, x: constrainedX, y: constrainedY });
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
    
    // Contraintes rapides pour la délimitation
    const delim = delimitations[selectedIdx];
    const pos = computePxPosition(delim);
    
    // Calcul direct de la nouvelle échelle
    let newScale = Math.min(newDisplayWidth / pos.width, newDisplayHeight / pos.height);
    
    // Contrainte maximale pour rester dans la délimitation
    if (newScale > 1) newScale = 1;
    if (newScale < 0.1) newScale = 0.1; // Minimum de 10%
    
    // Mise à jour immédiate pour la fluidité
    updateTransform(selectedIdx, {
      ...initialTransform,
      designScale: newScale
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
          
          // 🎯 SYSTÈME DE RATIO CONSTANT : Le design utilise toujours le même pourcentage de la délimitation
          // Comme "le produit et l'image sont fusionnés", le design garde sa proportion constante
          const designScale = t.designScale || 0.8; // Ratio constant : 80% de la délimitation par défaut
          const designWidth = pos.width * designScale;
          const designHeight = pos.height * designScale;
          
          const maxX = (pos.width - designWidth) / 2;
          const minX = -(pos.width - designWidth) / 2;
          const maxY = (pos.height - designHeight) / 2;
          const minY = -(pos.height - designHeight) / 2;
          
          const x = Math.max(minX, Math.min(t.x, maxX));
          const y = Math.max(minY, Math.min(t.y, maxY));
          
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
              <div
                className={`modern-design absolute ${isSelected ? 'selected' : ''} ${isDragging && selectedIdx === idx ? 'dragging' : ''}`}
                onMouseDown={e => handleDesignMouseDown(e, idx)}
                onTouchStart={e => handleDesignTouchStart(e, idx)}
                style={{
                  left: '50%',
                  top: '50%',
                  width: designWidth,
                  height: designHeight,
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
                <img
                  src={designUrl}
                  alt="Design"
                  className="object-contain pointer-events-none select-none"
                    style={{ 
                    width: '100%',
                    height: '100%',
                    transform: `scale(1)`,
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
                        updateTransform(selectedIdx, {
                          ...currentTransform,
                          designScale: newScale  // 🎯 Sauvegarder le ratio par rapport à la délimitation
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
                        updateTransform(selectedIdx, {
                          ...currentTransform,
                          designScale: newScale  // 🎯 Sauvegarder le ratio par rapport à la délimitation
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
                        updateTransform(selectedIdx, {
                          ...currentTransform,
                          designScale: newScale  // 🎯 Sauvegarder le nouveau ratio directement
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

    updateTransform(delimIdx, { x: origX + dx, y: origY + dy });
  }, [updateTransform]);

  const handleMouseUp = useCallback(() => {
    // 🔧 Annuler toute animation en cours pour un nettoyage propre
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Reset interaction states - ARRÊT IMMÉDIAT comme dans Illustrator
    dragState.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

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
    { id: 3, title: 'Catégories et tailles', icon: Store },
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
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Catégories et tailles</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cette étape sera développée prochainement. Votre produit sera classé dans une catégorie par défaut.
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
  const [priceErrors, setPriceErrors] = useState<Record<number, string>>({});
  const [expandedPricingIds, setExpandedPricingIds] = useState<Record<number, boolean>>({});
  const [customProfits, setCustomProfits] = useState<Record<number, number>>({});
  const [editingProfitIds, setEditingProfitIds] = useState<Record<number, boolean>>({});
  const ALL_COLORS = 'ALL';
  const [filterColorName, setFilterColorName] = useState<string>(ALL_COLORS);
  
  // Nouvel état pour stocker les prix de base (admin) - ne change jamais côté vendeur
  const [basePrices, setBasePrices] = useState<Record<number, number>>({});

  // Nouvel état pour gérer le mode sélectionné
  const [selectedMode, setSelectedMode] = useState<'design' | 'product' | null>(null);

  // Nouveaux états pour gérer le prix du design
  const [showDesignPriceModal, setShowDesignPriceModal] = useState(false);
  const [designPrice, setDesignPrice] = useState<number>(0);
  const [designName, setDesignName] = useState<string>('');
  const [designDescription, setDesignDescription] = useState<string>('');
  const [tempDesignFile, setTempDesignFile] = useState<File | null>(null);
  const [tempDesignUrl, setTempDesignUrl] = useState<string>('');
  const [designPriceError, setDesignPriceError] = useState<string>('');
  const [designNameError, setDesignNameError] = useState<string>('');

  // Designs existants du vendeur
  const [loadingExistingDesigns, setLoadingExistingDesigns] = useState(false);
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  
  // 🆕 États pour la commission du vendeur
  const [vendorCommission, setVendorCommission] = useState<number | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);

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

  // Hook de publication vendeur avec gestion intégrée
  const { publishProducts, isPublishing, publishProgress, currentStep } = useVendorPublish({
    onSuccess: (results) => {
      console.log('🎉 Publication réussie:', results);
      setCheckoutOpen(false); // Fermer la modal
      
      // Optionnel: réinitialiser pour une nouvelle session
      // setSelectedProductIds([]);
      // setDesignUrl('');
      // setDesignFile(null);
    },
    onError: (error) => {
      console.error('❌ Erreur publication:', error);
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
      const response = await fetch('https://printalma-back-dep.onrender.com/products?forVendorDesign=true&limit=50');
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
        // Le prix de base est le prix original du produit (défini par l'admin)
        // On utilise soit basePrice s'il existe, soit price comme fallback
        initialBasePrices[product.id] = (product as any).basePrice || product.price;
      });
      setBasePrices(initialBasePrices);
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
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner un fichier image (PNG, JPG, SVG).",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    // Traitement simplifié sans recadrage automatique (temporaire)
    setTempDesignFile(file);
    const objectUrl = URL.createObjectURL(file);
    setTempDesignUrl(objectUrl);
    setCropInfo(null); // Pas de recadrage pour le moment
    
    toast({
      title: "📁 Design importé",
      description: "Votre design a été importé avec ses dimensions originales.",
      variant: "success",
      duration: 3000,
    });
    
    // Ouvrir le modal pour demander les informations du design
    setDesignPrice(0);
    setDesignName(file.name.replace(/\.[^/.]+$/, "")); // Nom du fichier sans extension
    setDesignDescription('');
    setDesignPriceError('');
    setDesignNameError('');
    setShowDesignPriceModal(true);
  };

  // Nouvelle fonction pour confirmer le prix et charger les produits
  const handleConfirmDesignPrice = async () => {
    // Reset des erreurs
    setDesignPriceError('');
    setDesignNameError('');

    // Validation du nom
    if (!designName.trim()) {
      setDesignNameError('Veuillez entrer un nom pour votre design');
      return;
    }

    if (designName.trim().length < 3) {
      setDesignNameError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    // Validation du prix
    if (!designPrice || designPrice <= 0) {
      setDesignPriceError('Veuillez entrer un prix valide pour votre design');
      return;
    }

    if (designPrice < 100) {
      setDesignPriceError('Le prix minimum pour un design est de 100 FCFA');
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
          category: 'logo' // Catégorie par défaut ; pourra être éditée ensuite dans /vendeur/designs
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

    // Validation du prix : le vendeur ne peut pas fixer un prix inférieur au prix de base de l'admin
    if (updates.price !== undefined) {
      const basePrice = basePrices[id] || product.price;
      if (updates.price < basePrice) {
        const msg = `Le prix doit être supérieur ou égal à ${basePrice} FCFA (prix de base)`;
        // Afficher toast
        toast({
          title: "Prix invalide",
          description: msg,
          variant: "destructive",
          duration: 4000,
        });
        // Mettre un message d'erreur inline
        setPriceErrors(prev => ({ ...prev, [id]: msg }));
        // Réinitialiser le champ avec le prix actuel (pas le prix de base)
        setEditStates(prev => ({ ...prev, [id]: { ...prev[id], price: product.price } }));
        return;
      } else {
        // Clear error if any
        if (priceErrors[id]) {
          setPriceErrors(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        }
      }
    }

    (['name', 'price', 'stock', 'description'] as (keyof Product)[]).forEach((field) => {
      if (updates[field] !== undefined && updates[field] !== product[field]) {
        (payload as any)[field] = updates[field];
      }
    });
    if (Object.keys(payload).length === 0) return;
    setSavingProductIds((prev) => [...prev, id]);

    try {
      // Pas d'appel API pour l'instant – on conserve la modification localement.
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...payload } : p));
      setSavedProductIds((prev) => [...prev, id]);
      setTimeout(() => setSavedProductIds((prev) => prev.filter((pid) => pid !== id)), 1200);
      setEditStates((prev) => ({ ...prev, [id]: {} }));

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

  const handleSavePricing = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const basePrice = basePrices[productId] || product.price;
    const customProfit = customProfits[productId] || 0;
    const newPrice = basePrice + customProfit;

    handleFieldChange(productId, 'price', newPrice);
    handleSave(productId);
    setEditingProfitIds(prev => ({ ...prev, [productId]: false }));
  };

  const handleResetPricing = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const basePrice = basePrices[productId] || product.price;
    setCustomProfits(prev => ({
      ...prev,
      [productId]: product.price - basePrice
    }));
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

  // Initialiser les profits personnalisés au chargement des produits
  useEffect(() => {
    if (products.length > 0) {
      const initialProfits: Record<number, number> = {};
      products.forEach(product => {
        const basePrice = basePrices[product.id] || product.price;
        initialProfits[product.id] = Math.max(0, product.price - basePrice);
      });
      setCustomProfits(initialProfits);
    }
  }, [products, basePrices]);

  // Initialiser la couleur sélectionnée (première couleur active ou première variation)
  useEffect(() => {
    const initialSel: Record<number, number> = {};
    products.forEach((product) => {
      if (!selectedColorIds[product.id]) {
        const activeColors = (productColors[product.id] || []).filter(c => c.isActive);
        if (activeColors.length > 0) {
          initialSel[product.id] = activeColors[0].id;
        } else if (product.colorVariations && product.colorVariations.length > 0) {
          initialSel[product.id] = product.colorVariations[0].id;
        }
      }
    });
    if (Object.keys(initialSel).length > 0) {
      setSelectedColorIds(prev => ({ ...prev, ...initialSel }));
    }
  }, [products, productColors]);

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

      console.log('💾 Sauvegarde en brouillon avec:', {
        forcedStatus,
        postValidationAction: PostValidationAction.TO_DRAFT,
        designValidationStatus: validationStatus
      });

      const results = await publishProducts(
        selectedProductIds,
        products,
        productColors,
        productSizes,
        editStates,
        basePrices,
        {
          designUrl,
          designFile,
          ...(selectedDesign?.id && { designId: Number(selectedDesign.id) }),
          designName: designName || selectedDesign?.name,
          designPrice: designPrice || selectedDesign?.price,
          // 🆕 Ajouter l'action post-validation
          postValidationAction: PostValidationAction.TO_DRAFT
        },
        getPreviewView,
        forcedStatus
      );

      const successful = (results || []).filter(r => r.success);
      
      toast({
        title: `${successful.length} produit(s) créé(s) en brouillon !`,
        description: validationStatus.isValidated
          ? 'Vos produits restent en brouillon. Vous pourrez les publier manuellement à tout moment.'
          : 'Vos produits resteront en brouillon même après validation du design. Vous devrez les publier manuellement.',
        variant: 'success',
        duration: 8000
      });

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

  const handlePublishProducts = async () => {
    try {
      // 🆕 NOUVEAU WORKFLOW : Pas de blocage, création directe avec statut approprié
      const selectedDesign = existingDesignsWithValidation.find(d => d.imageUrl === designUrl || d.thumbnailUrl === designUrl);
      const validationStatus = await checkDesignValidationStatus(selectedDesign?.id as number);

      setDesignValidationStatus(validationStatus);

      // 🚀 Détermination du statut initial forcé selon la validation du design
      const forcedStatus: 'PENDING' = 'PENDING';

      console.log('🚀 Publication avec:', {
        forcedStatus,
        postValidationAction,
        designValidationStatus: validationStatus
      });

      const results = await publishProducts(
        selectedProductIds,
        products,
        productColors,
        productSizes,
        editStates,
        basePrices,
        { 
          designUrl, 
          designFile,
          ...(selectedDesign?.id && { designId: Number(selectedDesign.id) }),
          designName: designName || selectedDesign?.name,
          designPrice: designPrice || selectedDesign?.price,
          // 🆕 Ajouter l'action post-validation sélectionnée
          postValidationAction
        },
        getPreviewView,
        forcedStatus
      );

      const successful = (results || []).filter(r => r.success);
      
      if (validationStatus.needsValidation) {
        // Design non validé - les produits seront en PENDING automatiquement
        const actionText = postValidationAction === PostValidationAction.AUTO_PUBLISH 
          ? 'automatiquement publiés' 
          : 'mis en brouillon';
        toast({
          title: `${successful.length} produit(s) créé(s) avec succès !`,
          description: `Vos produits sont en attente de validation. Dès que l'admin validera votre design, ils seront ${actionText}.`,
          variant: 'default',
          duration: 8000
        });
      } else {
        // Design validé - publication directe en PUBLISHED
        toast({
          title: `${successful.length} produit(s) publié(s) avec succès !`,
          description: `Votre design est validé, vos produits sont directement disponibles à la vente.`,
          variant: 'success',
          duration: 6000
        });
      }

      // Toujours rediriger vers la liste des produits pour voir le résultat
      setTimeout(() => {
        navigate('/vendeur/products');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
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

        {/* 🆕 Bannière de commission vendeur */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Votre commission vendeur
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Taux de commission défini par l'administration
                  </p>
                </div>
              </div>
              <div className="text-right">
                {commissionLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">Chargement...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                      {vendorCommission || 40}%
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      de commission
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Info supplémentaire */}
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  PrintAlma prélève <strong>{vendorCommission || 40}%</strong> sur chaque vente pour couvrir les frais de plateforme, payment et marketing. 
                  Vous recevez <strong>{100 - (vendorCommission || 40)}%</strong> du prix de vente final.
                </p>
              </div>
            </div>
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
                onClick={() => setSelectedMode('product')}
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
                        accept="image/*"
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
                          PNG, JPG, SVG • Max 10 Mo
                        </p>
                      </div>
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

            {/* Filtre couleur moderne */}
            {designUrl && colorFilterOptions.length > 1 && (
              <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-black dark:text-white">Filtrer par couleur</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {colorFilterOptions.length} couleurs disponibles
                    </span>
                  </div>
                  <Select value={filterColorName} onValueChange={setFilterColorName}>
                    <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 rounded-xl">
                      <SelectValue placeholder="Toutes les couleurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_COLORS}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" />
                          Toutes les couleurs
                        </div>
                      </SelectItem>
                      {colorFilterOptions.map((opt) => (
                        <SelectItem key={opt.name} value={opt.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: opt.colorCode }} 
                            />
                            {opt.name}
                            <span className="text-xs text-gray-500">({opt.count})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

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
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                      >
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
                                : 'bg-white dark:bg-black border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'
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
                          
                          {/* Système de pricing moderne et responsive */}
                          <div className="space-y-3">
                            {(() => {
                              const basePrice = basePrices[product.id] || product.price;
                              const customProfit = customProfits[product.id] || 0;
                              const currentPrice = basePrice + customProfit;
                              const profitPercentage = basePrice ? ((customProfit / basePrice) * 100).toFixed(1) : '0';
                              const isExpanded = expandedPricingIds[product.id];
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
                                      {/* Header avec prix principal */}
                                      <div className="p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                                                Prix de vente
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
                                            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                              {new Intl.NumberFormat('fr-FR', {
                                                style: 'currency',
                                                currency: 'XOF',
                                                maximumFractionDigits: 0
                                              }).format(currentPrice)}
                                            </div>
                                            
                                            {/* Indicateur de bénéfice compact mobile */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                                <PiggyBank className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                                  +{new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'XOF',
                                                    maximumFractionDigits: 0
                                                  }).format(customProfit)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                                <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                                  {profitPercentage}%
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Bouton simple flèche */}
                                          <button
                                            onClick={() => togglePricingExpansion(product.id)}
                                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                          >
                                            <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${
                                              isExpanded ? 'rotate-180' : ''
                                            }`} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Panel expansible avec design moderne */}
                                      <AnimatePresence mode="wait">
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ 
                                              height: { duration: 0.4, ease: "easeInOut" },
                                              opacity: { duration: 0.3, delay: 0.1 }
                                            }}
                                            className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"
                                          >
                                            <div className="p-4 sm:p-5 space-y-5">
                                              {/* Header avec micro-animations */}
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <motion.div
                                                    initial={{ rotate: 0 }}
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                                  >
                                                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                  </motion.div>
                                                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                                    Calculateur intelligent
                                                  </h4>
                                                </div>
                                                
                                                {isEditing && (
                                                  <motion.div
                                                    initial={{ x: 20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    className="flex gap-2"
                                                  >
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleResetPricing(product.id)}
                                                      className="h-8 px-3 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                      <RotateCcw className="h-3 w-3 mr-1" />
                                                      Reset
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => handleSavePricing(product.id)}
                                                      className="h-8 px-3 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
                                                    >
                                                      <Save className="h-3 w-3 mr-1" />
                                                      Sauver
                                                    </Button>
                                                  </motion.div>
                                                )}
                                              </div>

                                              {/* Interface de calcul responsive */}
                                              <div className="space-y-4">
                                                {/* Prix de revient - Design épuré */}
                                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                                                  <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Prix de revient
                                                      </label>
                                                    </div>
                                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500 dark:text-gray-400">
                                                      Fixe
                                                    </span>
                                                  </div>
                                                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                                                    {new Intl.NumberFormat('fr-FR', {
                                                      style: 'currency',
                                                      currency: 'XOF',
                                                      maximumFractionDigits: 0
                                                    }).format(basePrice)}
                                                  </div>
                                                </div>

                                                {/* Interface de bénéfice - Interactive et moderne */}
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
                                                  <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                      <motion.div
                                                        animate={{ scale: isEditing ? 1.2 : 1 }}
                                                        className="w-2 h-2 rounded-full bg-green-500"
                                                      />
                                                      <label className="text-sm font-medium text-green-700 dark:text-green-300">
                                                        Votre bénéfice
                                                      </label>
                                                    </div>
                                                    <span className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full text-green-600 dark:text-green-300">
                                                      Ajustable
                                                    </span>
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                      <div className="relative">
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          step="500"
                                                          value={customProfit}
                                                          onChange={(e) => handleProfitChange(product.id, Number(e.target.value))}
                                                          onFocus={() => setEditingProfitIds(prev => ({ ...prev, [product.id]: true }))}
                                                          className="w-full px-4 py-3 text-lg font-bold bg-white dark:bg-gray-800 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                          placeholder="0"
                                                        />
                                                        <div className="absolute inset-y-0 right-3 flex items-center">
                                                          <Coins className="h-4 w-4 text-green-500" />
                                                        </div>
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Boutons rapides pour ajustement */}
                                                    <div className="flex flex-col gap-1">
                                                      <button
                                                        onClick={() => handleProfitChange(product.id, customProfit + 500)}
                                                        className="w-8 h-6 rounded bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700 transition-colors flex items-center justify-center"
                                                      >
                                                        <ChevronUp className="h-3 w-3 text-green-600 dark:text-green-300" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleProfitChange(product.id, Math.max(0, customProfit - 500))}
                                                        className="w-8 h-6 rounded bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700 transition-colors flex items-center justify-center"
                                                      >
                                                        <ChevronDown className="h-3 w-3 text-green-600 dark:text-green-300" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Prix de vente simplifié */}
                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                  <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                      Prix de vente
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                      {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'XOF',
                                                        maximumFractionDigits: 0
                                                      }).format(currentPrice)}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* 💰 Cards noir et blanc */}
                                                <div className="space-y-2">
                                                  {/* Commission & Gains - Noir et blanc */}
                                                  <div className="grid grid-cols-2 gap-2">
                                                    {/* Commission */}
                                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                      <div className="flex items-center gap-2 mb-1">
                                                        <Coins className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                          Commission
                                                        </span>
                                                      </div>
                                                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        {commissionLoading ? (
                                                          <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                                                        ) : (
                                                          `${vendorCommission || 40}%`
                                                        )}
                                                      </div>
                                                    </div>

                                                    {/* Gains */}
                                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                      <div className="flex items-center gap-2 mb-1">
                                                        <PiggyBank className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                          Vos gains
                                                        </span>
                                                      </div>
                                                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        {100 - (vendorCommission || 40)}%
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Montants - Noir et blanc */}
                                                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                    <div className="flex justify-between items-center text-xs">
                                                      <span className="text-gray-600 dark:text-gray-400">Commission:</span>
                                                      <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {commissionService.formatCFA(
                                                          (currentPrice * (vendorCommission || 40)) / 100
                                                        )}
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs mt-1">
                                                      <span className="text-gray-600 dark:text-gray-400">Vos revenus:</span>
                                                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {commissionLoading ? '...' : (() => {
                                                          const commission = vendorCommission || 40;
                                                          const platformFee = (currentPrice * commission) / 100;
                                                          const vendorRevenue = currentPrice - platformFee;
                                                          return commissionService.formatCFA(vendorRevenue);
                                                        })()}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
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
                                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                                    >
                                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <X className="h-4 w-4" />
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
                                    const activeColorsCount = (productColors[product.id] || []).filter(c => c.isActive).length;
                                    const canDeactivate = !(activeColorsCount === 1 && color.isActive);
                                  
                                  return (
                                      <div key={color.id} className="text-center">
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
                                        
                                        <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                                          {color.name}
                                        </span>
                                        
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

                            {/* Tailles */}
                            {(productSizes[product.id] || []).length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-black dark:text-white block mb-3">
                                  Tailles
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {(productSizes[product.id] || []).map((size) => (
                                    <button
                                      key={size.id}
                                      onClick={() => handleSizeToggle(product.id, size.id)}
                                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                                        size.isActive
                                          ? 'bg-black dark:bg-white text-white dark:text-black'
                                          : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      {size.sizeName}
                                    </button>
                                  ))}
                          </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* CTA de publication */}
                {selectedProductIds.length > 0 && (
                  <div className="text-center pt-8">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedProductIds.length} produit{selectedProductIds.length > 1 ? 's' : ''} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
                      </p>
                      <Button
                        onClick={() => setCheckoutOpen(true)}
                        size="lg"
                        className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded"
                      >
                        Prévisualiser et publier
                      </Button>
                    </div>
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
      
      {/* Toaster pour les notifications */}
      <Toaster 
        position="top-right"
        expand={true}
        richColors
        closeButton
      />

      {/* Modal de prévisualisation avant publication */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Confirmer la publication
            </SheetTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vérifiez vos produits avant de les publier sur la plateforme
            </p>
          </SheetHeader>

          {/* Barre de progression lors de la publication */}
          {isPublishing && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{currentStep || 'Préparation...'}</span>
                <span className="font-medium">{publishProgress}%</span>
              </div>
              <Progress value={publishProgress} className="w-full" />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Veuillez patienter, traitement en cours...
              </p>
            </div>
          )}
                    
          <div className="mt-6 space-y-6">
            {/* Résumé de la sélection */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedProductIds.length} produit{selectedProductIds.length > 1 ? 's' : ''} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Votre design sera appliqué sur ces produits et mis en vente
                  </p>
                </div>
              </div>
            </div>

            {/* Aperçu du design */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Votre design</h3>
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={designUrl} 
                    alt="Votre design" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {designName || designFile?.name || 'Design personnalisé'}
                  </h4>
                  {designDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {designDescription}
                    </p>
                  )}
                  {designPrice > 0 && (
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mt-1">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>Commission: {designPrice} FCFA par vente</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Liste des produits sélectionnés */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Produits à publier</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
                {selectedProductIds.map((idStr) => {
                  const product = products.find(p => p.id === Number(idStr));
                  if (!product) return null;

                  const activeColors = (productColors[product.id] || []).filter(c => c.isActive);
                  const activeSizes = (productSizes[product.id] || []).filter(s => s.isActive);
                                const view = getPreviewView(product);

                  return (
                    <div key={product.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex gap-3">
                        {/* Miniature cliquable */}
                        <button
                          onClick={() => openDetailedPreview(product)}
                          className="w-16 h-16 rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex-shrink-0 hover:border-blue-400 transition-colors relative group"
                        >
                          {view ? (
                            <ProductViewWithDesign 
                              view={view} 
                              designUrl={designUrl} 
                              productId={getVendorProductId(product) ?? 0} 
                              products={products} 
                              vendorDesigns={existingDesignsWithValidation}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          {/* Overlay d'aperçu */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Aperçu</span>
                          </div>
                        </button>
                            
                        {/* Détails */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {editStates[product.id]?.name || product.name}
                              </h4>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {editStates[product.id]?.price || product.price} FCFA
                              </p>
                            </div>
                            {/* Bouton aperçu détaillé */}
                            <Button
                              onClick={() => openDetailedPreview(product)}
                              variant="outline"
                              size="sm"
                              className="ml-2 h-7 px-2 text-xs"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Aperçu
                            </Button>
                          </div>
                          
                          {/* Description */}
                          {(editStates[product.id]?.description || product.description) && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {editStates[product.id]?.description || product.description}
                            </p>
                          )}

                          {/* Couleurs actives */}
                          {activeColors.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-xs text-gray-500">Couleurs:</span>
                              <div className="flex gap-1">
                                {activeColors.slice(0, 4).map(color => (
                                  <div
                                    key={color.id}
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color.colorCode }}
                                    title={color.name}
                                  />
                                ))}
                                {activeColors.length > 4 && (
                                  <span className="text-xs text-gray-500">+{activeColors.length - 4}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tailles actives */}
                          {activeSizes.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-gray-500">Tailles:</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {activeSizes.map(s => s.sizeName).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                        </div>
            </div>
                    </div>

          <SheetFooter className="mt-6 flex flex-col gap-3">
            <SheetClose asChild>
              <Button variant="outline" className="w-full" disabled={isPublishing}>
                Modifier la sélection
              </Button>
            </SheetClose>
            
            {/* 🆕 Sélecteur d'action post-validation */}
            <div className="mb-4">
              <PostValidationActionSelectorIntegrated
                currentAction={postValidationAction}
                onActionChange={setPostValidationAction}
                disabled={isPublishing}
              />
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
              <Button
                onClick={handleSaveAsDraft}
                disabled={isPublishing}
                variant="outline"
                className="flex-1"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Mettre en brouillon
                  </>
                )}
              </Button>
              
              <Button
                onClick={handlePublishProducts}
                disabled={isPublishing}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {currentStep || 'Publication en cours...'}
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    {designValidationStatus.isValidated 
                      ? 'Publier directement' 
                      : 'Créer en attente'
                    }
                  </>
                )}
              </Button>
            </div>
            
            {/* 🆕 Textes explicatifs mis à jour */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
              <div className="text-center">
                <p>Créer en brouillon pour publication manuelle plus tard</p>
              </div>
              <div className="text-center">
                <p>
                  {designValidationStatus.isValidated 
                    ? 'Publication immédiate (design validé)' 
                    : postValidationAction === PostValidationAction.AUTO_PUBLISH
                      ? 'Publication automatique après validation'
                      : 'Mise en brouillon après validation'
                  }
                </p>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
                Prix de vente (FCFA) *
              </Label>
              <div className="relative">
                <Input
                  id="design-price"
                  type="number"
                  min="100"
                  step="50"
                  value={designPrice || ''}
                  onChange={(e) => {
                    setDesignPrice(Number(e.target.value));
                    setDesignPriceError('');
                  }}
                  placeholder="Prix minimum: 100"
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
                Minimum 100 FCFA. Commission par vente.
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
              className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
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
                      {designPrice > 0 && ` • Commission: ${designPrice} FCFA par vente`}
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
    </div>
  );
};

export default SellDesignPage; 
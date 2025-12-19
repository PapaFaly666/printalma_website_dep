/**
 * Utilitaire partagé pour le positionnement responsif des designs
 * Utilisé par CartSidebar, SimpleProductPreview et d'autres composants
 */

export interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType?: 'PIXEL' | 'PERCENTAGE';
  imageUrl?: string;
  viewType?: string;
}

export interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayWidth?: number;
  displayHeight?: number;
}

export interface ContainerDimensions {
  width: number;
  height: number;
}

export interface DesignPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  designWidth?: number;
  designHeight?: number;
}

/**
 * Calcule la position en pixels d'une délimitation de manière responsive
 */
export const computeResponsivePosition = (
  delimitation: DelimitationData,
  containerDimensions: ContainerDimensions,
  imageMetrics: ImageMetrics,
  imageObjectFit: 'contain' | 'cover' = 'contain'
) => {
  // Détection automatique du type de coordonnées
  const isPixel = delimitation.coordinateType === 'PIXEL' || delimitation.x > 100 || delimitation.y > 100;

  const imgW = imageMetrics.originalWidth || 1200;
  const imgH = imageMetrics.originalHeight || 1200;

  // Conversion en pourcentage si nécessaire
  const pct = {
    x: isPixel ? (delimitation.x / imgW) * 100 : delimitation.x,
    y: isPixel ? (delimitation.y / imgH) * 100 : delimitation.y,
    w: isPixel ? (delimitation.width / imgW) * 100 : delimitation.width,
    h: isPixel ? (delimitation.height / imgH) * 100 : delimitation.height,
  };

  const { width: contW, height: contH } = containerDimensions;
  if (contW === 0 || contH === 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  // Calcul responsive selon imageObjectFit
  const imgRatio = imgW / imgH;
  const contRatio = contW / contH;

  let dispW: number, dispH: number, offsetX: number, offsetY: number;

  if (imageObjectFit === 'contain') {
    // Logique pour contain (maintient le ratio)
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
  } else {
    // Logique pour cover (couvre tout le conteneur)
    if (imgRatio > contRatio) {
      dispH = contH;
      dispW = contH * imgRatio;
      offsetX = (contW - dispW) / 2;
      offsetY = 0;
    } else {
      dispW = contW;
      dispH = contW / imgRatio;
      offsetX = 0;
      offsetY = (contH - dispH) / 2;
    }
  }

  return {
    left: offsetX + (pct.x / 100) * dispW,
    top: offsetY + (pct.y / 100) * dispH,
    width: (pct.w / 100) * dispW,
    height: (pct.h / 100) * dispH,
  };
};

/**
 * Calcule les dimensions et position du design dans une délimitation
 */
export const computeDesignTransform = (
  designPosition: DesignPosition,
  delimitationRect: { left: number; top: number; width: number; height: number },
  containerDimensions: ContainerDimensions
) => {
  const { x, y, scale = 0.8, rotation = 0, designWidth, designHeight } = designPosition;

  // Utiliser la taille du design si disponible, sinon un pourcentage de la délimitation
  const actualDesignWidth = designWidth || delimitationRect.width * scale;
  const actualDesignHeight = designHeight || delimitationRect.height * scale;

  // Contraintes de positionnement pour garder le design dans la délimitation
  const maxX = (delimitationRect.width - actualDesignWidth) / 2;
  const minX = -(delimitationRect.width - actualDesignWidth) / 2;
  const maxY = (delimitationRect.height - actualDesignHeight) / 2;
  const minY = -(delimitationRect.height - actualDesignHeight) / 2;

  const adjustedX = Math.max(minX, Math.min(x, maxX));
  const adjustedY = Math.max(minY, Math.min(y, maxY));

  return {
    width: actualDesignWidth,
    height: actualDesignHeight,
    transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation}deg)`,
  };
};

/**
 * Génère les styles CSS pour un élément de design dans une délimitation
 *
 * IMPORTANT: Les éléments utilisent un système de coordonnées mixte:
 * - x, y: Position en POURCENTAGE (0-1) relatif à la délimitation
 * - width, height: Dimensions en PIXELS basées sur le canvas d'édition original
 *
 * Cette fonction redimensionne automatiquement les éléments pour s'adapter
 * à la taille actuelle de la délimitation (responsive)
 */
export const createDesignElementStyles = (
  element: any,
  delimitationRect: { left: number; top: number; width: number; height: number },
  referenceDelimitationWidth: number = 800  // Largeur de référence du canvas d'édition
) => {
  const { x = 0.5, y = 0.5, width = 100, height = 100, rotation = 0 } = element;

  // 🔧 Calculer le ratio de scale entre la délimitation actuelle et la référence
  // Cela permet d'adapter les dimensions des éléments de manière responsive
  const scaleRatio = delimitationRect.width / referenceDelimitationWidth;

  // Appliquer le ratio aux dimensions de l'élément (qui sont en pixels)
  const elementWidth = width * scaleRatio;
  const elementHeight = height * scaleRatio;

  // Convertir les positions de pourcentage (0-1) en pixels
  // x et y sont des positions centrées (0.5 = centre de la délimitation)
  const left = x * delimitationRect.width;
  const top = y * delimitationRect.height;

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${elementWidth}px`,
    height: `${elementHeight}px`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    zIndex: element.zIndex || 1,
  };
};
/**
 * Utilitaires de positionnement unifiés pour garantir la cohérence
 * entre l'éditeur de design, l'aperçu et l'export PDF/PNG
 */

// Types communs
export interface DesignElement {
  id: string;
  type: 'image' | 'text';
  x: number;          // Position en % (0-1) relatif à la zone de délimitation
  y: number;          // Position en % (0-1) relatif à la zone de délimitation
  width: number;      // Largeur en pixels (dimensions de référence)
  height: number;     // Hauteur en pixels (dimensions de référence)
  rotation: number;   // Rotation en degrés
  zIndex: number;
  // Pour les images
  imageUrl?: string;
  // Pour le texte
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface Delimitation {
  x: number;           // Position X en % (0-1)
  y: number;           // Position Y en % (0-1)
  width: number;       // Largeur en % (0-1)
  height: number;      // Hauteur en % (0-1)
  coordinateType?: 'PERCENTAGE' | 'PIXEL';
  referenceWidth?: number;    // Largeur de référence en pixels
  referenceHeight?: number;   // Hauteur de référence en pixels
}

export interface CanvasDimensions {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Calcule les dimensions réelles du canvas pour l'export
 * Utilise les mêmes dimensions que ProductDesignEditor pour garantir la cohérence
 */
export const calculateCanvasDimensions = (delimitation?: Delimitation): CanvasDimensions => {
  const refWidth = delimitation?.referenceWidth || 800;
  const refHeight = delimitation?.referenceHeight || 800;

  // Utiliser les dimensions de la délimitation calculées en pixels réels
  let realWidth = refWidth;
  let realHeight = refHeight;

  if (delimitation) {
    realWidth = Math.round(delimitation.width * refWidth);
    realHeight = Math.round(delimitation.height * refHeight);
  }

  // Validation et limites de sécurité
  const MIN_SIZE = 10;
  const MAX_SIZE = 4096;

  realWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, realWidth));
  realHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, realHeight));

  console.log('📐 [PositioningUtils] Canvas dimensions calculated:', {
    delimitation,
    referenceSize: { width: refWidth, height: refHeight },
    realSize: { width: realWidth, height: realHeight }
  });

  return {
    width: realWidth,
    height: realHeight,
    offsetX: 0,
    offsetY: 0
  };
};

/**
 * Calcule le positionnement et les dimensions pour un élément dans un canvas
 * Logique unifiée basée sur ProductDesignEditor
 */
export const getElementCanvasTransform = (
  element: DesignElement,
  canvasDimensions: CanvasDimensions,
  delimitation?: Delimitation
): {
  x: number;           // Position X en pixels dans le canvas
  y: number;           // Position Y en pixels dans le canvas
  width: number;       // Largeur en pixels dans le canvas
  height: number;      // Hauteur en pixels dans le canvas
  fontSize?: number;   // Taille de police en pixels (pour le texte)
  scale: number;       // Facteur d'échelle appliqué
} => {
  // 🔍 IMPORTANT: Utiliser referenceWidth/Height (taille de l'image de référence)
  // comme dans ProductDesignEditor pour calculer le scale
  const refWidth = delimitation?.referenceWidth || 800;
  const refHeight = delimitation?.referenceHeight || 800;

  // Facteurs d'échelle - IDENTIQUE à ProductDesignEditor ligne 257-258
  // scaleX = taille d'affichage du canvas / taille de l'image de référence
  const scaleX = canvasDimensions.width / refWidth;
  const scaleY = canvasDimensions.height / refHeight;

  // Position en pixels - relatif au canvas d'affichage
  const x = element.x * canvasDimensions.width;
  const y = element.y * canvasDimensions.height;

  // Dimensions en pixels - IMPORTANT: utiliser scaleX et scaleY pour adapter à l'affichage
  const width = element.width * scaleX;
  const height = element.height * scaleY;

  // Taille de police pour le texte - utiliser scaleX pour garder les proportions
  const fontSize = element.type === 'text'
    ? (element.fontSize || 24) * scaleX
    : undefined;

  console.log('🎯 [PositioningUtils] Element transform calculated:', {
    elementId: element.id,
    elementType: element.type,
    canvasSize: { width: canvasDimensions.width, height: canvasDimensions.height },
    referenceSize: { width: refWidth, height: refHeight },
    delimitation: delimitation ? {
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height,
      referenceWidth: delimitation.referenceWidth,
      referenceHeight: delimitation.referenceHeight
    } : null,
    scaleFactors: { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3) },
    elementOriginalSize: { width: element.width, height: element.height },
    relativePos: { x: element.x.toFixed(3), y: element.y.toFixed(3) },
    absolutePos: { x: x.toFixed(0), y: y.toFixed(0) },
    scaledDimensions: { width: width.toFixed(0), height: height.toFixed(0) },
    fontSize: fontSize?.toFixed(0)
  });

  return {
    x: x + (canvasDimensions.offsetX || 0),
    y: y + (canvasDimensions.offsetY || 0),
    width,
    height,
    fontSize,
    scale: scaleX  // Retourner scaleX comme valeur de scale
  };
};

/**
 * Génère le style CSS pour le rendu web (utilisé par CustomizationPreview)
 * Maintient la cohérence avec getElementCanvasTransform
 * IMPORTANT: Retourne UN OBJET avec parentStyle et childStyle car ProductDesignEditor
 * utilise 2 conteneurs imbriqués (parent pour position + translate, child pour rotation + dimensions)
 */
export const getElementWebStyle = (
  element: DesignElement,
  containerDimensions: CanvasDimensions,
  delimitation?: Delimitation
): { parentStyle: React.CSSProperties; childStyle: React.CSSProperties } => {
  const transform = getElementCanvasTransform(element, containerDimensions, delimitation);

  // Style du conteneur parent - Position et centrage
  const parentStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${transform.x}px`,
    top: `${transform.y}px`,
    transform: `translate(-50%, -50%)`,  // Centrage sur la position
    zIndex: element.zIndex + 10,
    pointerEvents: 'none',
  };

  // Style du conteneur enfant - Rotation et dimensions (comme ProductDesignEditor ligne 1387-1394)
  const childStyle: React.CSSProperties = {
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center center',
    width: `${transform.width}px`,
    height: `${transform.height}px`,
    overflow: element.type === 'text' ? 'visible' : 'hidden', // ✅ Permet au texte de dépasser si nécessaire
    position: 'relative',
  };

  return { parentStyle, childStyle };
};

/**
 * Génère le style CSS pour le texte (utilisé par CustomizationPreview)
 */
export const getTextWebStyle = (
  element: DesignElement,
  containerDimensions: CanvasDimensions,
  delimitation?: Delimitation
): React.CSSProperties => {
  const transform = getElementCanvasTransform(element, containerDimensions, delimitation);

  // ✅ Style identique à ProductDesignEditor (ligne 1670-1683)
  return {
    fontFamily: element.fontFamily || 'Arial',
    fontSize: `${transform.fontSize}px`,
    color: element.color || '#000000',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    textAlign: element.textAlign || 'center',
    lineHeight: '1.2',
    whiteSpace: 'normal', // ✅ Identique à l'éditeur (gestion des \n avec <br />)
    overflow: 'visible', // ✅ Permet au texte de dépasser
    wordWrap: 'break-word', // ✅ Identique à l'éditeur
    userSelect: 'none',
    pointerEvents: 'none',
  };
};
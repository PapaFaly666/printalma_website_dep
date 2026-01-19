/**
 * Utilitaire de calcul de Bounding Box
 * Convertit les positions relatives (offsets depuis le centre) en bounding box absolue
 *
 * 📐 ALGORITHME DE POSITIONNEMENT
 * ================================
 *
 * Frontend (affichage):
 * - Délimitation: zone de placement sur le produit (x, y, width, height)
 * - designScale: échelle du design par rapport à la délimitation (0.8 = 80% de la zone)
 * - Offset (x, y): déplacement en pixels depuis le CENTRE de la délimitation
 *
 * Backend (génération):
 * - Bounding Box: Rectangle absolu (left, top, width, height) en pixels sur l'image originale
 * - Le backend positionne le design dans ce rectangle avec fit: 'inside' (Sharp)
 *
 * CONVERSION:
 * -----------
 * 1. Calculer la taille du conteneur: containerWidth = delimWidth × designScale
 * 2. Calculer le centre de la délimitation: centerX = delimX + delimWidth/2
 * 3. Calculer le coin supérieur gauche: left = centerX + offsetX - containerWidth/2
 * 4. Même chose pour top
 */

export interface DelimitationInfo {
  x: number;          // Position x de la délimitation (pixels absolus sur l'image)
  y: number;          // Position y de la délimitation (pixels absolus sur l'image)
  width: number;      // Largeur de la délimitation (pixels absolus)
  height: number;     // Hauteur de la délimitation (pixels absolus)
  coordinateType?: 'PIXEL' | 'PERCENTAGE';
  imageWidth?: number;  // Largeur de l'image originale (si coordinateType = PERCENTAGE)
  imageHeight?: number; // Hauteur de l'image originale (si coordinateType = PERCENTAGE)
}

export interface DesignTransform {
  x: number;          // Offset horizontal depuis le centre (pixels)
  y: number;          // Offset vertical depuis le centre (pixels)
  designScale: number; // Échelle du design (0.8 = 80% de la délimitation)
  rotation?: number;   // Rotation en degrés
}

export interface BoundingBox {
  left: number;   // Coin supérieur gauche X (pixels absolus)
  top: number;    // Coin supérieur gauche Y (pixels absolus)
  width: number;  // Largeur du conteneur (pixels absolus)
  height: number; // Hauteur du conteneur (pixels absolus)
}

/**
 * Convertit une délimitation en coordonnées absolues
 */
export function convertDelimitationToAbsolute(delim: DelimitationInfo): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const isPixel = delim.coordinateType === 'PIXEL' ||
                  (delim.x > 100 || delim.y > 100); // Détection automatique

  if (isPixel) {
    return {
      x: delim.x,
      y: delim.y,
      width: delim.width,
      height: delim.height,
    };
  }

  // Conversion pourcentage → pixels
  const imgW = delim.imageWidth || 1200;
  const imgH = delim.imageHeight || 1200;

  return {
    x: (delim.x / 100) * imgW,
    y: (delim.y / 100) * imgH,
    width: (delim.width / 100) * imgW,
    height: (delim.height / 100) * imgH,
  };
}

/**
 * Calcule la bounding box absolue à partir d'une transformation
 *
 * @param delim - Informations de la délimitation
 * @param transform - Transformation du design (x, y, designScale)
 * @returns Bounding box absolue en pixels sur l'image originale
 *
 * @example
 * const delim = { x: 100, y: 100, width: 400, height: 400, coordinateType: 'PIXEL' };
 * const transform = { x: 50, y: -30, designScale: 0.8 };
 * const bbox = calculateBoundingBox(delim, transform);
 * // bbox = { left: 230, top: 150, width: 320, height: 320 }
 */
export function calculateBoundingBox(
  delim: DelimitationInfo,
  transform: DesignTransform
): BoundingBox {
  // 1. Convertir la délimitation en pixels absolus
  const delimAbsolute = convertDelimitationToAbsolute(delim);

  // 2. Calculer les dimensions du conteneur (scale appliqué à la délimitation)
  const containerWidth = delimAbsolute.width * transform.designScale;
  const containerHeight = delimAbsolute.height * transform.designScale;

  // 3. Calculer le centre de la délimitation
  const centerX = delimAbsolute.x + delimAbsolute.width / 2;
  const centerY = delimAbsolute.y + delimAbsolute.height / 2;

  // 4. Calculer le coin supérieur gauche du conteneur
  // Position = centre + offset - moitié de la largeur/hauteur du conteneur
  const left = centerX + transform.x - containerWidth / 2;
  const top = centerY + transform.y - containerHeight / 2;

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
  };
}

/**
 * Calcule les contraintes de positionnement (min/max pour x et y)
 * Pour empêcher le design de sortir de la délimitation
 *
 * @param delim - Informations de la délimitation
 * @param designScale - Échelle du design
 * @returns Contraintes { minX, maxX, minY, maxY }
 */
export function calculatePositionConstraints(
  delim: DelimitationInfo,
  designScale: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  const delimAbsolute = convertDelimitationToAbsolute(delim);

  const containerWidth = delimAbsolute.width * designScale;
  const containerHeight = delimAbsolute.height * designScale;

  return {
    maxX: (delimAbsolute.width - containerWidth) / 2,
    minX: -(delimAbsolute.width - containerWidth) / 2,
    maxY: (delimAbsolute.height - containerHeight) / 2,
    minY: -(delimAbsolute.height - containerHeight) / 2,
  };
}

/**
 * Applique les contraintes à une position
 */
export function applyConstraints(
  x: number,
  y: number,
  constraints: { minX: number; maxX: number; minY: number; maxY: number }
): { x: number; y: number } {
  return {
    x: Math.max(constraints.minX, Math.min(constraints.maxX, x)),
    y: Math.max(constraints.minY, Math.min(constraints.maxY, y)),
  };
}

/**
 * Convertit une bounding box en format backend
 * Le backend utilise: { x, y, width, height, positionUnit: 'PIXEL' }
 */
export function boundingBoxToBackendFormat(bbox: BoundingBox) {
  return {
    x: bbox.left,
    y: bbox.top,
    width: bbox.width,
    height: bbox.height,
    positionUnit: 'PIXEL' as const,
  };
}

/**
 * Calcule le ratio d'échelle entre viewport et image originale
 * Utilisé pour convertir les offsets du drag souris
 */
export function calculateScaleRatio(
  delimAbsolute: { width: number; height: number },
  delimViewport: { width: number; height: number }
): number {
  // Utiliser la largeur comme référence
  return delimAbsolute.width / delimViewport.width;
}

/**
 * 🆕 FONCTION COMPLÈTE: Calcule toutes les informations nécessaires
 * pour le positionnement (frontend + backend)
 */
export function calculateDesignPositioning(
  delim: DelimitationInfo,
  transform: DesignTransform,
  viewportDelimSize?: { width: number; height: number }
) {
  // 1. Convertir délimitation en pixels absolus
  const delimAbsolute = convertDelimitationToAbsolute(delim);

  // 2. Calculer bounding box absolue
  const boundingBox = calculateBoundingBox(delim, transform);

  // 3. Calculer contraintes
  const constraints = calculatePositionConstraints(delim, transform.designScale);

  // 4. Calculer scale ratio si viewport fourni
  const scaleRatio = viewportDelimSize
    ? calculateScaleRatio(delimAbsolute, viewportDelimSize)
    : 1;

  return {
    delimAbsolute,     // Délimitation en pixels absolus
    boundingBox,       // Bounding box pour le backend
    constraints,       // Limites min/max pour les offsets
    scaleRatio,        // Ratio viewport/original
    containerWidth: boundingBox.width,
    containerHeight: boundingBox.height,
  };
}

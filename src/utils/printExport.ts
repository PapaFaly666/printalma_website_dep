/**
 * Utilitaire d'export pour l'impression
 * Génère des fichiers PNG/PDF avec uniquement les éléments de personnalisation
 * sans le mockup du produit
 * Utilise la logique de positionnement unifiée pour garantir la cohérence
 */

import { getElementCanvasTransform, calculateCanvasDimensions } from './positioningUtils';

// Types pour les éléments de design
interface DesignElement {
  id: string;
  type: 'image' | 'text';
  x: number; // Position en pourcentage (0-1)
  y: number; // Position en pourcentage (0-1)
  width: number; // Largeur en pixels
  height: number; // Hauteur en pixels
  rotation: number;
  zIndex: number;
  // Pour les images
  imageUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
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

interface Delimitation {
  x: number;           // Position X en pourcentage (0-1)
  y: number;           // Position Y en pourcentage (0-1)
  width: number;       // Largeur en pourcentage (0-1)
  height: number;      // Hauteur en pourcentage (0-1)
  coordinateType?: 'PERCENTAGE' | 'PIXEL';
  referenceWidth?: number;
  referenceHeight?: number;
}

interface ExportOptions {
  width?: number;      // Largeur du canvas (si non spécifié, utilise les dimensions réelles de la délimitation)
  height?: number;     // Hauteur du canvas (si non spécifié, utilise les dimensions réelles de la délimitation)
  format?: 'png' | 'pdf';
  filename?: string;
  backgroundColor?: string; // Couleur de fond (défaut: transparent)
  delimitation?: Delimitation; // Zone de délimitation pour le positionnement et les dimensions
  useRealDimensions?: boolean; // Si true, utilise les dimensions réelles de la délimitation (défaut: true)
}

/**
 * Calcule les dimensions réelles du cadre de délimitation en pixels
 * Utilise la logique unifiée de positioningUtils pour garantir la cohérence
 */
const calculateRealDelimitationDimensions = (delimitation: Delimitation): { width: number; height: number } => {
  const canvasDimensions = calculateCanvasDimensions(delimitation);

  return {
    width: canvasDimensions.width,
    height: canvasDimensions.height
  };
};

/**
 * Charge une image depuis une URL avec gestion des erreurs CORS
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Essayer avec crossOrigin anonymous (requis pour toBlob)
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      console.log('✅ [PrintExport] Image chargée:', url);
      resolve(img);
    };

    img.onerror = (error) => {
      console.error('❌ [PrintExport] Erreur chargement image:', {
        url,
        error,
        crossOrigin: img.crossOrigin
      });

      // Message d'erreur détaillé
      reject(new Error(
        `Impossible de charger l'image: ${url}\n` +
        `Vérifiez que l'image existe et que les en-têtes CORS sont correctement configurés sur le serveur.`
      ));
    };

    img.src = url;
  });
};

/**
 * Les coordonnées des éléments sont déjà relatives à la zone de délimitation (0-1)
 * donc on les utilise directement sans conversion
 */
const getElementPosition = (
  elementX: number,
  elementY: number
): { x: number; y: number } => {
  // Les éléments de personnalisation ont des coordonnées déjà relatives
  // à la zone de délimitation, pas à l'image complète
  return { x: elementX, y: elementY };
};

/**
 * Dessine un élément texte sur le canvas
 * Utilise la logique unifiée de positioningUtils pour garantir la cohérence
 */
const drawTextElement = (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  canvasWidth: number,
  canvasHeight: number,
  referenceWidth: number,
  referenceHeight: number
) => {
  if (!element.text) return;

  const canvasDimensions = { width: canvasWidth, height: canvasHeight };
  const delimitation = { referenceWidth, referenceHeight };

  const transform = getElementCanvasTransform(element as any, canvasDimensions, delimitation);

  console.log('🎨 [PrintExport] Drawing text element with unified positioning:', {
    text: element.text,
    elementId: element.id,
    position: { x: transform.x.toFixed(0), y: transform.y.toFixed(0) },
    dimensions: { width: transform.width.toFixed(0), height: transform.height.toFixed(0) },
    fontSize: transform.fontSize?.toFixed(0),
    scale: transform.scale.toFixed(3),
    rotation: element.rotation
  });

  ctx.save();

  // Appliquer la rotation (même logique que ProductDesignEditor)
  ctx.translate(transform.x, transform.y);
  ctx.rotate((element.rotation * Math.PI) / 180);

  // Style du texte
  const fontStyle = element.fontStyle || 'normal';
  const fontWeight = element.fontWeight || 'normal';
  const fontFamily = element.fontFamily || 'Arial';
  ctx.font = `${fontStyle} ${fontWeight} ${transform.fontSize}px ${fontFamily}`;
  ctx.fillStyle = element.color || '#000000';
  ctx.textAlign = element.textAlign || 'center';
  ctx.textBaseline = 'middle';

  // Dessiner le texte (même logique que ProductDesignEditor)
  ctx.fillText(element.text, 0, 0, transform.width);

  // Ajouter la décoration de texte si nécessaire
  if (element.textDecoration === 'underline') {
    const metrics = ctx.measureText(element.text);
    const textWidth = Math.min(metrics.width, transform.width);
    ctx.beginPath();
    ctx.moveTo(-textWidth / 2, transform.fontSize * 0.1);
    ctx.lineTo(textWidth / 2, transform.fontSize * 0.1);
    ctx.strokeStyle = element.color || '#000000';
    ctx.lineWidth = transform.fontSize * 0.05;
    ctx.stroke();
  }

  ctx.restore();
};

/**
 * Dessine un élément image sur le canvas
 * Utilise la logique unifiée de positioningUtils pour garantir la cohérence
 */
const drawImageElement = async (
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  canvasWidth: number,
  canvasHeight: number,
  referenceWidth: number,
  referenceHeight: number
): Promise<void> => {
  if (!element.imageUrl) return;

  const canvasDimensions = { width: canvasWidth, height: canvasHeight };
  const delimitation = { referenceWidth, referenceHeight };

  const transform = getElementCanvasTransform(element as any, canvasDimensions, delimitation);

  console.log('🖼️ [PrintExport] Drawing image element with unified positioning:', {
    imageUrl: element.imageUrl,
    elementId: element.id,
    position: { x: transform.x.toFixed(0), y: transform.y.toFixed(0) },
    dimensions: { width: transform.width.toFixed(0), height: transform.height.toFixed(0) },
    scale: transform.scale.toFixed(3),
    rotation: element.rotation
  });

  try {
    const img = await loadImage(element.imageUrl);

    ctx.save();

    // Appliquer la rotation (même logique que ProductDesignEditor)
    ctx.translate(transform.x, transform.y);
    ctx.rotate((element.rotation * Math.PI) / 180);

    // Dessiner l'image centrée (même logique que ProductDesignEditor)
    ctx.drawImage(
      img,
      -transform.width / 2,
      -transform.height / 2,
      transform.width,
      transform.height
    );

    ctx.restore();
  } catch (error) {
    console.error('❌ [PrintExport] Erreur lors du chargement de l\'image:', error);
  }
};

/**
 * Exporte les éléments de design en PNG (sans le mockup)
 * Utilise les dimensions RÉELLES du cadre de délimitation pour une qualité optimale
 */
export const exportDesignElementsToPNG = async (
  designElements: DesignElement[],
  options: ExportOptions = {}
): Promise<Blob> => {
  const {
    width: customWidth,
    height: customHeight,
    backgroundColor = 'transparent',
    delimitation,
    useRealDimensions = true
  } = options;

  // Logs de débogage au début
  console.log('🚀 [PrintExport] Début de l\'export PNG:', {
    elementsCount: designElements?.length,
    useRealDimensions,
    hasDelimitation: !!delimitation,
    delimitation: delimitation ? {
      x: delimitation.x,
      y: delimitation.y,
      width: delimitation.width,
      height: delimitation.height,
      referenceWidth: delimitation.referenceWidth,
      referenceHeight: delimitation.referenceHeight,
      coordinateType: delimitation.coordinateType
    } : null,
    customWidth,
    customHeight,
    backgroundColor
  });

  // Validation des éléments
  if (!designElements || designElements.length === 0) {
    console.warn('⚠️ [PrintExport] Aucun élément à exporter');
    throw new Error('Aucun élément de design à exporter');
  }

  // Calculer les dimensions du canvas
  let canvasWidth: number;
  let canvasHeight: number;

  if (useRealDimensions && delimitation) {
    // Utiliser les dimensions RÉELLES de la délimitation (recommandé pour l'impression)
    const realDimensions = calculateRealDelimitationDimensions(delimitation);
    canvasWidth = customWidth || realDimensions.width;
    canvasHeight = customHeight || realDimensions.height;
  } else {
    // Fallback sur les dimensions personnalisées ou par défaut
    canvasWidth = customWidth || 2000;
    canvasHeight = customHeight || 2000;
  }

  // Validation des dimensions finales
  if (!Number.isFinite(canvasWidth) || !Number.isFinite(canvasHeight)) {
    throw new Error(`Dimensions du canvas non valides: ${canvasWidth}x${canvasHeight}`);
  }

  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new Error(`Dimensions du canvas doivent être positives: ${canvasWidth}x${canvasHeight}`);
  }

  console.log('📦 [PrintExport] Starting export with REAL dimensions:', {
    elementsCount: designElements.length,
    canvasSize: { width: canvasWidth, height: canvasHeight },
    useRealDimensions,
    delimitation,
    message: useRealDimensions ? '✅ Export à la taille réelle (qualité optimale)' : '⚠️ Export avec dimensions par défaut'
  });

  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas');
  }

  // Appliquer le fond
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Trier les éléments par zIndex
  const sortedElements = [...designElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // Utiliser la taille de référence de la délimitation si disponible
  const referenceWidth = delimitation?.referenceWidth || 800;
  const referenceHeight = delimitation?.referenceHeight || 800;

  console.log('📦 [PrintExport] Reference size:', { referenceWidth, referenceHeight });
  console.log('📦 [PrintExport] Canvas size:', { canvasWidth, canvasHeight });

  for (const element of sortedElements) {
    console.log('📦 [PrintExport] Processing element:', element.type, element);

    if (element.type === 'text') {
      drawTextElement(ctx, element, canvasWidth, canvasHeight, referenceWidth, referenceHeight);
    } else if (element.type === 'image') {
      await drawImageElement(ctx, element, canvasWidth, canvasHeight, referenceWidth, referenceHeight);
    }
  }

  console.log('📦 [PrintExport] Export complete, creating blob...', {
    canvasSize: { width: canvasWidth, height: canvasHeight },
    canvasArea: canvasWidth * canvasHeight,
    elementsDrawn: sortedElements.length
  });

  // Validation finale avant création du blob
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new Error(`Dimensions du canvas invalides: ${canvasWidth}x${canvasHeight}`);
  }

  if (canvasWidth * canvasHeight > 268435456) { // 16384 * 16384
    throw new Error(`Canvas trop grand: ${canvasWidth}x${canvasHeight} (max recommandé: 4096x4096)`);
  }

  // Convertir en Blob avec gestion d'erreur améliorée
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('✅ [PrintExport] Blob created successfully:', {
              size: blob.size,
              sizeKB: (blob.size / 1024).toFixed(2) + ' KB',
              type: blob.type
            });
            resolve(blob);
          } else {
            console.error('❌ [PrintExport] toBlob returned null', {
              canvasSize: { width: canvasWidth, height: canvasHeight },
              canvasArea: canvasWidth * canvasHeight,
              ctx: ctx ? 'OK' : 'NULL'
            });
            reject(new Error(`Impossible de créer le PNG (canvas: ${canvasWidth}x${canvasHeight}). Vérifiez les images et la taille du canvas.`));
          }
        },
        'image/png',
        1.0
      );
    } catch (error) {
      console.error('❌ [PrintExport] Exception lors de toBlob:', error);
      reject(new Error(`Erreur toBlob: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
};

/**
 * Télécharge les éléments de design en PNG
 */
export const downloadDesignElementsAsPNG = async (
  designElements: DesignElement[],
  filename: string = 'personnalisation',
  options: ExportOptions = {}
): Promise<void> => {
  try {
    const blob = await exportDesignElementsToPNG(designElements, options);

    // Créer le lien de téléchargement
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de l\'export PNG:', error);
    throw error;
  }
};

/**
 * Exporte les éléments de design en PDF
 * Nécessite jsPDF (à installer si non présent)
 */
export const downloadDesignElementsAsPDF = async (
  designElements: DesignElement[],
  filename: string = 'personnalisation',
  options: ExportOptions = {}
): Promise<void> => {
  try {
    // Importer jsPDF dynamiquement
    const { jsPDF } = await import('jspdf');

    // Générer le PNG d'abord
    const blob = await exportDesignElementsToPNG(designElements, options);

    // Convertir le blob en base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Retirer le préfixe data:image/png;base64,
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    const base64 = await base64Promise;

    // Créer le PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Ajouter l'image au PDF (centrée sur A4)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgSize = Math.min(pageWidth, pageHeight) - 20; // Marge de 10mm
    const x = (pageWidth - imgSize) / 2;
    const y = (pageHeight - imgSize) / 2;

    pdf.addImage(base64, 'PNG', x, y, imgSize, imgSize);

    // Télécharger le PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
};

/**
 * Exporte tous les éléments de toutes les vues
 */
export const exportAllViewsDesignElements = async (
  elementsByView: Record<string, DesignElement[]>,
  baseFilename: string = 'personnalisation',
  format: 'png' | 'pdf' = 'png',
  options: ExportOptions = {}
): Promise<void> => {
  const views = Object.entries(elementsByView);

  for (let i = 0; i < views.length; i++) {
    const [viewKey, elements] = views[i];
    if (elements.length === 0) continue;

    const filename = views.length > 1
      ? `${baseFilename}_vue_${i + 1}_${viewKey}`
      : baseFilename;

    if (format === 'pdf') {
      await downloadDesignElementsAsPDF(elements, filename, options);
    } else {
      await downloadDesignElementsAsPNG(elements, filename, options);
    }

    // Petit délai entre les téléchargements pour éviter les problèmes
    if (i < views.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};

export default {
  exportDesignElementsToPNG,
  downloadDesignElementsAsPNG,
  downloadDesignElementsAsPDF,
  exportAllViewsDesignElements
};

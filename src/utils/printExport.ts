/**
 * Utilitaire d'export pour l'impression
 * Génère des fichiers PNG/PDF avec uniquement les éléments de personnalisation
 * sans le mockup du produit
 */

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
  width?: number;      // Largeur du canvas (défaut: 2000px pour haute résolution)
  height?: number;     // Hauteur du canvas (défaut: 2000px)
  format?: 'png' | 'pdf';
  filename?: string;
  backgroundColor?: string; // Couleur de fond (défaut: transparent)
  delimitation?: Delimitation; // Zone de délimitation pour le positionnement
}

/**
 * Charge une image depuis une URL
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger l'image: ${url}`));
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

  console.log('🎨 [PrintExport] Drawing text element:', {
    text: element.text,
    x: element.x,
    y: element.y,
    fontSize: element.fontSize,
    width: element.width,
    height: element.height
  });

  // Les coordonnées sont déjà relatives (0-1)
  const { x: relX, y: relY } = getElementPosition(element.x, element.y);

  // Calculer la position en pixels dans le canvas
  const x = relX * canvasWidth;
  const y = relY * canvasHeight;

  // Calculer le scale pour la taille de police
  const scaleX = canvasWidth / referenceWidth;
  const scaleY = canvasHeight / referenceHeight;
  const scale = Math.min(scaleX, scaleY);

  const scaledFontSize = (element.fontSize || 24) * scale;
  const scaledWidth = element.width * scale;

  console.log('🎨 [PrintExport] Text position calculated:', {
    x, y, scaledFontSize, scaledWidth, scale
  });

  ctx.save();

  // Appliquer la rotation
  ctx.translate(x, y);
  ctx.rotate((element.rotation * Math.PI) / 180);

  // Style du texte
  const fontStyle = element.fontStyle || 'normal';
  const fontWeight = element.fontWeight || 'normal';
  const fontFamily = element.fontFamily || 'Arial';
  ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  ctx.fillStyle = element.color || '#000000';
  ctx.textAlign = element.textAlign || 'center';
  ctx.textBaseline = 'middle';

  // Dessiner le texte
  ctx.fillText(element.text, 0, 0, scaledWidth);

  // Ajouter la décoration de texte si nécessaire
  if (element.textDecoration === 'underline') {
    const metrics = ctx.measureText(element.text);
    const textWidth = Math.min(metrics.width, scaledWidth);
    ctx.beginPath();
    ctx.moveTo(-textWidth / 2, scaledFontSize * 0.1);
    ctx.lineTo(textWidth / 2, scaledFontSize * 0.1);
    ctx.strokeStyle = element.color || '#000000';
    ctx.lineWidth = scaledFontSize * 0.05;
    ctx.stroke();
  }

  ctx.restore();
};

/**
 * Dessine un élément image sur le canvas
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

  console.log('🖼️ [PrintExport] Drawing image element:', {
    imageUrl: element.imageUrl,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height
  });

  try {
    const img = await loadImage(element.imageUrl);

    // Les coordonnées sont déjà relatives (0-1)
    const { x: relX, y: relY } = getElementPosition(element.x, element.y);

    // Calculer la position en pixels dans le canvas
    const x = relX * canvasWidth;
    const y = relY * canvasHeight;

    // Calculer le scale
    const scaleX = canvasWidth / referenceWidth;
    const scaleY = canvasHeight / referenceHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = element.width * scale;
    const scaledHeight = element.height * scale;

    console.log('🖼️ [PrintExport] Image position calculated:', {
      x, y, scaledWidth, scaledHeight, scale
    });

    ctx.save();

    // Appliquer la rotation
    ctx.translate(x, y);
    ctx.rotate((element.rotation * Math.PI) / 180);

    // Dessiner l'image centrée
    ctx.drawImage(
      img,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    ctx.restore();
  } catch (error) {
    console.error('Erreur lors du chargement de l\'image:', error);
  }
};

/**
 * Exporte les éléments de design en PNG (sans le mockup)
 */
export const exportDesignElementsToPNG = async (
  designElements: DesignElement[],
  options: ExportOptions = {}
): Promise<Blob> => {
  const {
    width = 2000,
    height = 2000,
    backgroundColor = 'transparent',
    delimitation
  } = options;

  console.log('📦 [PrintExport] Starting export with:', {
    elementsCount: designElements.length,
    elements: designElements,
    canvasSize: { width, height },
    delimitation
  });

  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas');
  }

  // Appliquer le fond
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Trier les éléments par zIndex
  const sortedElements = [...designElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // Utiliser la taille de référence de la délimitation si disponible
  const referenceWidth = delimitation?.referenceWidth || 800;
  const referenceHeight = delimitation?.referenceHeight || 800;

  console.log('📦 [PrintExport] Reference size:', { referenceWidth, referenceHeight });

  for (const element of sortedElements) {
    console.log('📦 [PrintExport] Processing element:', element.type, element);

    if (element.type === 'text') {
      drawTextElement(ctx, element, width, height, referenceWidth, referenceHeight);
    } else if (element.type === 'image') {
      await drawImageElement(ctx, element, width, height, referenceWidth, referenceHeight);
    }
  }

  console.log('📦 [PrintExport] Export complete, creating blob...');

  // Convertir en Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log('📦 [PrintExport] Blob created successfully:', blob.size, 'bytes');
          resolve(blob);
        } else {
          reject(new Error('Erreur lors de la création du PNG'));
        }
      },
      'image/png',
      1.0
    );
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

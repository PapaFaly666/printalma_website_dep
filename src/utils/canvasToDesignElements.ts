/**
 * 🎨 Convertisseur Canvas DOM → DesignElements pour Sharp
 *
 * Extrait les éléments visuels du canvas de personnalisation
 * et les convertit en format compatible avec le backend Sharp
 */

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';

  // Pour les textes
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';

  // Pour les images
  imageUrl?: string;

  // Position et dimensions (en pixels)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;

  // Opacité
  opacity?: number;
}

/**
 * Parse un élément de texte du DOM
 */
function parseTextElement(
  container: HTMLElement,
  index: number
): DesignElement | null {
  try {
    // Trouver le div de texte avec les styles
    const textDiv = container.querySelector('div[style*="font-family"]') as HTMLElement;
    if (!textDiv) return null;

    // Extraire le texte (remplacer <br> par \n)
    const text = textDiv.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Enlever autres tags HTML
      .trim();

    if (!text) return null;

    // Position absolue du container
    const style = container.style;
    const left = parseFloat(style.left) || 0;
    const top = parseFloat(style.top) || 0;

    // Transform translate(-50%, -50%) signifie que left/top sont le centre
    // Pas besoin d'ajustement si on veut le centre
    const x = left;
    const y = top;

    // Trouver le div parent avec width/height et rotation
    const rotatedDiv = container.querySelector('.relative.cursor-move') as HTMLElement;
    const rotatedStyle = rotatedDiv?.style || container.style;

    const width = parseFloat(rotatedStyle.width) || 100;
    const height = parseFloat(rotatedStyle.height) || 50;

    // Extraire la rotation
    const transformMatch = rotatedStyle.transform?.match(/rotate\(([^)]+)\)/);
    const rotation = transformMatch
      ? parseFloat(transformMatch[1].replace('deg', ''))
      : 0;

    // Extraire le z-index
    const zIndex = parseInt(style.zIndex) || index + 1;

    // Extraire les styles de texte
    const textStyle = textDiv.style;
    const computedStyle = window.getComputedStyle(textDiv);

    const fontFamily = (textStyle.fontFamily || computedStyle.fontFamily)
      .replace(/["']/g, '')
      .split(',')[0]
      .trim();

    const fontSize = parseFloat(textStyle.fontSize || computedStyle.fontSize);

    // Extraire la couleur RGB
    const colorMatch = (textStyle.color || computedStyle.color)
      .match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const color = colorMatch
      ? `#${parseInt(colorMatch[1]).toString(16).padStart(2, '0')}${parseInt(colorMatch[2]).toString(16).padStart(2, '0')}${parseInt(colorMatch[3]).toString(16).padStart(2, '0')}`
      : '#000000';

    const fontWeight = textStyle.fontWeight || computedStyle.fontWeight || 'normal';
    const fontStyle = (textStyle.fontStyle || computedStyle.fontStyle) as 'normal' | 'italic';
    const textDecoration = (textStyle.textDecoration || computedStyle.textDecoration) as 'none' | 'underline' | 'line-through';
    const textAlign = (textStyle.textAlign || computedStyle.textAlign) as 'left' | 'center' | 'right';

    return {
      id: `text-${index + 1}`,
      type: 'text',
      text,
      x,
      y,
      width,
      height,
      rotation,
      zIndex,
      fontSize,
      fontFamily,
      color,
      fontWeight,
      fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
      textDecoration: textDecoration.includes('underline') ? 'underline' :
                     textDecoration.includes('line-through') ? 'line-through' : 'none',
      textAlign: textAlign || 'center',
      opacity: 1
    };
  } catch (error) {
    console.error('Erreur parsing élément texte:', error);
    return null;
  }
}

/**
 * Parse un élément image du DOM
 */
function parseImageElement(
  container: HTMLElement,
  index: number
): DesignElement | null {
  try {
    // Trouver l'image
    const img = container.querySelector('img') as HTMLImageElement;
    if (!img || !img.src) return null;

    // Position absolue du container
    const style = container.style;
    const left = parseFloat(style.left) || 0;
    const top = parseFloat(style.top) || 0;
    const x = left;
    const y = top;

    // Trouver le div parent avec width/height et rotation
    const rotatedDiv = container.querySelector('.relative') as HTMLElement;
    const rotatedStyle = rotatedDiv?.style || container.style;

    const width = parseFloat(rotatedStyle.width) || img.naturalWidth || 100;
    const height = parseFloat(rotatedStyle.height) || img.naturalHeight || 100;

    // Extraire la rotation
    const transformMatch = rotatedStyle.transform?.match(/rotate\(([^)]+)\)/);
    const rotation = transformMatch
      ? parseFloat(transformMatch[1].replace('deg', ''))
      : 0;

    // Extraire le z-index
    const zIndex = parseInt(style.zIndex) || index + 1;

    return {
      id: `image-${index + 1}`,
      type: 'image',
      imageUrl: img.src,
      x,
      y,
      width,
      height,
      rotation,
      zIndex,
      opacity: 1
    };
  } catch (error) {
    console.error('Erreur parsing élément image:', error);
    return null;
  }
}

/**
 * Convertit tous les éléments du canvas en DesignElements
 *
 * @param canvasElement - L'élément DOM du canvas (div principal)
 * @returns Array de DesignElements pour le backend
 */
export function canvasToDesignElements(canvasElement: HTMLElement): DesignElement[] {
  const designElements: DesignElement[] = [];

  // Trouver tous les éléments absolute positionnés (sauf l'image principale)
  const elements = canvasElement.querySelectorAll('.absolute');

  elements.forEach((element, index) => {
    const container = element as HTMLElement;

    // Vérifier si c'est un élément texte
    const hasText = container.querySelector('div[style*="font-family"]');
    if (hasText) {
      const textElement = parseTextElement(container, index);
      if (textElement) {
        designElements.push(textElement);
      }
      return;
    }

    // Vérifier si c'est une image
    const hasImage = container.querySelector('img');
    if (hasImage) {
      const imageElement = parseImageElement(container, index);
      if (imageElement) {
        designElements.push(imageElement);
      }
      return;
    }
  });

  // Trier par zIndex
  designElements.sort((a, b) => a.zIndex - b.zIndex);

  return designElements;
}

/**
 * Récupère l'URL de l'image du produit depuis le canvas
 */
export function getProductImageUrl(canvasElement: HTMLElement): string | null {
  const productImg = canvasElement.querySelector('img[alt="Produit"]') as HTMLImageElement;
  return productImg?.src || null;
}

/**
 * Récupère les dimensions du canvas
 */
export function getCanvasDimensions(canvasElement: HTMLElement): { width: number; height: number } {
  return {
    width: canvasElement.offsetWidth,
    height: canvasElement.offsetHeight
  };
}

/**
 * 🎯 FONCTION PRINCIPALE
 * Prépare toutes les données pour l'envoi au backend
 */
export function prepareCustomizationData(canvasElement: HTMLElement) {
  const designElements = canvasToDesignElements(canvasElement);
  const productImageUrl = getProductImageUrl(canvasElement);
  const canvasDimensions = getCanvasDimensions(canvasElement);

  console.log('📊 Données de personnalisation extraites:');
  console.log('  - Éléments de design:', designElements.length);
  console.log('  - Image produit:', productImageUrl);
  console.log('  - Dimensions canvas:', canvasDimensions);
  console.log('  - Éléments détaillés:', designElements);

  return {
    designElements,
    productImageUrl,
    canvasDimensions,
    // Format pour elementsByView (backend)
    elementsByView: {
      [`${canvasDimensions.width}-${canvasDimensions.height}`]: designElements
    }
  };
}

/**
 * 📤 EXEMPLE D'UTILISATION
 */
export function extractAndSendCustomization(
  canvasElement: HTMLElement,
  additionalData: {
    productId: number;
    colorVariationId: number;
    viewId: number;
    clientEmail?: string;
    clientName?: string;
  }
) {
  const customizationData = prepareCustomizationData(canvasElement);

  // Préparer les données pour l'API
  const apiData = {
    productId: additionalData.productId,
    colorVariationId: additionalData.colorVariationId,
    viewId: additionalData.viewId,
    clientEmail: additionalData.clientEmail,
    clientName: additionalData.clientName,
    designElements: customizationData.designElements,
    elementsByView: customizationData.elementsByView
  };

  console.log('📤 Données prêtes pour l\'API:', apiData);

  return apiData;
}

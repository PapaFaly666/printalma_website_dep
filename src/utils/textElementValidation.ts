/**
 * Utilitaires de validation pour les éléments texte
 */

import {
  TextElement,
  ValidationResult,
  FONT_WEIGHTS,
  FONT_STYLES,
  TEXT_DECORATIONS,
  TEXT_ALIGNS,
  TEXT_ELEMENT_LIMITS
} from '../types/textElement';

/**
 * Valide un élément texte complet
 */
export function validateTextElement(element: TextElement): ValidationResult {
  const errors: string[] = [];

  // ========== Champs requis ==========
  if (!element.id) {
    errors.push('ID requis');
  }

  if (element.type !== 'text') {
    errors.push('Type doit être "text"');
  }

  if (typeof element.text !== 'string') {
    errors.push('Texte requis');
  } else {
    // Longueur du texte
    if (element.text.length < TEXT_ELEMENT_LIMITS.MIN_TEXT_LENGTH) {
      errors.push(`Le texte doit contenir au moins ${TEXT_ELEMENT_LIMITS.MIN_TEXT_LENGTH} caractère`);
    }
    if (element.text.length > TEXT_ELEMENT_LIMITS.MAX_TEXT_LENGTH) {
      errors.push(`Le texte ne peut pas dépasser ${TEXT_ELEMENT_LIMITS.MAX_TEXT_LENGTH} caractères`);
    }
  }

  // ========== Coordonnées (0-1) ==========
  if (typeof element.x !== 'number' || element.x < 0 || element.x > 1) {
    errors.push('x doit être entre 0 et 1');
  }

  if (typeof element.y !== 'number' || element.y < 0 || element.y > 1) {
    errors.push('y doit être entre 0 et 1');
  }

  // ========== Dimensions ==========
  if (typeof element.width !== 'number' || element.width < TEXT_ELEMENT_LIMITS.MIN_WIDTH) {
    errors.push(`width doit être >= ${TEXT_ELEMENT_LIMITS.MIN_WIDTH}px`);
  }
  if (element.width > TEXT_ELEMENT_LIMITS.MAX_WIDTH) {
    errors.push(`width ne peut pas dépasser ${TEXT_ELEMENT_LIMITS.MAX_WIDTH}px`);
  }

  if (typeof element.height !== 'number' || element.height < TEXT_ELEMENT_LIMITS.MIN_HEIGHT) {
    errors.push(`height doit être >= ${TEXT_ELEMENT_LIMITS.MIN_HEIGHT}px`);
  }
  if (element.height > TEXT_ELEMENT_LIMITS.MAX_HEIGHT) {
    errors.push(`height ne peut pas dépasser ${TEXT_ELEMENT_LIMITS.MAX_HEIGHT}px`);
  }

  // ========== Rotation ==========
  if (typeof element.rotation !== 'number' || element.rotation < TEXT_ELEMENT_LIMITS.MIN_ROTATION || element.rotation > TEXT_ELEMENT_LIMITS.MAX_ROTATION) {
    errors.push(`rotation doit être entre ${TEXT_ELEMENT_LIMITS.MIN_ROTATION} et ${TEXT_ELEMENT_LIMITS.MAX_ROTATION}`);
  }

  // ========== Style du texte ==========
  if (typeof element.fontSize !== 'number' || element.fontSize < TEXT_ELEMENT_LIMITS.MIN_FONT_SIZE || element.fontSize > TEXT_ELEMENT_LIMITS.MAX_FONT_SIZE) {
    errors.push(`fontSize doit être entre ${TEXT_ELEMENT_LIMITS.MIN_FONT_SIZE} et ${TEXT_ELEMENT_LIMITS.MAX_FONT_SIZE}`);
  }

  if (!element.fontFamily || typeof element.fontFamily !== 'string') {
    errors.push('fontFamily requis');
  }

  if (!element.color || !/^#[0-9A-Fa-f]{6}$/.test(element.color)) {
    errors.push('color doit être au format hex #RRGGBB');
  }

  // ========== Formatage (optionnel) ==========
  if (element.fontWeight !== undefined) {
    if (!FONT_WEIGHTS.includes(element.fontWeight as any)) {
      errors.push(`fontWeight invalide. Valeurs acceptées: ${FONT_WEIGHTS.join(', ')}`);
    }
  }

  if (element.fontStyle !== undefined) {
    if (!FONT_STYLES.includes(element.fontStyle as any)) {
      errors.push(`fontStyle invalide. Valeurs acceptées: ${FONT_STYLES.join(', ')}`);
    }
  }

  if (element.textDecoration !== undefined) {
    if (!TEXT_DECORATIONS.includes(element.textDecoration as any)) {
      errors.push(`textDecoration invalide. Valeurs acceptées: ${TEXT_DECORATIONS.join(', ')}`);
    }
  }

  if (element.textAlign !== undefined) {
    if (!TEXT_ALIGNS.includes(element.textAlign as any)) {
      errors.push(`textAlign invalide. Valeurs acceptées: ${TEXT_ALIGNS.join(', ')}`);
    }
  }

  // ========== Scale (optionnel) ==========
  if (element.scale !== undefined) {
    if (typeof element.scale !== 'number' || element.scale < TEXT_ELEMENT_LIMITS.MIN_SCALE || element.scale > TEXT_ELEMENT_LIMITS.MAX_SCALE) {
      errors.push(`scale doit être entre ${TEXT_ELEMENT_LIMITS.MIN_SCALE} et ${TEXT_ELEMENT_LIMITS.MAX_SCALE}`);
    }
  }

  // ========== Métadonnées (optionnel) ==========
  if (element.locked !== undefined && typeof element.locked !== 'boolean') {
    errors.push('locked doit être un boolean');
  }

  if (element.visible !== undefined && typeof element.visible !== 'boolean') {
    errors.push('visible doit être un boolean');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valide une liste d'éléments texte
 */
export function validateTextElements(elements: TextElement[]): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let hasErrors = false;

  elements.forEach((element, index) => {
    const result = validateTextElement(element);
    if (!result.valid) {
      errors[element.id || `element-${index}`] = result.errors;
      hasErrors = true;
    }
  });

  return {
    valid: !hasErrors,
    errors
  };
}

/**
 * Valide uniquement les propriétés critiques avant sauvegarde
 */
export function validateBeforeSave(element: TextElement): ValidationResult {
  const errors: string[] = [];

  // Vérifications minimales
  if (!element.id) errors.push('ID manquant');
  if (!element.text || element.text.trim().length === 0) errors.push('Texte vide');
  if (typeof element.x !== 'number' || typeof element.y !== 'number') errors.push('Position invalide');
  if (typeof element.width !== 'number' || typeof element.height !== 'number') errors.push('Dimensions invalides');

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Nettoie et normalise un élément texte
 */
export function normalizeTextElement(element: Partial<TextElement>): TextElement {
  return {
    id: element.id || `text-${Date.now()}`,
    type: 'text',
    text: element.text || '',
    x: clamp(element.x ?? 0.5, 0, 1),
    y: clamp(element.y ?? 0.5, 0, 1),
    width: clamp(element.width ?? 300, TEXT_ELEMENT_LIMITS.MIN_WIDTH, TEXT_ELEMENT_LIMITS.MAX_WIDTH),
    height: clamp(element.height ?? 80, TEXT_ELEMENT_LIMITS.MIN_HEIGHT, TEXT_ELEMENT_LIMITS.MAX_HEIGHT),
    rotation: clamp(element.rotation ?? 0, TEXT_ELEMENT_LIMITS.MIN_ROTATION, TEXT_ELEMENT_LIMITS.MAX_ROTATION),
    scale: element.scale ? clamp(element.scale, TEXT_ELEMENT_LIMITS.MIN_SCALE, TEXT_ELEMENT_LIMITS.MAX_SCALE) : 1,
    zIndex: element.zIndex ?? 1,
    fontSize: clamp(element.fontSize ?? 24, TEXT_ELEMENT_LIMITS.MIN_FONT_SIZE, TEXT_ELEMENT_LIMITS.MAX_FONT_SIZE),
    baseFontSize: element.baseFontSize ?? element.fontSize ?? 24,
    baseWidth: element.baseWidth ?? element.width ?? 300,
    fontFamily: element.fontFamily || 'Arial, sans-serif',
    color: isValidHexColor(element.color) ? element.color! : '#000000',
    fontWeight: FONT_WEIGHTS.includes(element.fontWeight as any) ? element.fontWeight : 'normal',
    fontStyle: FONT_STYLES.includes(element.fontStyle as any) ? element.fontStyle : 'normal',
    textDecoration: TEXT_DECORATIONS.includes(element.textDecoration as any) ? element.textDecoration : 'none',
    textAlign: TEXT_ALIGNS.includes(element.textAlign as any) ? element.textAlign : 'center',
    curve: element.curve ?? 0,
    locked: element.locked ?? false,
    visible: element.visible !== false
  };
}

/**
 * Vérifie si une couleur hex est valide
 */
export function isValidHexColor(color?: string): boolean {
  if (!color) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Clamp une valeur entre min et max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calcule la hauteur automatique en fonction du nombre de lignes
 */
export function calculateTextHeight(text: string, fontSize: number, lineHeight: number = 1.2): number {
  const lines = text.split('\n');
  return lines.length * fontSize * lineHeight;
}

/**
 * Compte le nombre de lignes dans un texte
 */
export function countLines(text: string): number {
  return text.split('\n').length;
}

/**
 * Vérifie si un élément est proche de la limite de caractères
 */
export function isNearCharLimit(text: string, threshold: number = 0.8): boolean {
  return text.length > TEXT_ELEMENT_LIMITS.MAX_TEXT_LENGTH * threshold;
}

/**
 * Vérifie si un élément a atteint la limite de caractères
 */
export function isAtCharLimit(text: string): boolean {
  return text.length >= TEXT_ELEMENT_LIMITS.MAX_TEXT_LENGTH;
}

/**
 * Tronque un texte à la limite maximale
 */
export function truncateText(text: string, maxLength: number = TEXT_ELEMENT_LIMITS.MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength);
}

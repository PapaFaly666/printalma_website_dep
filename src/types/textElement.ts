/**
 * Types et interfaces pour les éléments texte
 * Basé sur la documentation backend
 */

export interface TextElement {
  // Identifiant
  id: string;              // ID unique de l'élément (ex: "text-1234567890")
  type: 'text';            // Type fixe pour les textes

  // Contenu
  text: string;            // Contenu du texte avec sauts de ligne (\n)

  // Position (en pourcentage du canvas, 0-1)
  x: number;               // Position X (ex: 0.5 = 50% du canvas)
  y: number;               // Position Y (ex: 0.5 = 50% du canvas)

  // Dimensions (en pixels)
  width: number;           // Largeur de la boîte de texte
  height: number;          // Hauteur de la boîte de texte

  // Transformation
  rotation: number;        // Rotation en degrés (0-360)
  scale?: number;          // Échelle (1 = 100%, 2 = 200%) - OPTIONNEL
  zIndex: number;          // Ordre d'empilement

  // Style du texte
  fontSize: number;        // Taille de police en pixels (ex: 24)
  fontFamily: string;      // Police (ex: "Arial", "Roboto", etc.)
  color: string;           // Couleur hex (ex: "#000000")

  // Formatage
  fontWeight?: string;     // "normal", "bold", "100"-"900" - OPTIONNEL
  fontStyle?: string;      // "normal", "italic" - OPTIONNEL
  textDecoration?: string; // "none", "underline", "line-through" - OPTIONNEL
  textAlign?: string;      // "left", "center", "right" - OPTIONNEL

  // Métadonnées
  locked?: boolean;        // Élément verrouillé - OPTIONNEL
  visible?: boolean;       // Élément visible - OPTIONNEL

  // Propriétés héritées du système existant
  baseFontSize?: number;   // Taille de police de base
  baseWidth?: number;      // Largeur de base pour calculer le ratio
  curve?: number;          // Courbure du texte (-355 à 355, 0 = pas de courbure)
}

export interface ImageElement {
  id: string;
  type: 'image';
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  scale?: number;
  naturalWidth?: number;
  naturalHeight?: number;
  designId?: number;
  designPrice?: number;
  designName?: string;
  vendorId?: number;
  vendorName?: string;
  vendorShopName?: string;
  vendorCommissionRate?: number;
  locked?: boolean;
  visible?: boolean;
}

export type DesignElement = TextElement | ImageElement;

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Font weights valides
export const FONT_WEIGHTS = [
  'normal', 'bold',
  '100', '200', '300', '400', '500', '600', '700', '800', '900'
] as const;

export type FontWeight = typeof FONT_WEIGHTS[number];

// Font styles valides
export const FONT_STYLES = ['normal', 'italic'] as const;
export type FontStyle = typeof FONT_STYLES[number];

// Text decorations valides
export const TEXT_DECORATIONS = ['none', 'underline', 'line-through'] as const;
export type TextDecoration = typeof TEXT_DECORATIONS[number];

// Text aligns valides
export const TEXT_ALIGNS = ['left', 'center', 'right'] as const;
export type TextAlign = typeof TEXT_ALIGNS[number];

// Polices courantes
export const FONT_FAMILIES = [
  'Roboto',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  '"Times New Roman", serif',
  'Georgia, serif',
  '"Courier New", monospace',
  'Verdana, sans-serif',
  '"Open Sans", sans-serif',
  'Montserrat, sans-serif',
  'Oswald, sans-serif',
  '"Comic Sans MS", cursive',
  'Impact, fantasy',
  '"Trebuchet MS", sans-serif'
] as const;

// Valeurs par défaut pour un nouvel élément texte
export const DEFAULT_TEXT_ELEMENT: Omit<TextElement, 'id' | 'text'> = {
  type: 'text',
  x: 0.5,
  y: 0.5,
  width: 300,
  height: 80,
  rotation: 0,
  scale: 1,
  zIndex: 1,
  fontSize: 24,
  baseFontSize: 24,
  baseWidth: 300,
  fontFamily: 'Arial, sans-serif',
  color: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'center',
  curve: 0,
  locked: false,
  visible: true
};

// Limites de validation
export const TEXT_ELEMENT_LIMITS = {
  MIN_WIDTH: 10,
  MAX_WIDTH: 2000,
  MIN_HEIGHT: 10,
  MAX_HEIGHT: 2000,
  MIN_FONT_SIZE: 1,
  MAX_FONT_SIZE: 200,
  MIN_SCALE: 0.1,
  MAX_SCALE: 10,
  MIN_ROTATION: 0,
  MAX_ROTATION: 360,
  MAX_TEXT_LENGTH: 1000,
  MIN_TEXT_LENGTH: 1
} as const;

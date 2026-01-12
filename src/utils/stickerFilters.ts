/**
 * Utilitaires pour les filtres de stickers
 *
 * IMPORTANT: Ces constantes doivent correspondre EXACTEMENT aux valeurs
 * utilisées dans le backend (src/sticker/services/sticker-generator.service.ts)
 *
 * Backend: Sharp | Frontend: CSS
 * ----------------------------
 * - Bordure blanche (10px autocollant, 25px pare-chocs)
 * - 16+ layers de contour blanc
 * - 4 layers de définition gris foncé
 * - 3 ombres portées (2px 3px 5px, 1px 2px 3px, 0px 1px 2px)
 * - Effet glossy (brightness +15%, saturation +10%, contrast +10%)
 */

export type StickerType = 'autocollant' | 'pare-chocs';
export type BorderColor = 'transparent' | 'white' | 'glossy-white' | 'matte-white';

/**
 * Configuration des bordures par type de sticker
 * Ces valeurs doivent correspondre au backend
 */
export const STICKER_CONFIG = {
  autocollant: {
    borderWidth: 10, // pixels - correspond à 10 layers de drop-shadow CSS
    shadowOffsets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    darkBorderWidth: 0.3, // pixels - contour gris foncé fin
    shadows: [
      { x: 2, y: 3, blur: 5, alpha: 0.3 },
      { x: 1, y: 2, blur: 3, alpha: 0.25 },
      { x: 0, y: 1, blur: 2, alpha: 0.2 }
    ]
  },
  'pare-chocs': {
    borderWidth: 25, // pixels
    shadowOffsets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    darkBorderWidth: 0.3,
    shadows: []
  }
} as const;

/**
 * Configuration des effets par couleur de bordure
 */
export const BORDER_COLOR_CONFIG = {
  'transparent': {
    white: false,
    darkBorder: false,
    glossy: false,
    brightness: 1.0,
    saturation: 1.0,
    contrast: 1.0
  },
  'white': {
    white: true,
    darkBorder: true,
    glossy: false,
    brightness: 1.02,
    saturation: 1.1,
    contrast: 1.05
  },
  'glossy-white': {
    white: true,
    darkBorder: true,
    glossy: true,
    brightness: 1.15,
    saturation: 1.1,
    contrast: 1.1
  },
  'matte-white': {
    white: true,
    darkBorder: false,
    glossy: false,
    brightness: 1.0,
    saturation: 1.0,
    contrast: 1.0
  }
} as const;

/**
 * Génère les filtres CSS pour un sticker
 * @param stickerType - Type de sticker
 * @param borderColor - Couleur de la bordure
 * @returns Chaîne de filtres CSS
 */
export function generateStickerFilters(
  stickerType: StickerType,
  borderColor: BorderColor = 'glossy-white'
): string {
  const config = STICKER_CONFIG[stickerType];
  const colorConfig = BORDER_COLOR_CONFIG[borderColor];
  const filters: string[] = [];

  if (stickerType === 'autocollant' && colorConfig.white) {
    const borderColorValue = 'white';

    // Contour blanc épais (16 layers pour reproduire le bord Sharp de 10px)
    for (let i = 1; i <= 16; i++) {
      filters.push(
        `drop-shadow(${i}px 0 0 ${borderColorValue})`,
        `drop-shadow(-${i}px 0 0 ${borderColorValue})`,
        `drop-shadow(0 ${i}px 0 ${borderColorValue})`,
        `drop-shadow(0 -${i}px 0 ${borderColorValue})`
      );
    }

    // Contour gris foncé interne TRÈS FIN (4 layers)
    if (colorConfig.darkBorder) {
      filters.push(
        'drop-shadow(0.3px 0 0 rgba(50, 50, 50, 0.7))',
        'drop-shadow(-0.3px 0 0 rgba(50, 50, 50, 0.7))',
        'drop-shadow(0 0.3px 0 rgba(50, 50, 50, 0.7))',
        'drop-shadow(0 -0.3px 0 rgba(50, 50, 50, 0.7))'
      );
    }
  }

  if (stickerType === 'autocollant') {
    // Ombres portées pour effet 3D (3 couches)
    filters.push(
      'drop-shadow(2px 3px 5px rgba(0, 0, 0, 0.3))',
      'drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.25))',
      'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2))'
    );
  }

  // Effet brillant pour glossy-white
  if (colorConfig.glossy) {
    filters.push(
      'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))',
      'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
      'drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))'
    );
  }

  // Ajustements de luminosité, saturation et contraste
  if (colorConfig.brightness !== 1.0) {
    filters.push(`brightness(${colorConfig.brightness})`);
  }
  if (colorConfig.contrast !== 1.0) {
    filters.push(`contrast(${colorConfig.contrast})`);
  }
  if (colorConfig.saturation !== 1.0) {
    filters.push(`saturate(${colorConfig.saturation})`);
  }

  return filters.join(' ');
}

/**
 * Génère le style inline pour un sticker
 */
export function getStickerStyle(
  stickerType: StickerType,
  borderColor: BorderColor = 'glossy-white'
): React.CSSProperties {
  return {
    filter: generateStickerFilters(stickerType, borderColor),
    display: 'block'
  };
}

/**
 * Parse une taille de sticker (ex: "83 mm x 100 mm") et retourne les dimensions
 */
export function parseStickerSize(sizeString: string): { width: number; height: number; unit: string } {
  const match = sizeString.match(/(\d+)\s*(mm|cm|x)\s*(\d+)\s*(mm|cm)?/i);
  if (!match) {
    return { width: 83, height: 100, unit: 'mm' };
  }

  const width = parseInt(match[1]);
  const height = parseInt(match[3]);
  const unit = match[4] || match[2] || 'mm';

  return { width, height, unit: unit.toLowerCase() as 'mm' | 'cm' };
}

/**
 * Calcule les dimensions de la grille pour un sticker
 */
export function getGridDimensions(sizeString: string, gridSize: number = 10) {
  const { width, height } = parseStickerSize(sizeString);

  // Convertir en mm si nécessaire
  const widthMm = width; // Supposons que l'unité est déjà en mm
  const heightMm = height;

  const cellsX = Math.ceil(widthMm / gridSize);
  const cellsY = Math.ceil(heightMm / gridSize);

  return { cellsX, cellsY, gridSize };
}

/**
 * Configuration des bordures disponibles pour l'UI
 */
export const BORDER_OPTIONS: Array<{
  value: BorderColor;
  label: string;
  description: string;
  preview: string;
}> = [
  {
    value: 'glossy-white',
    label: 'Bordure blanche brillante',
    description: 'Effet brillant avec bordures blanches épaisses',
    preview: '#FFFFFF'
  },
  {
    value: 'white',
    label: 'Bordure blanche',
    description: 'Bordures blanches standard sans brillance',
    preview: '#FFFFFF'
  },
  {
    value: 'matte-white',
    label: 'Blanc mat',
    description: 'Bordures blanches mate, sans effet glossy',
    preview: '#FAFAFA'
  },
  {
    value: 'transparent',
    label: 'Sans bordure',
    description: 'Aucune bordure visible',
    preview: 'transparent'
  }
];

/**
 * Configuration des types de stickers disponibles
 */
export const STICKER_TYPE_OPTIONS: Array<{
  value: StickerType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'autocollant',
    label: 'Autocollant',
    description: 'Avec contours découpés et bordure personnalisable',
    icon: 'sticker'
  },
  {
    value: 'pare-chocs',
    label: 'Pare-chocs',
    description: 'Format rectangulaire avec bordure blanche large',
    icon: 'flag'
  }
];

/**
 * Tailles de stickers disponibles par type
 */
export const STICKER_SIZES: Record<StickerType, string[]> = {
  autocollant: [
    '83 mm x 100 mm',
    '100 mm x 120 mm',
    '120 mm x 144 mm',
    '150 mm x 180 mm'
  ],
  'pare-chocs': [
    '100 mm x 300 mm',
    '120 mm x 360 mm',
    '150 mm x 450 mm'
  ]
};

export default {
  generateStickerFilters,
  getStickerStyle,
  parseStickerSize,
  getGridDimensions,
  BORDER_OPTIONS,
  STICKER_TYPE_OPTIONS,
  STICKER_SIZES,
  STICKER_CONFIG,
  BORDER_COLOR_CONFIG
};

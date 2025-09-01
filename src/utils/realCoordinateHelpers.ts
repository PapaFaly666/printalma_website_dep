import { Delimitation } from '../types/product';

/**
 * Utility functions for working with real image coordinates
 * These functions help you work with pixel-perfect positioning on images
 */

export interface RealDesignPlacement {
  centerX: number;
  centerY: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DesignDimensions {
  width: number;
  height: number;
}

/**
 * Calculate the center position of a delimitation in real image coordinates
 * @param delimitation - The delimitation with real coordinates
 * @returns The center point coordinates
 */
export function getDelimitationCenter(delimitation: Delimitation): { x: number; y: number } {
  return {
    x: delimitation.x + (delimitation.width / 2),
    y: delimitation.y + (delimitation.height / 2)
  };
}

/**
 * Calculate the optimal position to center a design within a delimitation
 * @param delimitation - The delimitation zone (in real image coordinates)
 * @param designDimensions - The dimensions of the design to place
 * @returns The position and boundaries for the centered design
 */
export function calculateCenteredDesignPosition(
  delimitation: Delimitation, 
  designDimensions: DesignDimensions
): RealDesignPlacement {
  const center = getDelimitationCenter(delimitation);
  
  const left = center.x - (designDimensions.width / 2);
  const top = center.y - (designDimensions.height / 2);
  const right = left + designDimensions.width;
  const bottom = top + designDimensions.height;

  return {
    centerX: center.x,
    centerY: center.y,
    left,
    top,
    right,
    bottom
  };
}

/**
 * Check if a design fits within a delimitation zone
 * @param delimitation - The delimitation zone
 * @param designDimensions - The design dimensions
 * @param padding - Optional padding around the design (default: 0)
 * @returns Whether the design fits within the zone
 */
export function doesDesignFitInDelimitation(
  delimitation: Delimitation,
  designDimensions: DesignDimensions,
  padding: number = 0
): boolean {
  const requiredWidth = designDimensions.width + (padding * 2);
  const requiredHeight = designDimensions.height + (padding * 2);
  
  return delimitation.width >= requiredWidth && delimitation.height >= requiredHeight;
}

/**
 * Calculate the optimal scale factor to fit a design within a delimitation
 * @param delimitation - The delimitation zone
 * @param designDimensions - The original design dimensions
 * @param padding - Optional padding (default: 10% of delimitation size)
 * @returns The scale factor to apply (1.0 = original size)
 */
export function calculateOptimalScale(
  delimitation: Delimitation,
  designDimensions: DesignDimensions,
  padding?: number
): number {
  const defaultPadding = Math.min(delimitation.width, delimitation.height) * 0.1;
  const actualPadding = padding ?? defaultPadding;
  
  const availableWidth = delimitation.width - (actualPadding * 2);
  const availableHeight = delimitation.height - (actualPadding * 2);
  
  const scaleX = availableWidth / designDimensions.width;
  const scaleY = availableHeight / designDimensions.height;
  
  return Math.min(scaleX, scaleY);
}

/**
 * Calculate scaled design dimensions that fit within a delimitation
 * @param delimitation - The delimitation zone
 * @param designDimensions - The original design dimensions
 * @param padding - Optional padding
 * @returns The scaled dimensions
 */
export function calculateScaledDesignDimensions(
  delimitation: Delimitation,
  designDimensions: DesignDimensions,
  padding?: number
): DesignDimensions {
  const scale = calculateOptimalScale(delimitation, designDimensions, padding);
  
  return {
    width: designDimensions.width * scale,
    height: designDimensions.height * scale
  };
}

/**
 * Convert percentage coordinates to real pixel coordinates
 * @param percentageCoords - Coordinates as percentages (0-100)
 * @param imageDimensions - The real image dimensions
 * @returns Real pixel coordinates
 */
export function percentageToRealCoordinates(
  percentageCoords: { x: number; y: number; width: number; height: number },
  imageDimensions: ImageDimensions
): Delimitation {
  return {
    id: `converted_${Date.now()}`,
    x: (percentageCoords.x / 100) * imageDimensions.width,
    y: (percentageCoords.y / 100) * imageDimensions.height,
    width: (percentageCoords.width / 100) * imageDimensions.width,
    height: (percentageCoords.height / 100) * imageDimensions.height,
    type: 'rectangle'
  };
}

/**
 * Convert real pixel coordinates to percentage coordinates
 * @param delimitation - The delimitation with real coordinates
 * @param imageDimensions - The real image dimensions
 * @returns Percentage coordinates (0-100)
 */
export function realToPercentageCoordinates(
  delimitation: Delimitation,
  imageDimensions: ImageDimensions
): { x: number; y: number; width: number; height: number } {
  return {
    x: (delimitation.x / imageDimensions.width) * 100,
    y: (delimitation.y / imageDimensions.height) * 100,
    width: (delimitation.width / imageDimensions.width) * 100,
    height: (delimitation.height / imageDimensions.height) * 100
  };
}

/**
 * Create a CSS transform string for positioning a design
 * @param placement - The calculated design placement
 * @returns CSS transform string
 */
export function createCSSTransform(placement: RealDesignPlacement): string {
  return `translate(${placement.left}px, ${placement.top}px)`;
}

/**
 * Generate a complete design placement configuration for rendering
 * @param delimitation - The delimitation zone
 * @param designDimensions - The design dimensions
 * @param options - Additional options
 * @returns Complete placement configuration
 */
export function generateDesignPlacementConfig(
  delimitation: Delimitation,
  designDimensions: DesignDimensions,
  options: {
    autoScale?: boolean;
    padding?: number;
    maintainAspectRatio?: boolean;
  } = {}
) {
  const { autoScale = true, padding, maintainAspectRatio = true } = options;
  
  let finalDimensions = designDimensions;
  
  if (autoScale) {
    const fitsWithoutScaling = doesDesignFitInDelimitation(delimitation, designDimensions, padding);
    
    if (!fitsWithoutScaling) {
      finalDimensions = calculateScaledDesignDimensions(delimitation, designDimensions, padding);
    }
  }
  
  const placement = calculateCenteredDesignPosition(delimitation, finalDimensions);
  const scale = autoScale ? calculateOptimalScale(delimitation, designDimensions, padding) : 1;
  
  return {
    placement,
    finalDimensions,
    scale,
    originalDimensions: designDimensions,
    delimitation,
    cssTransform: createCSSTransform(placement),
    fitsWithoutScaling: doesDesignFitInDelimitation(delimitation, designDimensions, padding)
  };
}

/**
 * Validate if coordinates are within image bounds
 * @param delimitation - The delimitation to validate
 * @param imageDimensions - The image dimensions
 * @returns Validation result with details
 */
export function validateDelimitationBounds(
  delimitation: Delimitation,
  imageDimensions: ImageDimensions
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check if delimitation is completely within image bounds
  if (delimitation.x < 0) {
    errors.push(`Position X négative: ${delimitation.x.toFixed(0)}px`);
  }
  if (delimitation.y < 0) {
    errors.push(`Position Y négative: ${delimitation.y.toFixed(0)}px`);
  }
  if (delimitation.x + delimitation.width > imageDimensions.width) {
    errors.push(`Déborde à droite: ${(delimitation.x + delimitation.width - imageDimensions.width).toFixed(0)}px`);
  }
  if (delimitation.y + delimitation.height > imageDimensions.height) {
    errors.push(`Déborde en bas: ${(delimitation.y + delimitation.height - imageDimensions.height).toFixed(0)}px`);
  }

  // Check for very small delimitations
  if (delimitation.width < 10 || delimitation.height < 10) {
    warnings.push(`Zone très petite: ${delimitation.width.toFixed(0)}×${delimitation.height.toFixed(0)}px`);
    suggestions.push('Augmentez la taille pour une meilleure visibilité du design');
  }

  // Check for very large delimitations (> 50% of image)
  const area = delimitation.width * delimitation.height;
  const imageArea = imageDimensions.width * imageDimensions.height;
  const percentage = (area / imageArea) * 100;
  
  if (percentage > 50) {
    warnings.push(`Zone très grande: ${percentage.toFixed(1)}% de l'image`);
    suggestions.push('Réduisez la taille pour laisser plus d\'espace autour du design');
  }

  // Check aspect ratio extremes
  const aspectRatio = delimitation.width / delimitation.height;
  if (aspectRatio > 5 || aspectRatio < 0.2) {
    warnings.push(`Ratio d'aspect extrême: ${aspectRatio.toFixed(2)}`);
    suggestions.push('Un ratio plus équilibré donnera de meilleurs résultats');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Calculate the recommended design sizes for common use cases
 * @param delimitation - The delimitation zone
 * @returns Recommended sizes for different design types
 */
export function getRecommendedDesignSizes(delimitation: Delimitation): {
  logo: DesignDimensions;
  text: DesignDimensions;
  icon: DesignDimensions;
  fullArea: DesignDimensions;
} {
  const padding = Math.min(delimitation.width, delimitation.height) * 0.1;
  
  return {
    logo: {
      width: (delimitation.width - padding * 2) * 0.7,
      height: (delimitation.height - padding * 2) * 0.7
    },
    text: {
      width: (delimitation.width - padding * 2) * 0.9,
      height: (delimitation.height - padding * 2) * 0.3
    },
    icon: {
      width: Math.min(delimitation.width, delimitation.height) * 0.6,
      height: Math.min(delimitation.width, delimitation.height) * 0.6
    },
    fullArea: {
      width: delimitation.width - padding * 2,
      height: delimitation.height - padding * 2
    }
  };
}

/**
 * Generate responsive design configurations for different screen sizes
 * @param delimitation - The base delimitation
 * @param designDimensions - The design dimensions
 * @returns Configurations for different breakpoints
 */
export function generateResponsiveConfigurations(
  delimitation: Delimitation,
  designDimensions: DesignDimensions
): {
  mobile: any;
  tablet: any;
  desktop: any;
} {
  const baseConfig = generateDesignPlacementConfig(delimitation, designDimensions);
  
  return {
    mobile: {
      ...baseConfig,
      scale: baseConfig.scale * 0.8, // Slightly smaller on mobile
      padding: Math.max(10, delimitation.width * 0.05)
    },
    tablet: {
      ...baseConfig,
      scale: baseConfig.scale * 0.9,
      padding: Math.max(15, delimitation.width * 0.08)
    },
    desktop: baseConfig
  };
}

/**
 * Calculate visual feedback for UI display
 * @param delimitation - The delimitation
 * @param imageDimensions - The image dimensions
 * @returns Visual feedback information
 */
export function calculateVisualFeedback(
  delimitation: Delimitation,
  imageDimensions: ImageDimensions
): {
  status: 'excellent' | 'good' | 'warning' | 'error';
  color: string;
  message: string;
  score: number; // 0-100
} {
  const validation = validateDelimitationBounds(delimitation, imageDimensions);
  
  if (!validation.isValid) {
    return {
      status: 'error',
      color: '#ef4444',
      message: `Erreur: ${validation.errors[0]}`,
      score: 0
    };
  }

  let score = 100;
  let status: 'excellent' | 'good' | 'warning' | 'error' = 'excellent';
  let message = 'Zone parfaite pour la personnalisation';
  let color = '#10b981';

  // Deduct points for warnings
  if (validation.warnings.length > 0) {
    score -= validation.warnings.length * 20;
    status = validation.warnings.length > 1 ? 'warning' : 'good';
    message = validation.warnings[0];
    color = validation.warnings.length > 1 ? '#f59e0b' : '#3b82f6';
  }

  // Check optimal size range (10-40% of image)
  const area = delimitation.width * delimitation.height;
  const imageArea = imageDimensions.width * imageDimensions.height;
  const percentage = (area / imageArea) * 100;
  
  if (percentage < 5) {
    score -= 30;
    status = 'warning';
    message = 'Zone trop petite - augmentez la taille';
    color = '#f59e0b';
  } else if (percentage > 60) {
    score -= 20;
    status = 'warning';
    message = 'Zone très grande - réduisez pour plus d\'équilibre';
    color = '#f59e0b';
  } else if (percentage >= 15 && percentage <= 35) {
    // Optimal range
    message = `Zone idéale (${percentage.toFixed(1)}% de l'image)`;
  }

  return {
    status,
    color,
    message,
    score: Math.max(0, score)
  };
}

// Example usage documentation
export const USAGE_EXAMPLES = {
  basicCentering: `
// Basic design centering
const delimitation = { x: 100, y: 100, width: 300, height: 200 };
const design = { width: 150, height: 100 };
const placement = calculateCenteredDesignPosition(delimitation, design);
// Result: design centered at (175, 150)
`,
  
  autoScaling: `
// Auto-scaling for oversized designs
const config = generateDesignPlacementConfig(delimitation, design, {
  autoScale: true,
  padding: 20
});
// Automatically scales and centers the design
`,
  
  productionRendering: `
// Production rendering example
const canvas = new OffscreenCanvas(imageWidth, imageHeight);
const ctx = canvas.getContext('2d');
ctx.drawImage(designImg, placement.left, placement.top, 
               finalDimensions.width, finalDimensions.height);
`
}; 
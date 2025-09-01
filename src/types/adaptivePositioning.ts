// Types pour le système de positionnement adaptatif des designs

export interface DesignPositioning {
  x: number;          // Position X en pourcentage (0-100)
  y: number;          // Position Y en pourcentage (0-100)
  width: number;      // Largeur en pourcentage (5-80)
  height: number;     // Hauteur en pourcentage (5-80)
  rotation: number;   // Rotation en degrés (-180 à +180)
}

export interface PositioningPresets {
  [presetName: string]: DesignPositioning;
}

export interface AdaptivePositioningData {
  positioning: DesignPositioning;
  productType: string;
  description: string;
  presets: PositioningPresets;
}

export interface AdaptivePositioningResponse {
  success: boolean;
  data: AdaptivePositioningData;
  message: string;
}

export interface SavePositioningRequest {
  designUrl: string;
  positioning: DesignPositioning;
}

export interface SavePositioningResponse {
  success: boolean;
  message: string;
  data?: {
    id?: number;
    savedAt?: string;
  };
}

export interface PresetsResponse {
  success: boolean;
  data: {
    presets: PositioningPresets;
    productType: string;
  };
  message: string;
}

// Types pour les produits supportés
export type ProductType = 
  | 'tshirt' 
  | 'mug' 
  | 'cap' 
  | 'hoodie' 
  | 'poster' 
  | 'bag' 
  | 'phone-case'
  | 'default';

// Configuration des produits par type
export interface ProductTypeConfig {
  type: ProductType;
  name: string;
  description: string;
  defaultPositioning: DesignPositioning;
  presets: PositioningPresets;
  constraints?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    allowRotation?: boolean;
  };
}

// Preset prédéfini
export interface PresetDefinition {
  name: string;
  label: string;
  icon: string;
  description: string;
  positioning: DesignPositioning;
}

// État du hook useAdaptivePositioning
export interface AdaptivePositioningState {
  positioning: DesignPositioning | null;
  productType: string;
  description: string;
  presets: PositioningPresets;
  loading: boolean;
  error: string | null;
}

// Actions du hook
export interface AdaptivePositioningActions {
  saveCustomPositioning: (positioning: DesignPositioning) => Promise<boolean>;
  applyPreset: (presetName: string) => Promise<boolean>;
  loadPresets: () => Promise<void>;
  resetToDefault: () => void;
}

// Props du composant AdaptiveDesignPositioner
export interface AdaptiveDesignPositionerProps {
  productId: number;
  designUrl: string;
  onPositionChange?: (position: DesignPositioning) => void;
  className?: string;
  showPreview?: boolean;
  initialPosition?: DesignPositioning;
  disabled?: boolean;
  presetFilter?: string[];
}

// Événements de positionnement
export interface PositioningEvent {
  type: 'position_changed' | 'preset_applied' | 'position_saved' | 'position_reset';
  data: {
    productId: number;
    designUrl: string;
    position: DesignPositioning;
    timestamp: string;
    source?: 'manual' | 'preset' | 'api';
  };
}

// Configuration globale du système
export interface AdaptivePositioningConfig {
  apiBaseUrl: string;
  enableAutoSave: boolean;
  autoSaveDelay: number; // en millisecondes
  enablePreview: boolean;
  defaultProductType: ProductType;
  supportedProductTypes: ProductType[];
  constraints: {
    position: {
      min: number;  // 0
      max: number;  // 100
    };
    size: {
      min: number;  // 5
      max: number;  // 80
    };
    rotation: {
      min: number;  // -180
      max: number;  // 180
    };
  };
}

// Erreurs spécifiques au positionnement
export class PositioningError extends Error {
  constructor(
    message: string,
    public code: string,
    public productId?: number,
    public designUrl?: string
  ) {
    super(message);
    this.name = 'PositioningError';
  }
}

// Codes d'erreur
export enum PositioningErrorCode {
  INVALID_PRODUCT_ID = 'INVALID_PRODUCT_ID',
  INVALID_DESIGN_URL = 'INVALID_DESIGN_URL',
  POSITION_OUT_OF_BOUNDS = 'POSITION_OUT_OF_BOUNDS',
  PRESET_NOT_FOUND = 'PRESET_NOT_FOUND',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// Utilitaires de validation
export interface PositioningValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Historique des positions
export interface PositioningHistory {
  id: string;
  productId: number;
  designUrl: string;
  position: DesignPositioning;
  timestamp: string;
  action: 'manual' | 'preset' | 'auto';
  presetName?: string;
}

// Métadonnées de positionnement
export interface PositioningMetadata {
  productId: number;
  productType: ProductType;
  designUrl: string;
  designDimensions?: {
    width: number;
    height: number;
  };
  lastModified: string;
  version: number;
  isCustom: boolean;
}

// Export de tous les types par défaut
export type {
  DesignPositioning as Position,
  AdaptivePositioningData as PositioningData,
  AdaptivePositioningResponse as ApiResponse,
  AdaptivePositioningState as HookState,
  AdaptivePositioningActions as HookActions
};

// Constantes utiles
export const DEFAULT_POSITIONING: DesignPositioning = {
  x: 50,
  y: 50,
  width: 30,
  height: 30,
  rotation: 0
};

export const PRODUCT_TYPE_CONFIGS: Record<ProductType, Omit<ProductTypeConfig, 'type'>> = {
  tshirt: {
    name: 'T-shirt',
    description: 'Position poitrine optimisée',
    defaultPositioning: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
    presets: {
      center: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
      chest: { x: 50, y: 30, width: 25, height: 30, rotation: 0 },
      lower: { x: 50, y: 55, width: 25, height: 30, rotation: 0 },
      small: { x: 50, y: 35, width: 15, height: 20, rotation: 0 },
      large: { x: 50, y: 35, width: 35, height: 40, rotation: 0 }
    }
  },
  mug: {
    name: 'Mug',
    description: 'Position centrale horizontale',
    defaultPositioning: { x: 50, y: 50, width: 40, height: 25, rotation: 0 },
    presets: {
      center: { x: 50, y: 50, width: 40, height: 25, rotation: 0 },
      small: { x: 50, y: 50, width: 25, height: 15, rotation: 0 },
      large: { x: 50, y: 50, width: 55, height: 35, rotation: 0 },
      upper: { x: 50, y: 35, width: 40, height: 25, rotation: 0 },
      lower: { x: 50, y: 65, width: 40, height: 25, rotation: 0 }
    }
  },
  cap: {
    name: 'Casquette',
    description: 'Position frontale optimisée',
    defaultPositioning: { x: 50, y: 40, width: 30, height: 20, rotation: 0 },
    presets: {
      center: { x: 50, y: 40, width: 30, height: 20, rotation: 0 },
      front: { x: 50, y: 35, width: 30, height: 20, rotation: 0 },
      small: { x: 50, y: 40, width: 20, height: 15, rotation: 0 },
      large: { x: 50, y: 40, width: 40, height: 25, rotation: 0 }
    }
  },
  hoodie: {
    name: 'Hoodie',
    description: 'Position poitrine large',
    defaultPositioning: { x: 50, y: 30, width: 28, height: 35, rotation: 0 },
    presets: {
      center: { x: 50, y: 30, width: 28, height: 35, rotation: 0 },
      chest: { x: 50, y: 25, width: 28, height: 35, rotation: 0 },
      lower: { x: 50, y: 45, width: 28, height: 35, rotation: 0 },
      small: { x: 50, y: 30, width: 18, height: 25, rotation: 0 },
      large: { x: 50, y: 30, width: 38, height: 45, rotation: 0 }
    }
  },
  poster: {
    name: 'Poster',
    description: 'Design pleine surface',
    defaultPositioning: { x: 50, y: 50, width: 80, height: 80, rotation: 0 },
    presets: {
      center: { x: 50, y: 50, width: 80, height: 80, rotation: 0 },
      small: { x: 50, y: 50, width: 60, height: 60, rotation: 0 },
      large: { x: 50, y: 50, width: 90, height: 90, rotation: 0 }
    }
  },
  bag: {
    name: 'Sac',
    description: 'Position centrale avant',
    defaultPositioning: { x: 50, y: 45, width: 35, height: 35, rotation: 0 },
    presets: {
      center: { x: 50, y: 45, width: 35, height: 35, rotation: 0 },
      upper: { x: 50, y: 35, width: 35, height: 35, rotation: 0 },
      small: { x: 50, y: 45, width: 25, height: 25, rotation: 0 },
      large: { x: 50, y: 45, width: 45, height: 45, rotation: 0 }
    }
  },
  'phone-case': {
    name: 'Coque de téléphone',
    description: 'Design adapté à l\'écran',
    defaultPositioning: { x: 50, y: 50, width: 70, height: 70, rotation: 0 },
    presets: {
      center: { x: 50, y: 50, width: 70, height: 70, rotation: 0 },
      upper: { x: 50, y: 35, width: 70, height: 50, rotation: 0 },
      lower: { x: 50, y: 65, width: 70, height: 50, rotation: 0 },
      small: { x: 50, y: 50, width: 50, height: 50, rotation: 0 }
    }
  },
  default: {
    name: 'Produit générique',
    description: 'Position standard',
    defaultPositioning: DEFAULT_POSITIONING,
    presets: {
      center: { x: 50, y: 50, width: 30, height: 30, rotation: 0 },
      small: { x: 50, y: 50, width: 20, height: 20, rotation: 0 },
      large: { x: 50, y: 50, width: 40, height: 40, rotation: 0 }
    }
  }
}; 
 
 
 
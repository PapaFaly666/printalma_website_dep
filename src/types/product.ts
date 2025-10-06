export interface ProductFormData {
  id?: number;
  name: string;
  price: number;
  suggestedPrice?: number;
  stock?: number;
  status: 'published' | 'draft';
  description: string;
  categoryId?: number;
  categories: string[];
  sizes: string[];
  colors?: string[]; // Couleurs disponibles (ex: Noir, Blanc)
  designs: string[];
  colorVariations: ColorVariation[];
  hasDesign?: boolean; // Calculé automatiquement par le backend
  designCount?: number; // Nombre total de designs sur le produit
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE'; // Genre cible du produit
  stockBySizeColor?: StockBySizeColor; // Stock par taille et couleur
}

// Structure de stock par taille et couleur
export interface StockBySizeColor {
  [size: string]: {
    [color: string]: number;
  };
}

export interface ColorVariation {
  id: string;
  name: string;
  colorCode: string;
  stock?: { [size: string]: number }; // Stock par taille pour cette couleur
  images: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  file?: File;
  view: 'Front' | 'Back' | 'Left' | 'Right' | 'Top' | 'Bottom' | 'Detail';
  delimitations?: Delimitation[];
  designUrl?: string; // URL du design appliqué sur cette image
  designPublicId?: string; // ID Cloudinary du design
  designFileName?: string; // Nom du fichier design original
  designUploadDate?: string; // Date d'upload du design (ISO string)
}

export interface DesignUploadResponse {
  success: boolean;
  designUrl: string;
  designFileName: string;
  message: string;
}

export interface DesignDeleteResponse {
  success: boolean;
  message: string;
}

export interface DesignStats {
  totalProducts: number;
  productsWithDesign: number;
  blankProducts: number;
  designPercentage: number;
  totalDesigns: number;
  averageDesignsPerProduct: number;
}

export interface BlankProductsResponse {
  success: boolean;
  data: ProductFormData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
}

export interface DesignUploadOptions {
  name?: string;
  replaceExisting?: boolean;
}

export interface ImageView {
  id: string;
  viewType: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'DETAIL' | 'OTHER';
  description: string;
  delimitation?: Delimitation;
}

export interface Delimitation {
  id: string;
  x: number; // Real image coordinates in pixels
  y: number; // Real image coordinates in pixels
  width: number; // Real image dimensions in pixels
  height: number; // Real image dimensions in pixels
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  name?: string;
  type?: 'rectangle' | 'circle' | 'polygon';
  // Debug information for coordinate conversion verification
  _debug?: {
    realImageSize?: {
      width: number;
      height: number;
    };
    canvasCoordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
      scaleX?: number;
      scaleY?: number;
    };
    realCoordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    };
  };
}

export interface CanvasState {
  canvas: any | null;
  delimitation: any | null;
  isDragging: boolean;
  isDrawing: boolean;
}

export interface ProductFormErrors {
  name?: string;
  price?: string;
  suggestedPrice?: string;
  stock?: string;
  description?: string;
  colorVariations?: string;
  images?: string;
  genre?: string;
}

export interface SizeOption {
  id: string;
  name: string;
  label: string;
  category: 'clothing';
} 
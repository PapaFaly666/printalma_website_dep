// Interface pour les délimitations (zones imprimables)
interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  color: string;
  colorCode: string;
  size: string;
  quantity: number;
  imageUrl: string;
  designUrl?: string;
  vendorName?: string;
  // Propriétés nécessaires pour afficher le design
  designId?: number;
  adminProductId?: number;
  designScale?: number;
  delimitations?: DelimitationData[];
  // Propriétés pour les vraies tailles de la base de données
  selectedSize?: {
    id: number;
    sizeName: string;
  };
  sizeId?: number;
  sizeName?: string;
}

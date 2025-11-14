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
  suggestedPrice?: number; // Prix de vente défini par le vendeur
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

  // 🎨 NOUVEAUX CHAMPS POUR LA SAUVEGARDE DU DESIGN DANS LES COMMANDES
  vendorProductId?: number;     // ID du produit vendeur
  mockupUrl?: string;            // URL du mockup avec le design appliqué
  designPositions?: {            // Coordonnées de placement du design
    x: number;
    y: number;
    scale: number;
    rotation: number;
    designWidth?: number;
    designHeight?: number;
  };
  designMetadata?: {             // Métadonnées complètes du design pour l'historique
    designName?: string;
    designCategory?: string;
    designImageUrl?: string;
    appliedAt?: string;
  };
  delimitation?: DelimitationData; // Zone de placement du design sur le produit

  // 🆕 ID de la personnalisation sauvegardée en base de données
  customizationId?: number;      // Lien vers la table customizations
  designElements?: any[];        // Éléments de design (texte, images) pour l'aperçu
}

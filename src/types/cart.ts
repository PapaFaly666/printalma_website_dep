// Interface pour les délimitations (zones imprimables)
interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
  // Champs ajoutés pour supporter les données de référence
  referenceWidth?: number;
  referenceHeight?: number;
  viewType?: string;
  imageUrl?: string;
}

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  suggestedPrice?: number; // Prix de vente défini par le vendeur
  color: string;
  colorCode: string;
  colorVariationId?: number; // 🆕 ID de la variation de couleur sélectionnée
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

  // 🆕 Support pour plusieurs tailles avec la même personnalisation
  selectedSizes?: Array<{
    size: string;
    sizeId?: number;
    quantity: number;
  }>;

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
  customizationId?: number;      // Lien vers la table customizations (premier ID pour compatibilité)
  customizationIds?: Record<string, number>; // 🆕 Tous les IDs de personnalisation par vue (ex: {"1-5": 123, "1-6": 124})
  designElements?: any[];        // @deprecated Utiliser designElementsByView
  designElementsByView?: Record<string, any[]>; // 🆕 Éléments de design organisés par vue (ex: {"1-5": [...], "1-6": [...]})
}

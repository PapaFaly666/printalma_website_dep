export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentMethod = 
  | 'CASH_ON_DELIVERY'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY'
  | 'CREDIT_CARD'
  | 'WAVE'
  | 'wave'
  | 'orange'
  | 'ORANGE';

export interface ShippingAddressObjectDto {
  name?: string;
  firstName?: string;
  lastName?: string;
  street: string;
  address?: string;
  address2?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  fullFormatted: string;
  company?: string;
  apartment?: string;
  phone?: string;
}

export interface UserInOrderDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  photo_profil?: string;
}

export interface ValidatorDto {
  id: number;
  firstName: string;
  lastName: string;
}

export interface ProductViewDto {
  id: number;
  viewType: string;
  imageUrl: string;
  description?: string;
}

export interface ColorInProductDto {
  id: number;
  name: string;
  hexCode?: string;
  imageUrl?: string;
}

export interface SizeInProductDto {
  id: number;
  name: string;
}

export interface ProductInOrderDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  designName?: string;
  designDescription?: string;
  designImageUrl?: string;
  categoryId?: number;
  images?: Array<{
    id?: number;
    url: string;
    viewType?: string;
  }>;
  categoryName?: string;
  orderedColorName?: string;
  orderedColorHexCode?: string;
  orderedColorImageUrl?: string;
}

export interface OrderItemDto {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  size?: string;
  color?: string;
  colorId?: number;
  selectedColor?: ColorInProductDto;
  product?: ProductInOrderDto;
  productId?: number;
  productName?: string;
  productImage?: string;

  // 🎨 DONNÉES DE DESIGN SAUVEGARDÉES (depuis la commande)
  vendorProductId?: number;  // ID du produit vendeur pour récupération fallback
  mockupUrl?: string;
  designId?: number;
  savedDesignPosition?: {  // Renommé pour éviter conflit avec designPositions array ci-dessous
    x: number;
    y: number;
    scale: number;
    rotation: number;
    designWidth?: number;
    designHeight?: number;
    constraints?: {
      maxScale: number;
      minScale: number;
    };
  };
  designMetadata?: {
    designName?: string;
    designCategory?: string;
    designImageUrl?: string;
    appliedAt?: string;
  };
  delimitation?: {
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType: 'PERCENTAGE' | 'PIXEL';
    referenceWidth?: number;
    referenceHeight?: number;
  };

  // 🎨 DONNÉES ENRICHIES DU PRODUIT VENDEUR (enrichedVendorProduct)
  adminProduct?: {
    id: number;
    name: string;
    description?: string;
    price: number;
    colorVariations?: Array<{
      id: number;
      name: string;
      colorCode: string;
      images?: Array<{
        id: number;
        url: string;
        viewType: string;
        delimitations?: any[];
      }>;
    }>;
  };
  designApplication?: {
    hasDesign: boolean;
    designUrl?: string;
    positioning?: string;
    scale?: number;
    mode?: string;
  };
  designDelimitations?: Array<{
    colorName: string;
    colorCode: string;
    imageUrl: string;
    naturalWidth: number;
    naturalHeight: number;
    delimitations: any[];
  }>;
  designPositions?: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
    };
  }>;
  images?: {
    adminReferences?: Array<{
      colorName: string;
      colorCode: string;
      adminImageUrl: string;
      imageType: string;
    }>;
    total?: number;
    primaryImageUrl?: string;
  };
  vendor?: {
    id: number;
    fullName: string;
    shop_name: string;
    profile_photo_url?: string | null;
  };
  colorVariation?: {
    id: number;
    name: string;
    colorCode: string;
    images?: Array<{
      id: number;
      url: string;
      viewType: string;
      delimitations?: any[];
    }>;
  };
  enrichedVendorProduct?: any; // Structure complète enrichie

  // 🎨 DONNÉES DE PERSONNALISATION CLIENT
  customizationId?: number;
  customizationIds?: Record<string, number>; // {"colorId-viewId": customizationId}
  designElementsByView?: Record<string, any[]>; // {"colorId-viewId": [elements]}
  viewsMetadata?: Array<{       // 🆕 Métadonnées des vues pour le backend
    viewKey: string;           // Clé de la vue (format: "colorId-viewId")
    colorId: number;           // ID de la variation de couleur
    viewId: number;            // ID de la vue
    viewType: string;          // Type de vue (FRONT, BACK, etc.)
    imageUrl: string;          // URL de l'image de la vue
    hasElements: boolean;      // Si la vue contient des éléments de design
    elementsCount: number;     // Nombre d'éléments dans la vue
  }>;
  customization?: {
    id: number;
    designElements?: any[];
    elementsByView?: Record<string, any[]>;
    previewImageUrl?: string | null;
    colorVariationId?: number;
    viewId?: number;
    sizeSelections?: Array<{ size: string; quantity: number }>;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    isCustomized?: boolean;
    hasDesignElements?: boolean;
    hasMultiViewDesign?: boolean;
  };
}

export interface DeliveryInfo {
  // 🇸🇳 POUR LE SÉNÉGAL (commandes nationales) - champs optionnels
  // countryCode et countryName sont les seuls champs vraiment nécessaires

  // 🌍 POUR L'INTERNATIONAL (commandes hors Sénégal) - champs obligatoires
  deliveryType?: 'city' | 'region' | 'international'; // Obligatoire pour l'international

  // Localisation (obligatoire selon deliveryType pour l'international)
  cityId?: string;           // si deliveryType = 'city'
  cityName?: string;
  regionId?: string;         // si deliveryType = 'region'
  regionName?: string;
  zoneId?: string;           // si deliveryType = 'international'
  zoneName?: string;

  // Transporteur et tarif (obligatoires uniquement pour l'international)
  transporteurId?: string;   // ID du transporteur (optionnel pour Sénégal)
  transporteurName?: string;
  transporteurLogo?: string;
  zoneTarifId?: string;      // ID du tarif appliqué (optionnel pour Sénégal)
  deliveryFee?: number;      // Frais de livraison en XOF (optionnel pour Sénégal)
  deliveryTime?: string;      // ex: '24-48h'

  // Métadonnées (toujours optionnel)
  countryCode?: string;      // ex: 'SN', 'FR', 'US'
  countryName?: string;
  metadata?: {
    availableCarriers?: any[];
    selectedAt?: string;
    calculationDetails?: any;
    calculatedAt?: string;
  };
  // Métadonnées supplémentaires pour compatibilité
  calculatedAt?: string;

  // Compatibilité avec structure existante (legacy)
  location?: {
    type: 'city' | 'region' | 'international';
    cityId?: number;
    cityName?: string;
    regionId?: number;
    regionName?: string;
    zoneId?: string | null;
    zoneName?: string | null;
    countryCode?: string;
    countryName?: string;
  };
  transporteur?: {
    id: string;
    name: string;
    logo?: string;
    phone?: string | null;
    email?: string | null;
    status?: string;
    description?: string | null;
  };
  tarif?: {
    id: string;
    amount: number;
    currency?: string;
    description?: string | null;
    deliveryTime?: string;
  };
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  user: UserInOrderDto;
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  paymentMethod?: PaymentMethod;
  shippingAddress: ShippingAddressObjectDto;
  billingAddress?: ShippingAddressObjectDto;
  phoneNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // 🆕 Guest customer info (for orders without user account)
  email?: string;                  // Customer email (fallback if user.email not available)
  shippingName?: string;           // Full customer name (firstName + lastName combined)
  shippingStreet?: string;         // Street address
  shippingCity?: string;           // City
  shippingRegion?: string;         // Region/State
  shippingCountry?: string;        // Country
  // Optional timeline fields used in vendor views
  processingAt?: string;
  trackingNumber?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rejectedAt?: string;
  rejectReason?: string;
  validatedAt?: string;
  validatedBy?: number;
  validator?: ValidatorDto;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  orderItems: OrderItemDto[];
  delivery_info?: DeliveryInfo;
}

export interface CreateOrderDto {
  shippingAddress: string;
  phoneNumber: string;
  notes?: string;
  orderItems: {
    productId: number;
    quantity: number;
    size?: string;
    color?: string;
    colorId?: number;
  }[];
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminOrderFilters extends OrderFilters {
  userEmail?: string;
  orderNumber?: string;
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderStatistics {
  totalOrders: number;
  revenue: {
    total: number;
    monthly: number;
  };
  ordersCount: {
    today: number;
    week: number;
    month: number;
  };
  ordersByStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    rejected?: number;
  };
}

export interface BackendOrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue?: number;
  ordersToday: number;
  revenueToday?: number;
  revenueThisMonth?: number;
  ordersThisWeek?: number;
  ordersThisMonth?: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  rejectedOrders?: number;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OrderResponse {
  orders: Order[];
  pagination: OrderPagination;
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedColorId?: number;
  selectedColorObject?: {
    id: number;
    name: string;
    hexCode?: string;
    imageUrl?: string;
  };
  customizations?: Record<string, any>;

  // 🎨 Champs ajoutés pour le support des délimitations et mockups
  size?: string;
  color?: string;
  colorCode?: string;
  imageUrl?: string;
  mockupUrl?: string;
  vendorProductId?: number;
  designId?: number;
  designPositions?: any;
  designMetadata?: any;
  delimitation?: {
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType?: 'PERCENTAGE' | 'PIXEL';
    referenceWidth?: number;
    referenceHeight?: number;
  };
  delimitations?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType?: 'PERCENTAGE' | 'PIXEL';
    referenceWidth?: number;
    referenceHeight?: number;
  }>;
  images?: Array<{
    url?: string;
    adminImageUrl?: string;
  }>;
  suggestedPrice?: number;

  // 🎨 Personnalisations
  customizationId?: number;
  customizationIds?: Record<string, number>;
  designElements?: any[];
  designElementsByView?: Record<string, any[]>;
}

export interface OrderTotals {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  freeShipping: boolean;
} 
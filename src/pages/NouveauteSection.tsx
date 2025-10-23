import React, { useState, useEffect } from "react";
import { SimpleProductPreview } from '../components/vendor/SimpleProductPreview';

// Interface EXACTE selon l'API new-arrivals réelle (swagger.md)
interface NewArrivalProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  salesCount: number;
  totalRevenue: number;
  bestSellerRank: number;
  averageRating: number | null;
  viewsCount: number;
  designCloudinaryUrl: string;
  designWidth: number;
  designHeight: number;
  designFormat: string | null;
  designScale: number;
  designPositioning: string;
  // ✅ CORRECTION : L'API retourne designPositions (pluriel) pas designPosition
  designPositions: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      constraints: {
        minScale: number;
        maxScale: number;
      };
      designWidth: number;
      designHeight: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  baseProduct: {
    id: number;
    name: string;
    genre: string;
    categories: Array<{
      id: number;
      name: string;
    }>;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        view: string;
        naturalWidth: number;
        naturalHeight: number;
        delimitations: Array<{
          id: number;
          name: string | null;
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType: 'PERCENTAGE' | 'PIXEL'; // ✅ L'API retourne coordinateType
        }>;
      }>;
    }>;
  };
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl: string;
    businessName: string;
  };
  createdAt: string;
  lastSaleDate: string | null;
}

// Interface pour les props du ProductCard
interface ProductCardProps {
  item: NewArrivalProduct;
  formatPrice: (price: number) => string;
  showDelimitations?: boolean; // ✅ Option pour afficher les délimitations
}

// Utilitaire pour normaliser les délimitations
const normalizeDelimitations = (delimitations: any[], imageWidth: number, imageHeight: number) => {
  if (!delimitations || delimitations.length === 0) return [];
  
  return delimitations.map(delim => {
    let { x, y, width, height } = delim;
    
    // Conversion pixels → pourcentage si nécessaire
    const seemsToBePixels = x > 100 || y > 100 || width > 100 || height > 100;
    
    if (seemsToBePixels) {
      x = (x / imageWidth) * 100;
      y = (y / imageHeight) * 100;
      width = (width / imageWidth) * 100;
      height = (height / imageHeight) * 100;
    }
    
    // S'assurer que les valeurs sont dans des plages réalistes
    const finalX = Math.max(0, Math.min(95, x));
    const finalY = Math.max(0, Math.min(95, y));
    const finalWidth = Math.max(5, Math.min(100 - finalX, width));
    const finalHeight = Math.max(5, Math.min(100 - finalY, height));
    
    return {
      id: delim.id,
      name: delim.name,
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
      coordinateType: 'PERCENTAGE' as const
    };
  });
};

// Utilitaire pour normaliser les positions de design
const normalizeDesignPosition = (position: any) => {
  const { x, y, scale, rotation, designWidth, designHeight } = position;

  let normalizedX = x;
  let normalizedY = y;

  // Vérifier si les valeurs sont valides
  if (typeof normalizedX !== 'number' || isNaN(normalizedX)) {
    normalizedX = 0;
  }
  if (typeof normalizedY !== 'number' || isNaN(normalizedY)) {
    normalizedY = 0;
  }

  // ✅ CORRECTION : Conserver les positions réelles au lieu de forcer au centre
  // SimpleProductPreview utilise maintenant designPositions/designTransforms/localStorage
  // qui gèrent correctement le positionnement
  console.log('📐 [normalizeDesignPosition] Position conservée:', { x: normalizedX, y: normalizedY, scale });

  // S'assurer que le scale est dans une plage raisonnable
  let normalizedScale = scale || 0.8;
  if (normalizedScale < 0.1) normalizedScale = 0.1;
  if (normalizedScale > 2) normalizedScale = 2;

  const result = {
    x: normalizedX,
    y: normalizedY,
    scale: normalizedScale,
    rotation: rotation || 0,
    constraints: {
      minScale: 0.1,
      maxScale: 2
    },
    designWidth: designWidth || 1200, // Utiliser les dimensions réelles du design
    designHeight: designHeight || 1200
  };

  console.log('📐 [normalizeDesignPosition] Position normalisée:', {
    original: { x, y, scale },
    normalized: result
  });

  return result;
};

// Fonction pour adapter les données de l'API new-arrivals vers le format vendor/products
const adaptNewArrivalToVendorProduct = (item: NewArrivalProduct) => {
  const designPositions = item.designPositions;

  // Vérifier si designPositions existe et a les propriétés nécessaires
  if (!designPositions || designPositions.length === 0) {
    console.warn('⚠️ [adaptNewArrival] Pas de designPositions pour le produit:', item.id);
    return null;
  }

  const firstDesignPos = designPositions[0];

  // Extraire les délimitations de la première image de la première variation de couleur
  const firstImage = item.baseProduct.colorVariations[0]?.images[0];
  const rawDelimitations = firstImage?.delimitations || [];

  console.log('🔍 [adaptNewArrival] Données brutes:', {
    productId: item.id,
    designId: firstDesignPos.designId,
    designUrl: item.designCloudinaryUrl,
    rawDelimitations: rawDelimitations,
    firstImageWidth: firstImage?.naturalWidth,
    firstImageHeight: firstImage?.naturalHeight,
    firstImageView: firstImage?.view
  });

  // Normaliser les délimitations
  const normalizedDelimitations = firstImage
    ? normalizeDelimitations(rawDelimitations, firstImage.naturalWidth, firstImage.naturalHeight)
    : [];

  console.log('📐 [adaptNewArrival] Délimitations normalisées:', normalizedDelimitations);

  // Normaliser la position
  const normalizedPosition = normalizeDesignPosition(firstDesignPos.position);

  console.log('📍 [adaptNewArrival] Position normalisée:', normalizedPosition);
  
  const adaptedProduct = {
    id: item.id,
    vendorName: item.name,
    originalAdminName: item.baseProduct.name,
    price: item.price,
    status: 'PUBLISHED',
    adminValidated: true, // Pour ne pas afficher "Validation en cours"
    hideValidationBadges: true, // Pour cacher les badges de validation
    adminProduct: {
      id: item.baseProduct.id,
      name: item.baseProduct.name,
      colorVariations: item.baseProduct.colorVariations.map(cv => ({
        ...cv,
        images: cv.images.map(img => ({
          ...img,
          viewType: img.view,
          delimitations: normalizeDelimitations(img.delimitations, img.naturalWidth, img.naturalHeight),
          url: img.url // Assurer que l'URL est bien présente
        }))
      }))
    },
    designApplication: {
      hasDesign: !!item.designCloudinaryUrl,
      designUrl: item.designCloudinaryUrl,
      positioning: item.designPositioning || 'CENTER',
      scale: firstDesignPos.position.scale || 0.8,
      mode: 'PRESERVED'
    },
    designPositions: [{
      designId: firstDesignPos.designId,
      position: {
        ...normalizedPosition,
        constraints: normalizedPosition.constraints || {
          minScale: 0.1,
          maxScale: 2
        },
        designWidth: firstDesignPos.position.designWidth || 200,
        designHeight: firstDesignPos.position.designHeight || 200
      },
      createdAt: firstDesignPos.createdAt,
      updatedAt: firstDesignPos.updatedAt
    }],
    designTransforms: [],
    selectedColors: item.baseProduct.colorVariations.map(cv => ({
      id: cv.id,
      name: cv.name,
      colorCode: cv.colorCode
    })),
    designId: firstDesignPos.designId,
    selectedSizes: [], // Les produits nouveautés n'ont pas de tailles spécifiques
    images: {
      adminReferences: item.baseProduct.colorVariations.map(cv => ({
        colorName: cv.name,
        colorCode: cv.colorCode,
        adminImageUrl: cv.images[0]?.url || '',
        imageType: 'admin_reference' as const
      })),
      total: item.baseProduct.colorVariations.length,
      primaryImageUrl: item.baseProduct.colorVariations[0]?.images[0]?.url || ''
    }
  };

  console.log('✅ [adaptNewArrival] Produit adapté:', {
    id: adaptedProduct.id,
    designId: adaptedProduct.designId,
    hasDesign: adaptedProduct.designApplication.hasDesign,
    designUrl: adaptedProduct.designApplication.designUrl,
    firstColorVariation: adaptedProduct.adminProduct.colorVariations[0],
    firstImage: adaptedProduct.adminProduct.colorVariations[0]?.images[0]
  });

  return adaptedProduct;
};

// Composant ProductCard utilisant SimpleProductPreview
const ProductCard: React.FC<ProductCardProps> = ({ item, formatPrice, showDelimitations = false }) => {
  const adaptedProduct = adaptNewArrivalToVendorProduct(item);

  // Si l'adaptation échoue, ne pas afficher le produit
  if (!adaptedProduct) {
    return null;
  }

  // Logs de débogage détaillés pour comprendre pourquoi le design ne s'affiche pas
  const firstColorVariation = adaptedProduct.adminProduct?.colorVariations?.[0];
  const firstImage = firstColorVariation?.images?.find(img => img.viewType === 'Front') || firstColorVariation?.images?.[0];

  console.log('🎨 [ProductCard] Produit adapté pour nouveautés:', {
    id: adaptedProduct.id,
    hasDesign: adaptedProduct.designApplication.hasDesign,
    designUrl: adaptedProduct.designApplication.designUrl,
    designId: adaptedProduct.designId,
    designPositions: adaptedProduct.designPositions,
    designPosition: adaptedProduct.designPositions?.[0]?.position,
    adminProductExists: !!adaptedProduct.adminProduct,
    colorVariations: adaptedProduct.adminProduct?.colorVariations?.length,
    firstColorVariation: {
      id: firstColorVariation?.id,
      name: firstColorVariation?.name,
      imagesCount: firstColorVariation?.images?.length
    },
    firstImage: {
      url: firstImage?.url,
      viewType: firstImage?.viewType,
      hasDelimitations: firstImage?.delimitations?.length > 0,
      delimitations: firstImage?.delimitations
    },
    isTraditionalProduct: !!adaptedProduct.designId && adaptedProduct.designId !== null && adaptedProduct.designId !== 0,
    currentColorId: adaptedProduct.selectedColors?.[0]?.id
  });

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 w-full"
      style={{
        aspectRatio: "4 / 5",
        minHeight: "280px",
        height: "auto"
      }}
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <SimpleProductPreview
          product={adaptedProduct}
          showColorSlider={false}
          showDelimitations={showDelimitations}
          className="w-full h-full"
          onColorChange={() => {}}
          hideValidationBadges={true}
          imageObjectFit="cover"
        />
      </div>

      {/* Overlay texte avec z-index plus élevé mais ne couvrant que le bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 pointer-events-none" style={{ zIndex: 50 }}>
        {item.price && (
          <div className="mb-2">
            <span className="bg-white text-black px-2 py-1 rounded text-sm font-bold shadow-lg">
              {formatPrice(item.price)}{" "}
              <span className="text-xs font-medium text-gray-600">FCFA</span>
            </span>
          </div>
        )}
        <div className="text-white">
          <h3 className="font-bold text-lg leading-tight mb-1 drop-shadow-lg">
            {item.name}
          </h3>
          <p className="text-sm text-gray-200 font-medium mb-1 line-clamp-2 drop-shadow-lg">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

const NouveautesGrid: React.FC = () => {
  const [nouveautesData, setNouveautesData] = useState<NewArrivalProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showDelimitations, setShowDelimitations] = useState<boolean>(false);

  // Fonction pour récupérer les nouveautés depuis l'API
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await fetch('https://printalma-back-dep.onrender.com/public/new-arrivals');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setNouveautesData(result.data);
        } else {
          // Essayer d'adapter si les données sont dans un autre format
          if (Array.isArray(result)) {
            setNouveautesData(result);
          } else if (result.data && Array.isArray(result.data)) {
            setNouveautesData(result.data);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des nouveautés:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  // Fonction pour formater uniquement le nombre
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(price);
  };

  // Navigation functions
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    const maxIndex = Math.max(0, nouveautesData.length - 4);
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Calculer les produits actuellement affichés
  const getCurrentProducts = (): NewArrivalProduct[] => {
    return nouveautesData.slice(currentIndex, currentIndex + 4);
  };

  // Vérifier s'il y a plus de produits
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < nouveautesData.length - 4;

  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 py-1 md:py-2">
        <div className="w-full px-4 sm:px-8">
          <div className="flex justify-between items-center mb-1">
            <div className="h-8 bg-gray-200 rounded w-60 animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="w-full h-64 sm:h-72 lg:h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentProducts = getCurrentProducts();

  // Affichage quand il n'y a pas de données
  if (!isLoading && nouveautesData.length === 0) {
    return (
      <div className="w-full bg-gray-50 py-1 md:py-2">
        <div className="w-full px-4 sm:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="font-bold">Nouveautés</span>
              <img src="/fire.svg" alt="Fire" className="w-6 h-6 md:w-8 md:h-8" />
            </h2>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-yellow-600 mb-2">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune nouveauté disponible
              </h3>
              <p className="text-gray-600 mb-4">
                L'API n'a retourné aucune donnée. Vérifiez que le backend est démarré sur le port 3004.
              </p>
              <p className="text-sm text-gray-500">
                Ouvrez la console pour plus de détails sur l'erreur.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      <div className="w-full px-4 sm:px-8">
        {/* En-tête avec titre uniforme */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="font-bold">Nouveautés</span>
            <img src="/fire.svg" alt="Fire" className="w-6 h-6 md:w-8 md:h-8" />
          </h2>
          
          <div className="flex items-center gap-3">
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Voir toutes les nouveautés
            </button>
          </div>
        </div>

        {/* Container avec navigation latérale */}
        <div className="relative">
          {/* Bouton navigation gauche */}
          {nouveautesData.length > 4 && (
            <button
              onClick={goToPrevious}
              disabled={!canGoLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border-2 flex items-center justify-center transition-all duration-200 ${
                canGoLeft 
                  ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white' 
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
              } -translate-x-6`}
              aria-label="Produits précédents"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Grille de 4 produits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 transition-all duration-300">
            {currentProducts.map((item) => (
              <ProductCard 
                key={item.id} 
                item={item} 
                formatPrice={formatPrice}
                showDelimitations={false}
              />
            )).filter(Boolean)}
          </div>

          {/* Bouton navigation droite */}
          {nouveautesData.length > 4 && (
            <button
              onClick={goToNext}
              disabled={!canGoRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border-2 flex items-center justify-center transition-all duration-200 ${
                canGoRight 
                  ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white' 
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
              } translate-x-6`}
              aria-label="Produits suivants"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Message informatif */}
        {nouveautesData.length <= 4 && (
          <div className="text-center text-gray-500 text-sm mt-4">
            {nouveautesData.length} produit{nouveautesData.length > 1 ? 's' : ''} disponible{nouveautesData.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default NouveautesGrid;
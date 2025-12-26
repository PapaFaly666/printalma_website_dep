import React, { useState, useEffect } from "react";
import SimpleProductPreview from './vendor/SimpleProductPreview';

// Interface EXACTE selon la réponse API best-sellers-v2
interface BestSellerProduct {
  id: number;
  name: string;
  price: number;
  description?: string;
  salesCount?: number;
  totalRevenue?: number;
  viewsCount?: number;
  designCloudinaryUrl?: string;
  designWidth?: number;
  designHeight?: number;
  designScale?: number;
  designFormat?: string;
  designPositioning?: string;
  designPositions?: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      designWidth: number;
      designHeight: number;
      constraints?: {
        minScale: number;
        maxScale: number;
      };
    };
    createdAt?: string;
    updatedAt?: string;
  }>;
  designPosition?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
    designWidth?: number;
    designHeight?: number;
  };
  baseProduct?: {
    id: number;
    name: string;
    genre?: string;
    categories?: any[];
    colorVariations?: Array<{
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
          name?: string;
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType?: string;
        }>;
      }>;
    }>;
  };
  vendor?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl?: string;
    businessName?: string;
  };
  createdAt?: string;
  lastSaleDate?: string | null;
}

// Fonction pour adapter les données EXACTEMENT selon l'API best-sellers-v2
const adaptBestSellerToVendorProduct = (item: BestSellerProduct) => {
  console.log('🔄 Adaptation best-seller pour produit:', item.id, item);

  // ✅ NOUVELLE API : best-sellers-v2 retourne directement designPositions array
  // Les coordonnées sont déjà en pixels absolus depuis le centre de la délimitation
  const firstDesignPosition = item.designPositions?.[0]?.position || item.designPosition || {
    x: 0,
    y: 0,
    scale: 0.6,
    rotation: 0,
    designWidth: 200,
    designHeight: 200
  };

  // Utiliser directement les coordonnées de l'API (déjà en pixels depuis le centre)
  const positionX = firstDesignPosition.x || 0;
  const positionY = firstDesignPosition.y || 0;
  const scale = firstDesignPosition.scale || item.designScale || 0.6;
  const rotation = firstDesignPosition.rotation || 0;
  const designWidth = firstDesignPosition.designWidth || item.designWidth || 200;
  const designHeight = firstDesignPosition.designHeight || item.designHeight || 200;

  console.log(`📏 Utilisation coordonnées API pour produit ${item.id}:`, {
    position: { x: positionX, y: positionY },
    scale,
    rotation,
    dimensions: { width: designWidth, height: designHeight }
  });
  
  return {
    id: item.id,
    vendorName: item.name,
    price: item.price,
    status: 'PUBLISHED',
    adminProduct: {
      id: item.baseProduct?.id || item.id,
      name: item.baseProduct?.name || item.name,
      colorVariations: item.baseProduct?.colorVariations?.map(cv => ({
        ...cv,
        images: cv.images.map(img => ({
          ...img,
          viewType: img.view, // L'API utilise 'view' au lieu de 'viewType'
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          // Mapper les délimitations de l'API (pixels absolus) vers le format attendu
          delimitations: img.delimitations?.map(delim => ({
            x: delim.x,
            y: delim.y,
            width: delim.width,
            height: delim.height,
            coordinateType: 'PIXEL' as const // Les valeurs de l'API sont en pixels absolus
          })) || [
            // Délimitation par défaut si aucune n'est définie
            {
              x: img.naturalWidth * 0.25,
              y: img.naturalHeight * 0.25,
              width: img.naturalWidth * 0.5,
              height: img.naturalHeight * 0.5,
              coordinateType: 'PIXEL' as const
            }
          ]
        }))
      })) || []
    },
    designApplication: {
      hasDesign: !!item.designCloudinaryUrl,
      designUrl: item.designCloudinaryUrl || '',
      positioning: item.designPositioning || 'CENTER',
      scale: scale
    },
    // ✅ Utiliser directement designPositions de l'API best-sellers-v2
    designPositions: item.designPositions?.map(dp => ({
      designId: dp.designId,
      position: {
        x: dp.position.x,
        y: dp.position.y,
        scale: dp.position.scale,
        rotation: dp.position.rotation || 0,
        designWidth: dp.position.designWidth,
        designHeight: dp.position.designHeight,
        constraints: dp.position.constraints || { minScale: 0.1, maxScale: 2.0 }
      }
    })) || [{
      // Position par défaut si pas de designPositions
      designId: item.id,
      position: {
        x: positionX,
        y: positionY,
        scale: scale,
        rotation: rotation,
        designWidth: designWidth,
        designHeight: designHeight,
        constraints: { minScale: 0.1, maxScale: 2.0 }
      }
    }],
    designTransforms: item.designPositions ? [{
      id: item.id,
      designUrl: item.designCloudinaryUrl || '',
      transforms: {
        '0': {
          x: positionX,
          y: positionY,
          scale: scale,
          rotation: rotation,
          designWidth: designWidth,
          designHeight: designHeight
        }
      }
    }] : [{
      // Default transform
      id: item.id,
      designUrl: item.designCloudinaryUrl || '',
      transforms: {
        '0': {
          x: positionX,
          y: positionY,
          scale: scale,
          rotation: rotation,
          designWidth: designWidth,
          designHeight: designHeight
        }
      }
    }],
    selectedColors: item.baseProduct?.colorVariations?.map(cv => ({
      id: cv.id,
      name: cv.name,
      colorCode: cv.colorCode
    })) || [],
    designId: item.id
  };
};

// Composant ProductCard - Structure exacte comme demandé
const ProductCard = ({ item, formatPrice }) => {
  // Récupérer la première variation de couleur et sa première image
  const firstColorVariation = item.baseProduct?.colorVariations?.[0];
  const firstImage = firstColorVariation?.images?.[0];
  const firstDelimitation = firstImage?.delimitations?.[0];

  // Récupérer la position du design
  const designPosition = item.designPositions?.[0]?.position;

  // Calculer les positions du design sur l'image
  const calculateDesignPosition = () => {
    if (!designPosition || !firstDelimitation || !firstImage) {
      return null;
    }

    const { x, y, scale, rotation, designWidth, designHeight } = designPosition;
    const { x: delimX, y: delimY, width: delimWidth, height: delimHeight } = firstDelimitation;
    const { naturalWidth, naturalHeight } = firstImage;

    // Calculer les dimensions et positions
    const scaledDesignWidth = designWidth * scale;
    const scaledDesignHeight = designHeight * scale;

    return {
      container: {
        left: `${delimX}px`,
        top: `${delimY}px`,
        width: `${delimWidth}px`,
        height: `${delimHeight}px`
      },
      design: {
        width: `${scaledDesignWidth}px`,
        height: `${scaledDesignHeight}px`,
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg)`
      }
    };
  };

  const positions = calculateDesignPosition();

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
        <div className="aspect-square relative bg-white rounded-lg overflow-hidden w-full h-full">
          {/* Image du produit */}
          <img
            alt={item.name}
            className="w-full h-full object-cover"
            src={firstImage?.url || ''}
          />

          {/* Overlay du design */}
          {item.designCloudinaryUrl && positions && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, overflow: 'visible' }}>
              <div
                className="absolute overflow-hidden"
                style={{
                  ...positions.container,
                  pointerEvents: 'none',
                  border: 'none'
                }}
              >
                <div
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    ...positions.design,
                    transformOrigin: 'center center',
                    transition: 'transform 0.1s ease-out',
                    border: 'none'
                  }}
                >
                  <img
                    alt="Design"
                    className="object-contain pointer-events-none select-none"
                    draggable="false"
                    src={item.designCloudinaryUrl}
                    style={{ width: '100%', height: '100%', transform: 'scale(1)' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay texte */}
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

const BestSellersGrid = () => {
  const [bestSellersData, setBestSellersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fonction pour récupérer les meilleures ventes depuis l'API
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch('http://localhost:3004/public/best-sellers-v2');
        const result = await response.json();

        console.log('📊 Données best-sellers-v2 reçues:', result);

        if (result.success && result.data) {
          setBestSellersData(result.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des meilleures ventes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  // Fonction pour formater uniquement le nombre
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(price);
  };

  // Navigation functions (identiques à NouveautesGrid)
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    const maxIndex = Math.max(0, bestSellersData.length - 4);
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Calculer les produits actuellement affichés (identique à NouveautesGrid)
  const getCurrentProducts = () => {
    return bestSellersData.slice(currentIndex, currentIndex + 4);
  };

  // Vérifier s'il y a plus de produits (identique à NouveautesGrid)
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < bestSellersData.length - 4;

  // Loading state identique à NouveautesGrid
  if (isLoading) {
    return (
      <div className="w-full bg-white py-1 md:py-2">
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

  return (
    <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      <div className="w-full px-4 sm:px-8">
        {/* En-tête avec titre uniforme - identique à NouveautesGrid */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="font-bold">Les meilleures ventes</span>
            <img src="/fire.svg" alt="Fire" className="w-6 h-6 md:w-8 md:h-8" />
          </h2>
          
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            Voir toutes les meilleures ventes
          </button>
        </div>

        {/* Container avec navigation latérale - identique à NouveautesGrid */}
        <div className="relative">
          {/* Bouton navigation gauche */}
          {bestSellersData.length > 4 && (
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

          {/* Grille de 4 produits avec SimpleProductPreview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 transition-all duration-300">
            {currentProducts.map((item) => (
              <ProductCard 
                key={item.id} 
                item={item} 
                formatPrice={formatPrice}
              />
            ))}
          </div>

          {/* Bouton navigation droite */}
          {bestSellersData.length > 4 && (
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

        {/* Message informatif - identique à NouveautesGrid */}
        {bestSellersData.length <= 4 && (
          <div className="text-center text-gray-500 text-sm mt-4">
            {bestSellersData.length} produit{bestSellersData.length > 1 ? 's' : ''} disponible{bestSellersData.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellersGrid;
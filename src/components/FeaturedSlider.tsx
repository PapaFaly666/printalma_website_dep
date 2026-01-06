import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
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
  defaultColorId?: number | null; // 🆕 Couleur par défaut à afficher
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
    defaultColorId: item.defaultColorId, // 🆕 Couleur par défaut à afficher
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

// Composant ProductCard utilisant SimpleProductPreview comme NouveautesSection
const ProductCard = ({ item, formatPrice, onProductClick }) => {
  // Adapter le produit pour SimpleProductPreview
  const adaptedProduct = adaptBestSellerToVendorProduct(item);

  return (
    <div
      onClick={() => onProductClick(item.id)}
      className="relative rounded-xl xs:rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transform hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 w-full"
      style={{
        aspectRatio: "4 / 5",
        minHeight: "200px",
        height: "auto"
      }}
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <SimpleProductPreview
          product={adaptedProduct}
          showColorSlider={false}
          showDelimitations={false}
          className="w-full h-full"
          onColorChange={() => {}}
          hideValidationBadges={true}
          imageObjectFit="cover"
          initialColorId={adaptedProduct.defaultColorId || undefined}
        />
      </div>

      {/* Overlay texte */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2 xs:p-3 sm:p-4 pointer-events-none" style={{ zIndex: 50 }}>
        {item.price && (
          <div className="mb-1 xs:mb-1.5 sm:mb-2">
            <span className="bg-white text-black px-1.5 xs:px-2 py-0.5 xs:py-1 rounded text-[10px] xs:text-xs sm:text-sm font-bold shadow-lg">
              {formatPrice(item.price)}{" "}
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-gray-600">FCFA</span>
            </span>
          </div>
        )}
        <div className="text-white">
          <h3 className="font-bold text-xs xs:text-sm sm:text-base md:text-lg leading-tight mb-0.5 xs:mb-1 drop-shadow-lg">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-[10px] xs:text-xs sm:text-sm text-gray-200 font-medium mb-0.5 xs:mb-1 line-clamp-2 drop-shadow-lg">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const BestSellersGrid = () => {
  const navigate = useNavigate();
  const [bestSellersData, setBestSellersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fonction de navigation vers la page de détail du produit
  const handleProductClick = (productId: number) => {
    console.log('🔗 [BestSellersGrid] Navigation vers le produit:', productId);
    navigate(`/vendor-product-detail/${productId}`);
  };

  // Fonction pour le scroll horizontal sur mobile
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 640
        ? window.innerWidth * 0.75  // 75vw on mobile
        : window.innerWidth < 1024
          ? window.innerWidth * 0.50  // 50vw on tablet
          : window.innerWidth * 0.25;  // 25vw on desktop
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 640
        ? window.innerWidth * 0.75  // 75vw on mobile
        : window.innerWidth < 1024
          ? window.innerWidth * 0.50  // 50vw on tablet
          : window.innerWidth * 0.25;  // 25vw on desktop
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
        <div className="w-full px-4 sm:px-6">
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
    <div className="w-full py-0 sm:py-1 md:py-2 pt-4 xs:pt-6 sm:pt-8 md:pt-10 lg:pt-12">
      <div className="w-full px-3 xs:px-4 sm:px-6 md:px-8">
        {/* En-tête avec titre uniforme - identique à NouveautesGrid */}
        <div className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-1">
          <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-1.5 xs:gap-2">
            <span className="font-bold">Les meilleures ventes</span>
            <img src="/fire.svg" alt="Fire" className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          </h2>

          <button
            onClick={() => navigate('/best-sellers')}
            className="bg-red-500 hover:bg-red-600 text-white px-2 xs:px-2.5 py-1 xs:py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] xs:text-xs sm:text-sm md:text-base font-medium transition-colors duration-200"
          >
            Voir toutes
          </button>
        </div>

        {/* Container avec navigation latérale - identique à NouveautesGrid */}
        <div className="relative">
          {/* Bouton navigation gauche */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                scrollLeft();
              } else {
                goToPrevious();
              }
            }}
            disabled={!canGoLeft && window.innerWidth >= 1024}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white shadow-lg border-2 flex items-center justify-center transition-all duration-200 ${
              window.innerWidth < 1024
                ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                : canGoLeft
                  ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
            } -translate-x-3 xs:-translate-x-4 sm:-translate-x-5 md:-translate-x-6`}
            aria-label="Produits précédents"
          >
            <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Grille de 4 produits avec SimpleProductPreview - Scroll horizontal sur mobile */}
          <div
            ref={scrollContainerRef}
            className="flex lg:grid lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8 transition-all duration-300 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-hide"
          >
            {currentProducts.map((item, index) => (
              <div key={item.id} className="flex-shrink-0 w-[70vw] xs:w-[60vw] sm:w-[45vw] md:w-[48vw] lg:w-auto snap-start">
                <ProductCard
                  item={item}
                  formatPrice={formatPrice}
                  onProductClick={handleProductClick}
                />
              </div>
            ))}
          </div>

          <style>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Bouton navigation droite */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                scrollRight();
              } else {
                goToNext();
              }
            }}
            disabled={!canGoRight && window.innerWidth >= 1024}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white shadow-lg border-2 flex items-center justify-center transition-all duration-200 ${
              window.innerWidth < 1024
                ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                : canGoRight
                  ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  : 'border-gray-300 text-gray-300 cursor-not-allowed'
            } translate-x-3 xs:translate-x-4 sm:translate-x-5 md:translate-x-6`}
            aria-label="Produits suivants"
          >
            <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Message informatif - identique à NouveautesGrid */}
        {bestSellersData.length <= 4 && (
          <div className="text-center text-gray-500 text-[10px] xs:text-xs sm:text-sm mt-2 xs:mt-3 sm:mt-4">
            {bestSellersData.length} produit{bestSellersData.length > 1 ? 's' : ''} disponible{bestSellersData.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellersGrid;
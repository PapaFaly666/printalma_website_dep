import React from 'react';
import ProductImageWithDesign from './ProductImageWithDesign';
import { useDesignTransformsOptimized } from '../hooks/useDesignTransformsOptimized';

interface ProductWithSavedTransformsProps {
  productId: number;
  productImage: {
    id: number;
    url: string;
    viewType: string;
    delimitations: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
    }>;
  };
  designUrl: string;
  designConfig?: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  className?: string;
  interactive?: boolean;
  showDelimitations?: boolean;
  fallbackComponent?: React.ReactNode;
}

export const ProductWithSavedTransforms: React.FC<ProductWithSavedTransformsProps> = ({
  productId,
  productImage,
  designUrl,
  designConfig = { positioning: 'CENTER', scale: 0.6 },
  className = '',
  interactive = false,
  showDelimitations = false,
  fallbackComponent
}) => {
  const { 
    transforms, 
    isLoading, 
    isDirty,
    isInitialized 
  } = useDesignTransformsOptimized({
    vendorProductId: productId,
    designUrl,
    enabled: true,
    autoSaveDelay: 3000
  });

  const hasTransforms = transforms && Object.keys(transforms).length > 0;

  console.log(`🎯 ProductWithSavedTransforms - Produit ${productId}:`, {
    designUrl: designUrl.substring(0, 50) + '...',
    hasTransforms,
    transformsCount: hasTransforms ? Object.keys(transforms).length : 0,
    transformsData: transforms,
    isLoading,
    isInitialized,
    isDirty,
    hasDelimitations: productImage?.delimitations?.length > 0
  });

  // Affichage pendant le chargement initial
  if (isLoading && !isInitialized) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Chargement transformations...</span>
        </div>
      </div>
    );
  }

  // Si pas de transformations et fallback fourni
  if (!hasTransforms && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Rendu avec transformations (ou sans transformations = position par défaut)
  return (
    <div className="relative">
      <ProductImageWithDesign
        productImage={productImage}
        designUrl={designUrl}
        designConfig={designConfig}
        showDelimitations={showDelimitations}
        className={className}
        interactive={interactive}
        vendorProductId={productId}
        designTransforms={transforms}
      />
      
      {/* Badge indicateur transformations */}
      {hasTransforms && !interactive && (
        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full opacity-75">
          Personnalisé
        </div>
      )}
      
      {/* Badge modifications non sauvées */}
      {isDirty && !interactive && (
        <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full opacity-75 animate-pulse">
          Non sauvé
        </div>
      )}
    </div>
  );
};

export default ProductWithSavedTransforms; 
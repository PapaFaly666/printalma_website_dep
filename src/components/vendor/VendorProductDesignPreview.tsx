import React from 'react';
import ProductDesignPreview from './ProductDesignPreview';
import { VendorDesignProductResponse } from '../../types/vendorDesignProduct';

interface VendorProductDesignPreviewProps {
  // Données du produit avec design (format API)
  vendorDesignProduct: VendorDesignProductResponse;
  
  // Options d'affichage
  showInfo?: boolean;
  className?: string;
  width?: number;
  height?: number;
  
  // Callback pour les erreurs
  onError?: (error: string) => void;
}

export const VendorProductDesignPreview: React.FC<VendorProductDesignPreviewProps> = ({
  vendorDesignProduct,
  showInfo = false,
  className = '',
  width,
  height,
  onError
}) => {
  // Extraire les informations du produit
  const productImageUrl = (vendorDesignProduct.product as any)?.imageUrl || 
                          (vendorDesignProduct.product as any)?.view?.url || 
                          (vendorDesignProduct.product as any)?.view?.imageUrl || 
                          '';
  
  const designUrl = vendorDesignProduct.designUrl;
  
  // Transformations normalisées
  const positionX = vendorDesignProduct.positionX;
  const positionY = vendorDesignProduct.positionY;
  const scale = vendorDesignProduct.scale;
  const rotation = vendorDesignProduct.rotation;
  
  // Métadonnées
  const productName = vendorDesignProduct.product?.name || vendorDesignProduct.name;
  const designName = vendorDesignProduct.designFileName || 'Design personnalisé';
  
  // Validation des données
  if (!productImageUrl || !designUrl) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border border-gray-200">
        <span className="text-gray-500 text-sm">
          Données manquantes pour l'aperçu
        </span>
      </div>
    );
  }
  
  return (
    <ProductDesignPreview
      productImageUrl={productImageUrl}
      designUrl={designUrl}
      positionX={positionX}
      positionY={positionY}
      scale={scale}
      rotation={rotation}
      productName={productName}
      designName={designName}
      showInfo={showInfo}
      className={className}
      width={width}
      height={height}
      onError={onError}
    />
  );
};

// Composant pour les données dans le format legacy/transformé
interface LegacyVendorProductPreviewProps {
  // Données du produit (format legacy)
  product: {
    id: number;
    name?: string;
    designUrl?: string;
    view?: {
      url?: string;
      imageUrl?: string;
    };
    vendorProduct?: {
      name?: string;
    };
  };
  
  // Transformations (peuvent venir de différentes sources)
  transforms?: {
    positionX?: number;
    positionY?: number;
    scale?: number;
    rotation?: number;
  };
  
  // Options d'affichage
  showInfo?: boolean;
  className?: string;
  width?: number;
  height?: number;
  
  // Callback pour les erreurs
  onError?: (error: string) => void;
}

export const LegacyVendorProductPreview: React.FC<LegacyVendorProductPreviewProps> = ({
  product,
  transforms,
  showInfo = false,
  className = '',
  width,
  height,
  onError
}) => {
  // Extraire les informations du produit
  const productImageUrl = product.view?.url || product.view?.imageUrl || '';
  const designUrl = product.designUrl || '';
  
  // Transformations avec valeurs par défaut
  const positionX = transforms?.positionX ?? 0.5;
  const positionY = transforms?.positionY ?? 0.5;
  const scale = transforms?.scale ?? 1.0;
  const rotation = transforms?.rotation ?? 0;
  
  // Métadonnées
  const productName = product.name || product.vendorProduct?.name || `Produit ${product.id}`;
  const designName = 'Design personnalisé';
  
  // Validation des données
  if (!productImageUrl || !designUrl) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border border-gray-200">
        <span className="text-gray-500 text-sm">
          Données manquantes pour l'aperçu
        </span>
      </div>
    );
  }
  
  return (
    <ProductDesignPreview
      productImageUrl={productImageUrl}
      designUrl={designUrl}
      positionX={positionX}
      positionY={positionY}
      scale={scale}
      rotation={rotation}
      productName={productName}
      designName={designName}
      showInfo={showInfo}
      className={className}
      width={width}
      height={height}
      onError={onError}
    />
  );
};

export default VendorProductDesignPreview; 
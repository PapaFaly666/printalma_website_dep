import React from 'react';
import { OrderProductPreview } from './OrderProductPreview';
import { useProductDelimitations } from '../../hooks/useProductDelimitations';

interface EnrichedOrderProductPreviewProps {
  product: {
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    colorName?: string;
    colorCode?: string;
    size?: string;
    mockupImageUrl?: string;
    designImageUrl?: string | null;
    designPosition?: {
      x: number;
      y: number;
      scale: number;
      rotation?: number;
    };
    delimitation?: {
      x: number;
      y: number;
      width: number;
      height: number;
      coordinateType: 'PERCENTAGE' | 'PIXEL';
    };
    vendorProductId?: number;
  };
  className?: string;
}

/**
 * Composant wrapper qui enrichit automatiquement les données d'un produit
 * en récupérant les délimitations depuis l'API si elles ne sont pas présentes
 */
export const EnrichedOrderProductPreview: React.FC<EnrichedOrderProductPreviewProps> = ({
  product,
  className
}) => {
  // Récupérer les délimitations depuis l'API si elles ne sont pas dans le produit
  const { delimitation: fetchedDelimitation, loading } = useProductDelimitations(
    !product.delimitation ? product.vendorProductId : undefined,
    product.colorCode
  );

  // Utiliser la délimitation sauvegardée en priorité, sinon celle récupérée
  const finalDelimitation = product.delimitation || fetchedDelimitation || undefined;

  console.log('🔄 [EnrichedOrderProductPreview] Enrichissement:', {
    productId: product.id,
    hasOriginalDelimitation: !!product.delimitation,
    hasFetchedDelimitation: !!fetchedDelimitation,
    finalDelimitation,
    loading
  });

  // Si on est en train de charger et qu'on n'a pas de délimitation, afficher un loader
  if (loading && !product.delimitation) {
    return (
      <div className={`aspect-square bg-gray-100 flex items-center justify-center rounded-lg ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <OrderProductPreview
      product={{
        ...product,
        delimitation: finalDelimitation
      }}
      className={className}
    />
  );
};

export default EnrichedOrderProductPreview;

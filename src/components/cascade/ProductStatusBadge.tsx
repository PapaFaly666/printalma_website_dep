// Badge de statut produit pour le système de validation en cascade

import React from 'react';
import { VendorProduct } from '../../types/cascadeValidation';
import { cascadeValidationService } from '../../services/cascadeValidationService';

interface ProductStatusBadgeProps {
  product: VendorProduct;
  className?: string;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ 
  product, 
  className = '' 
}) => {
  const { text, color, icon } = cascadeValidationService.getDisplayStatus(product);

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color} ${className}`}>
      <span>{icon}</span>
      {text}
    </span>
  );
};

export default ProductStatusBadge; 
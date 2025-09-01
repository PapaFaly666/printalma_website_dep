import React from 'react';
import { VendorProductStatus } from '../../services/autoValidationService';

interface AutoValidationBadgeProps {
  product: VendorProductStatus;
  className?: string;
}

export const AutoValidationBadge: React.FC<AutoValidationBadgeProps> = ({ 
  product, 
  className = "" 
}) => {
  // Produit auto-validé (validatedBy = -1)
  if (product.isValidated && product.isAutoValidated) {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 ${className}`}>
        🤖 Auto-validé
      </span>
    );
  }

  // Produit validé manuellement
  if (product.isValidated) {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ${className}`}>
        ✅ Validé manuellement
      </span>
    );
  }

  // Éligible pour auto-validation (design validé mais produit pas encore)
  if (product.canBeAutoValidated) {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 ${className}`}>
        ⏳ Éligible auto-validation
      </span>
    );
  }

  // En attente
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 ${className}`}>
      ⏱️ En attente
    </span>
  );
};

export default AutoValidationBadge;
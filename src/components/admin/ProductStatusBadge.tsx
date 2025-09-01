import React from 'react';

interface DesignStatus {
  total: number;
  validated: number;
  pending: number;
}

interface VendorProductStatus {
  id: number;
  name: string;
  isValidated: boolean;
  validatedBy: number | null;
  designsStatus: DesignStatus;
}

interface ProductStatusBadgeProps {
  product: VendorProductStatus;
  className?: string;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ 
  product, 
  className = '' 
}) => {
  const isAutoValidated = product.validatedBy === -1;
  const { validated, total } = product.designsStatus;
  
  // Produit auto-validé (par l'IA/système)
  if (product.isValidated && isAutoValidated) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}>
        <span className="text-base">🤖</span>
        <span>Auto-validé</span>
        <span className="text-xs opacity-75">(Designs approuvés)</span>
      </div>
    );
  }
  
  // Produit validé manuellement
  if (product.isValidated) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 ${className}`}>
        <span className="text-base">✅</span>
        <span>Validé manuellement</span>
      </div>
    );
  }
  
  // Éligible pour auto-validation (tous les designs validés)
  if (validated === total && total > 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200 ${className}`}>
        <span className="text-base">⏳</span>
        <span>Éligible auto-validation</span>
        <span className="text-xs opacity-75">({validated}/{total})</span>
      </div>
    );
  }
  
  // En attente (designs partiellement validés)
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 ${className}`}>
      <span className="text-base">⏱️</span>
      <span>En attente</span>
      <span className="text-xs opacity-75">({validated}/{total} designs validés)</span>
    </div>
  );
};

export default ProductStatusBadge;
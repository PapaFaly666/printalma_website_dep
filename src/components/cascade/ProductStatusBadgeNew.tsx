import React from 'react';
import { VendorProduct } from '../../types/cascadeValidation';

interface ProductStatusBadgeProps {
  product: VendorProduct;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ product }) => {
  const getBadgeConfig = () => {
    if (product.status === 'PUBLISHED') {
      return { 
        text: 'Publié', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      };
    }
    
    if (product.status === 'DRAFT' && product.isValidated) {
      return { 
        text: 'Validé - Prêt à publier', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🎯'
      };
    }
    
    if (product.status === 'PENDING') {
      return { 
        text: 'En attente de validation', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳'
      };
    }
    
    return { 
      text: 'Brouillon', 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '📝'
    };
  };

  const { text, className, icon } = getBadgeConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {icon} {text}
    </span>
  );
}; 
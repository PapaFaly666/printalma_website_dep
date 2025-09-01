import React from 'react';
import { ProductStatus } from '../types/cascadeValidation';

interface ProductStatusBadgeProps {
  status: ProductStatus;
  isValidated: boolean;
  className?: string;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  status,
  isValidated,
  className = ''
}) => {
  const getBadgeConfig = () => {
    if (status === 'PUBLISHED') {
      return {
        text: 'Publié',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    
    if (status === 'DRAFT') {
      if (isValidated) {
        return {
          text: 'Prêt à publier',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      } else {
        return {
          text: 'Brouillon',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      }
    }
    
    if (status === 'PENDING') {
      return {
        text: 'En attente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }
    
    return {
      text: 'Inconnu',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const config = getBadgeConfig();

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${config.className} ${className}
    `}>
      {config.text}
    </span>
  );
}; 
 
 
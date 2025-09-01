// components/PublishButton.tsx

import React from 'react';
import { VendorProduct } from '../types/cascadeValidation';

interface PublishButtonProps {
  product: VendorProduct;
  onPublish: (productId: number) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export const PublishButton: React.FC<PublishButtonProps> = ({
  product,
  onPublish,
  loading = false,
  className = ''
}) => {
  const canPublish = product.status === 'DRAFT' && product.isValidated;

  if (!canPublish) {
    return null;
  }

  return (
    <button
      onClick={() => onPublish(product.id)}
      disabled={loading}
      className={`
        inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md
        text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Publication...
        </>
      ) : (
        <>
          📦 Publier
        </>
      )}
    </button>
  );
}; 
 
 
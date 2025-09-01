import React from 'react';
import { useVendorValidation } from '../../hooks/useVendorValidation';

interface PublishValidatedProductButtonProps {
  productId: number;
  productName: string;
  onPublished?: () => void;
}

export const PublishValidatedProductButton: React.FC<PublishValidatedProductButtonProps> = ({
  productId,
  productName,
  onPublished
}) => {
  const { publishProduct, loading } = useVendorValidation();

  const handlePublish = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir publier "${productName}" ?`)) {
      const result = await publishProduct(productId);
      if (result.success && onPublished) {
        onPublished();
      }
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="
        inline-flex items-center gap-2 px-4 py-2 
        bg-green-600 hover:bg-green-700 disabled:bg-gray-400
        text-white font-medium rounded-lg transition-colors
        disabled:cursor-not-allowed
      "
    >
      {loading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Publication...
        </>
      ) : (
        <>
          🚀 Publier maintenant
        </>
      )}
    </button>
  );
}; 
 
import React, { useState } from 'react';
import { VendorProduct } from '../../types/cascadeValidation';

interface PublishButtonProps {
  product: VendorProduct;
  onPublish: (productId: number) => Promise<{ success: boolean; error?: string }>;
}

export const PublishButton: React.FC<PublishButtonProps> = ({ product, onPublish }) => {
  const [isPublishing, setIsPublishing] = useState(false);

  // Afficher le bouton seulement si le produit est validé et en brouillon
  const shouldShowButton = product.isValidated && product.status === 'DRAFT';

  if (!shouldShowButton) {
    return null;
  }

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await onPublish(product.id);
      if (!result.success) {
        alert(`Erreur: ${result.error}`);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={isPublishing}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
    >
      {isPublishing ? '⏳ Publication...' : '🚀 Publier maintenant'}
    </button>
  );
}; 
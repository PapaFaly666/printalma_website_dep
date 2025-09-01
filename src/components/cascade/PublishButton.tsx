import React, { useState } from 'react';
import { VendorProduct } from '../../types/cascadeValidation';
import { cascadeValidationService } from '../../services/cascadeValidationService';
import { Rocket, Loader2 } from 'lucide-react';

interface PublishButtonProps {
  product: VendorProduct;
  onPublish: (productId: number) => Promise<{ success: boolean; error?: string; message?: string }>;
  className?: string;
}

export const PublishButton: React.FC<PublishButtonProps> = ({ 
  product, 
  onPublish, 
  className = '' 
}) => {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await onPublish(product.id);
      if (!result.success) {
        alert(`Erreur: ${result.error}`);
      } else {
        // Succès - le composant parent gère la mise à jour
        console.log('✅ Publication réussie:', result.message);
      }
    } catch (error) {
      console.error('❌ Erreur publication:', error);
      alert('Erreur lors de la publication');
    } finally {
      setIsPublishing(false);
    }
  };

  // Afficher le bouton seulement si le produit peut être publié manuellement
  if (!cascadeValidationService.canPublishManually(product)) {
    return null;
  }

  return (
    <button
      onClick={handlePublish}
      disabled={isPublishing}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
        bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${className}
      `}
    >
      {isPublishing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Publication...
        </>
      ) : (
        <>
          <Rocket className="h-4 w-4" />
          Publier maintenant
        </>
      )}
    </button>
  );
}; 
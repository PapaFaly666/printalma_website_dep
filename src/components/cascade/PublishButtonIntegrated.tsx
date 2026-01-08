import React, { useState } from 'react';
import Button from '../ui/Button';
import { Rocket, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PublishButtonIntegratedProps {
  product: any;
  onPublish: (productId: number) => Promise<any>;
  disabled?: boolean;
  className?: string;
}

export const PublishButtonIntegrated: React.FC<PublishButtonIntegratedProps> = ({
  product,
  onPublish,
  disabled = false,
  className = ""
}) => {
  const [isPublishing, setIsPublishing] = useState(false);

  // Afficher le bouton uniquement si le produit est en brouillon ET validé.
  // Les règles externes (workflow, postValidationAction…) n'influencent plus l'affichage.
  const canPublish = () => product.status === 'DRAFT' && product.isValidated;

  console.log('🚀 Publish Button Debug:', {
    id: product.id,
    name: product.name,
    status: product.status,
    workflow: product.workflow,
    isValidated: product.isValidated,
    readyToPublish: product.readyToPublish,
    pendingAutoPublish: product.pendingAutoPublish,
    canPublish: canPublish(),
    buttonWillShow: canPublish()
  });

  // Ne pas afficher le bouton si le produit ne peut pas être publié
  if (!canPublish()) {
    return null;
  }

  const handlePublish = async () => {
    if (isPublishing || disabled) return;
    
    setIsPublishing(true);
    try {
      await onPublish(product.id);
      toast.success('Produit publié avec succès ! 🎉');
    } catch (error: any) {
      console.error('Erreur publication:', error);
      toast.error(error?.message || 'Erreur lors de la publication');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={isPublishing || disabled}
      className={`
        bg-green-600 hover:bg-green-700 text-white font-medium
        transition-all duration-200 shadow-sm hover:shadow-md
        ${className}
      `}
    >
      {isPublishing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Publication...
        </>
      ) : (
        <>
          <Rocket className="w-4 h-4 mr-2" />
          Publier maintenant
        </>
      )}
    </Button>
  );
}; 
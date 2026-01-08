import React, { useState } from 'react';
import { VendorProduct, PostValidationAction } from '../../types/vendorProduct';
import { ProductStatusBadge } from './ProductStatusBadge';
import { PublishValidatedProductButton } from './PublishValidatedProductButton';
import { ValidationActionSelector } from './ValidationActionSelector';
import { useVendorValidation } from '../../hooks/useVendorValidation';
import Button from '../ui/Button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../ui/dialog';
import { VendorValidationService } from '../../services/vendorValidationService';
import { toast } from 'sonner';
import { Rocket, Edit, Trash2, Eye } from 'lucide-react';
import { VendorProduct as CascadeVendorProduct } from '../../types/cascadeValidation';
import { CascadeValidationService } from '../../services/cascadeValidationService';

interface VendorProductActionsProps {
  product: VendorProduct | CascadeVendorProduct;
  onProductUpdated?: () => void;
  onPublish?: (id: number) => void;
  onEdit?: (product: VendorProduct) => void;
  onDelete?: (id: number) => void;
  onView?: (product: VendorProduct) => void;
  onRefresh?: () => void;
}

// Type guard pour vérifier si c'est un produit cascade validation
const isCascadeVendorProduct = (product: any): product is CascadeVendorProduct => {
  return product.hasOwnProperty('postValidationAction') && product.hasOwnProperty('isValidated');
};

export const VendorProductActions: React.FC<VendorProductActionsProps> = ({
  product,
  onProductUpdated,
  onPublish,
  onEdit,
  onDelete,
  onView,
  onRefresh
}) => {
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<PostValidationAction>(
    product.postValidationAction || PostValidationAction.AUTO_PUBLISH
  );
  const { loading } = useVendorValidation();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const handleActionChange = (action: PostValidationAction) => {
    setCurrentAction(action);
    if (onProductUpdated) {
      onProductUpdated();
    }
  };

  const handleSubmitForValidation = async () => {
    try {
      // Soumettre le produit pour validation avec l'action choisie
      await VendorValidationService.submitForValidation(product.id, currentAction);
      toast.success('Produit soumis pour validation avec succès !');
      setShowValidationDialog(false);
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
    }
  };

  const handlePublishValidated = () => {
    if (onProductUpdated) {
      onProductUpdated();
    }
  };

  const handlePublishValidatedDraft = async () => {
    if (!isCascadeVendorProduct(product)) return;
    
    setIsPublishing(true);
    try {
      await CascadeValidationService.publishValidatedDraft(product.id);
      toast.success('Produit publié avec succès !');
      onRefresh?.();
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      toast.error('Erreur lors de la publication du produit');
    } finally {
      setIsPublishing(false);
    }
  };

  const canPublishManually = () => {
    if (!isCascadeVendorProduct(product)) return false;
    return CascadeValidationService.canPublishManually(product);
  };

  const canModifyProduct = () => {
    if (!isCascadeVendorProduct(product)) return true; // Legacy products can be modified
    return CascadeValidationService.canModifyProduct(product);
  };

  // Vérifier si un produit legacy peut être publié (validé + DRAFT)
  const canPublishLegacyProduct = () => {
    if (isCascadeVendorProduct(product)) return false; // Pas pour les produits cascade
    const isValidated = (product as any).isValidated || false;
    return product.status === 'DRAFT' && isValidated;
  };

  // Vérifier si un produit avec workflow peut être publié
  const canPublishWorkflowProduct = () => {
    if (isCascadeVendorProduct(product)) return false; // Pas pour les produits cascade
    const isValidated = (product as any).isValidated || false;
    const readyToPublish = (product as any).readyToPublish || false;
    return product.status === 'DRAFT' && (isValidated || readyToPublish);
  };

  const renderActionButtons = () => {
    switch (product.status) {
      case 'DRAFT':
        if (product.isValidated) {
          // Produit validé par l'admin et mis en brouillon selon le choix du vendeur
          // Le vendeur peut maintenant le publier manuellement
          return (
            <div className="flex gap-2">
              <PublishValidatedProductButton
                productId={product.id}
                productName={product.name}
                onPublished={handlePublishValidated}
              />
              <Button
                variant="outline"
                onClick={() => onEdit?.(product)}
                size="sm"
              >
                Modifier
              </Button>
            </div>
          );
        } else {
          // Brouillon normal - peut être soumis pour validation
          return (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowValidationDialog(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Soumettre pour validation
              </Button>
              <Button
                variant="outline"
                onClick={() => onEdit?.(product)}
                size="sm"
              >
                Modifier
              </Button>
            </div>
          );
        }

      case 'PENDING':
        // En attente de validation admin - actions limitées
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onView?.(product)}
              size="sm"
            >
              Voir
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowValidationDialog(true)}
              size="sm"
            >
              Modifier choix
            </Button>
          </div>
        );

      case 'PUBLISHED':
        // Produit publié (soit automatiquement après validation, soit manuellement)
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onView?.(product)}
              size="sm"
            >
              Voir
            </Button>
            <Button
              variant="outline"
              onClick={() => onEdit?.(product)}
              size="sm"
            >
              Modifier
            </Button>
          </div>
        );

      default:
        return (
          <Button
            variant="outline"
            onClick={() => onView?.(product)}
            size="sm"
          >
            Voir
          </Button>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <ProductStatusBadge product={product} />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {renderActionButtons()}
        
        {/* Delete button for draft products */}
        {product.status === 'DRAFT' && !product.isValidated && (
          <Button
            variant="outline"
            onClick={() => onDelete?.(product.id)}
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Supprimer
          </Button>
        )}

        {/* Bouton de publication manuelle pour les brouillons validés */}
        {canPublishManually() && (
          <Button
            onClick={handlePublishValidatedDraft}
            disabled={isPublishing}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {isPublishing ? 'Publication...' : 'Publier maintenant'}
          </Button>
        )}

        {/* Bouton de publication pour les produits legacy validés */}
        {canPublishLegacyProduct() && (
          <Button
            onClick={() => onPublish?.(product.id)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Publier maintenant
          </Button>
        )}

        {/* Bouton de publication pour les produits workflow validés */}
        {canPublishWorkflowProduct() && (
          <Button
            onClick={() => onPublish?.(product.id)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Publier maintenant
          </Button>
        )}
      </div>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {product.status === 'PENDING' 
                ? 'Modifier le choix de publication' 
                : 'Soumettre pour validation'}
            </DialogTitle>
            <DialogDescription>
              {product.status === 'PENDING' 
                ? 'Vous pouvez modifier votre choix tant que le produit n\'est pas encore validé.'
                : 'Choisissez ce qui doit se passer après validation par l\'administrateur.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ValidationActionSelector
              productId={product.id}
              currentAction={currentAction}
              disabled={loading}
              onActionChange={handleActionChange}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowValidationDialog(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitForValidation}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Soumission...' : 
               product.status === 'PENDING' ? 'Mettre à jour' : 'Soumettre'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 
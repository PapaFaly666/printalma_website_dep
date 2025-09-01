import React from 'react';
import { VendorProduct, PostValidationAction } from '../../types/cascadeValidation';
import { ProductStatusBadge } from './ProductStatusBadge';
import { PostValidationActionSelector } from './PostValidationActionSelector';
import { PublishButton } from './PublishButton';
import { cascadeValidationService } from '../../services/cascadeValidationService';
import { Calendar, Euro, Image, Edit, Trash2 } from 'lucide-react';

interface ProductCardProps {
  product: VendorProduct;
  onActionChange: (productId: number, action: PostValidationAction) => Promise<void>;
  onPublish: (productId: number) => Promise<{ success: boolean; error?: string; message?: string }>;
  onEdit?: (product: VendorProduct) => void;
  onDelete?: (productId: number) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onActionChange,
  onPublish,
  onEdit,
  onDelete,
  className = ''
}) => {
  const handleActionChange = async (action: PostValidationAction) => {
    try {
      await onActionChange(product.id, action);
    } catch (error) {
      console.error('Erreur lors du changement d\'action:', error);
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header avec image et statut */}
      <div className="relative">
        {product.designCloudinaryUrl && (
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <img 
              src={product.designCloudinaryUrl} 
              alt={product.vendorName}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <Image className="h-12 w-12" />
            </div>
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          <ProductStatusBadge product={product} />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6 space-y-4">
        {/* Informations du produit */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {product.vendorName}
          </h3>
          
          {product.vendorDescription && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {product.vendorDescription}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Euro className="h-4 w-4" />
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatPrice(product.vendorPrice)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Créé le {formatDate(product.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Sélecteur d'action - seulement si non validé et en attente */}
        {!product.isValidated && product.status === 'PENDING' && (
          <div className="border-t pt-4">
            <PostValidationActionSelector
              currentAction={product.postValidationAction}
              onActionChange={handleActionChange}
              disabled={product.isValidated}
            />
          </div>
        )}

        {/* Informations de validation */}
        {product.isValidated && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span className="text-green-800 dark:text-green-200">
                Validé le {formatDate(product.validatedAt!)}
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Action choisie: {product.postValidationAction === PostValidationAction.AUTO_PUBLISH 
                ? 'Publication automatique' 
                : 'Publication manuelle'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {/* Bouton de publication pour les produits validés en brouillon */}
            <PublishButton 
              product={product} 
              onPublish={onPublish}
            />
            
            {/* Bouton d'édition */}
            {cascadeValidationService.canModifyProduct(product) && onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </button>
            )}
          </div>

          {/* Bouton de suppression pour les brouillons non validés */}
          {product.status === 'DRAFT' && !product.isValidated && onDelete && (
            <button
              onClick={() => onDelete(product.id)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 
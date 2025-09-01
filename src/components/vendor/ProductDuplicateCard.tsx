import React from 'react';
import { Product } from '../../services/productService';
import { DuplicateCheckResult } from '../../services/designDuplicateService';
import { Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ProductDuplicateCardProps {
  product: Product;
  duplicateStatus: DuplicateCheckResult | null;
  isLoading: boolean;
  onSelect: (productId: number) => void;
  onReposition: (productId: number) => void;
  isSelected: boolean;
  designUrl?: string;
}

export const ProductDuplicateCard: React.FC<ProductDuplicateCardProps> = ({
  product,
  duplicateStatus,
  isLoading,
  onSelect,
  onReposition,
  isSelected,
  designUrl
}) => {
  const getCardStyle = () => {
    if (isLoading) {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }

    if (!duplicateStatus) {
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }

    switch (duplicateStatus.status) {
      case 'NEUTRAL':
        return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600';
      case 'DUPLICATE_SAME_POSITION':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 cursor-not-allowed';
      case 'DUPLICATE_DIFFERENT_POSITION':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />;
    }

    if (!duplicateStatus) {
      return null;
    }

    switch (duplicateStatus.status) {
      case 'NEUTRAL':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DUPLICATE_SAME_POSITION':
        return <Lock className="h-4 w-4 text-red-500" />;
      case 'DUPLICATE_DIFFERENT_POSITION':
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="secondary">Vérification...</Badge>;
    }

    if (!duplicateStatus) {
      return null;
    }

    switch (duplicateStatus.status) {
      case 'NEUTRAL':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Disponible</Badge>;
      case 'DUPLICATE_SAME_POSITION':
        return <Badge variant="destructive" className="bg-red-500 text-white">Verrouillé</Badge>;
      case 'DUPLICATE_DIFFERENT_POSITION':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Repositionnable</Badge>;
      default:
        return null;
    }
  };

  const getActionButton = () => {
    if (isLoading) {
      return (
        <button
          disabled
          className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          Vérification...
        </button>
      );
    }

    if (!duplicateStatus) {
      return (
        <button
          onClick={() => onSelect(product.id)}
          className="px-3 py-1 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          Sélectionner
        </button>
      );
    }

    switch (duplicateStatus.status) {
      case 'NEUTRAL':
        return (
          <button
            onClick={() => onSelect(product.id)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isSelected ? 'Sélectionné' : 'Sélectionner'}
          </button>
        );
      case 'DUPLICATE_SAME_POSITION':
        return (
          <button
            disabled
            className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-400 cursor-not-allowed"
          >
            Verrouillé
          </button>
        );
      case 'DUPLICATE_DIFFERENT_POSITION':
        return (
          <button
            onClick={() => onReposition(product.id)}
            className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Repositionner
          </button>
        );
      default:
        return null;
    }
  };

  const getMainView = () => {
    if (product.colorVariations && product.colorVariations.length > 0) {
      const firstVariation = product.colorVariations[0];
      if (firstVariation.images && firstVariation.images.length > 0) {
        const frontImage = firstVariation.images.find((img: any) => 
          (img.view || '').toUpperCase() === 'FRONT'
        );
        return frontImage || firstVariation.images[0];
      }
    }
    
    if (product.views && product.views.length > 0) {
      const frontView = product.views.find(v => 
        (v.viewType || '').toUpperCase() === 'FRONT'
      );
      return frontView || product.views[0];
    }
    
    return null;
  };

  const view = getMainView();
  const imageUrl = view ? (view as any).url || (view as any).imageUrl || (view as any).src : null;

  return (
    <div className={`rounded-lg border-2 p-4 transition-all duration-200 ${getCardStyle()}`}>
      {/* Header avec statut */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {product.name}
          </h3>
        </div>
        {getStatusBadge()}
      </div>

      {/* Image du produit */}
      <div className="relative mb-3">
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">Pas d'image</span>
            </div>
          )}
        </div>
      </div>

      {/* Message de statut */}
      {duplicateStatus && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {duplicateStatus.message}
          </p>
          {duplicateStatus.suggestedAction && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              {duplicateStatus.suggestedAction}
            </p>
          )}
        </div>
      )}

      {/* Prix */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {product.price} FCFA
        </span>
        {duplicateStatus?.status === 'DUPLICATE_SAME_POSITION' && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>

      {/* Action */}
      <div className="flex justify-end">
        {getActionButton()}
      </div>
    </div>
  );
}; 
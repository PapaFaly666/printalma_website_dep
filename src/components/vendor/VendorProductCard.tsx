import React from 'react';
import { VendorProduct } from '../../types/vendorProduct';
import { VendorProductActions } from './VendorProductActions';

interface VendorProductCardProps {
  product: VendorProduct;
  onProductUpdated?: () => void;
  onEdit?: (product: VendorProduct) => void;
  onDelete?: (id: number) => void;
  onView?: (product: VendorProduct) => void;
}

export const VendorProductCard: React.FC<VendorProductCardProps> = ({
  product,
  onProductUpdated,
  onEdit,
  onDelete,
  onView
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
      {/* Product Image */}
        <div className="w-full md:w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
                className="w-full h-full object-cover"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">📦</span>
          </div>
        )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>ID: {product.id}</span>
            </div>
      </div>

          {product.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {product.description}
            </p>
            )}

          {/* Price and Stock */}
          <div className="flex items-center gap-4 mb-3">
            {product.price && (
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Prix:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {product.price}€
                </span>
              </div>
            )}
            {product.stock !== undefined && (
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {product.stock}
                </span>
              </div>
            )}
          </div>

          {/* Validation info */}
          {product.validatedAt && (
            <div className="text-xs text-green-600 dark:text-green-400 mb-2">
              ✅ Validé le {new Date(product.validatedAt).toLocaleDateString()}
            </div>
          )}

          {product.rejectionReason && (
            <div className="text-xs text-red-600 dark:text-red-400 mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              ❌ Rejeté : {product.rejectionReason}
            </div>
          )}
            </div>

        {/* Actions */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <VendorProductActions
            product={product}
            onProductUpdated={onProductUpdated}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        </div>
      </div>
    </div>
  );
};
 
import React from 'react';
import { VendorProduct } from '../../types/admin-validation';

interface AdminProductCardProps {
  product: VendorProduct;
  onValidate: (productId: number, approved: boolean, reason?: string) => void;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({ product, onValidate }) => {
  const handleApprove = () => {
    onValidate(product.id, true);
  };

  const handleReject = () => {
    const reason = prompt('Raison du rejet:');
    if (reason) {
      onValidate(product.id, false, reason);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header avec type de produit */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {product.vendorName}
          </h3>
          <p className="text-gray-500 text-sm">#{product.id}</p>
        </div>

        {/* ✅ Badge type de produit */}
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            product.isWizardProduct
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {product.isWizardProduct ? '🎨 WIZARD' : '🎯 DESIGN'}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            ⏳ {product.status}
          </span>
        </div>
      </div>

      {/* ✅ Informations spécifiques selon le type */}
      {product.isWizardProduct ? (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 font-medium">🎨 Produit WIZARD</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Produit de base:</strong> {product.adminProductName || product.baseProduct?.name || 'Non défini'}
          </p>
          <p className="text-sm text-gray-600">
            ℹ️ Ce produit utilise des images personnalisées fournies par le vendeur (pas de design à valider)
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-medium">🎯 Produit Traditionnel</span>
          </div>
          {product.designCloudinaryUrl && (
            <div className="mb-2">
              <img
                src={product.designCloudinaryUrl}
                alt="Design"
                className="w-20 h-20 object-cover rounded border"
              />
            </div>
          )}
          <p className="text-sm text-gray-600">
            ℹ️ Ce produit utilise un design à valider séparément
          </p>
        </div>
      )}

      {/* Description et prix */}
      <div className="mb-4">
        <p className="text-gray-700 mb-2">{product.vendorDescription}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            {product.vendorPrice ? product.vendorPrice.toLocaleString() : '0'} FCFA
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.vendorStock || 0}
          </span>
        </div>
      </div>

      {/* Vendeur */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            👤
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {product.vendor?.firstName || ''} {product.vendor?.lastName || ''}
            </p>
            <p className="text-xs text-gray-500">
              {product.vendor?.shop_name || product.vendor?.email || 'Email non défini'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions de validation */}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          ✅ Approuver
        </button>

        <button
          onClick={handleReject}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          ❌ Rejeter
        </button>
      </div>

      {/* ✅ Message d'aide selon le type */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        {product.isWizardProduct ? (
          "🔍 Vérifiez la qualité des images et la cohérence du produit"
        ) : (
          "🔍 Vérifiez que le design a été validé avant d'approuver le produit"
        )}
      </div>
    </div>
  );
};

export default AdminProductCard;
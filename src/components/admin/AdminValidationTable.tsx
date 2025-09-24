import React, { useState } from 'react';
import { VendorProduct, ProductFilters } from '../../types/admin-validation';

interface AdminValidationTableProps {
  products: VendorProduct[];
  onValidate: (productId: number, approved: boolean, reason?: string) => void;
  onFilterChange: (filters: ProductFilters) => void;
}

const AdminValidationTable: React.FC<AdminValidationTableProps> = ({
  products,
  onValidate,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<ProductFilters>({
    productType: 'ALL'
  });

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleValidate = (productId: number, approved: boolean) => {
    if (!approved) {
      const reason = prompt('Raison du rejet:');
      if (!reason) return;
      onValidate(productId, false, reason);
    } else {
      onValidate(productId, true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* ✅ Filtres avec type de produit */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de produit
            </label>
            <select
              value={filters.productType}
              onChange={(e) => handleFilterChange({ productType: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">Tous les types</option>
              <option value="WIZARD">🎨 WIZARD seulement</option>
              <option value="TRADITIONAL">🎯 Traditionnels seulement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendeur
            </label>
            <input
              type="text"
              placeholder="Nom du vendeur..."
              onChange={(e) => handleFilterChange({ vendor: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendeur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créé le
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {/* ✅ Prévisualisation selon le type */}
                    <div className="flex-shrink-0 h-12 w-12">
                      {product.isWizardProduct ? (
                        product.vendorImages && product.vendorImages.length > 0 ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={product.vendorImages.find(img => img.imageType === 'base')?.cloudinaryUrl ||
                                 product.vendorImages[0]?.cloudinaryUrl}
                            alt="Image WIZARD"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallbackDiv = document.createElement('div');
                                fallbackDiv.className = 'fallback-icon h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center';
                                fallbackDiv.innerHTML = '<span class="text-purple-600 text-lg">🎨</span>';
                                parent.appendChild(fallbackDiv);
                              }
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 text-lg">🎨</span>
                          </div>
                        )
                      ) : (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={product.designCloudinaryUrl || '/placeholder.png'}
                          alt="Design"
                        />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.vendorName}
                      </div>
                      <div className="text-sm text-gray-500">
                        #{product.id}
                      </div>
                      {product.isWizardProduct && (
                        <div className="text-xs text-purple-600">
                          Base: {product.adminProductName || product.baseProduct?.name || 'Non défini'}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.isWizardProduct
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {product.isWizardProduct ? '🎨 WIZARD' : '🎯 DESIGN'}
                    </span>
                    {/* Badge de validation admin pour produits WIZARD */}
                    {product.isWizardProduct && product.adminValidated === false && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        ⏳ Validation requise
                      </span>
                    )}
                    {product.isWizardProduct && product.adminValidated === true && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ✅ Validé admin
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.vendor?.firstName || ''} {product.vendor?.lastName || ''}
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.vendor?.shop_name || product.vendor?.email || 'Email non défini'}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.vendorPrice ? product.vendorPrice.toLocaleString() : 'Prix non défini'} {product.vendorPrice ? 'FCFA' : ''}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidate(product.id, true)}
                      className="text-green-600 hover:text-green-900 px-3 py-1 bg-green-100 rounded"
                    >
                      ✅ Approuver
                    </button>
                    <button
                      onClick={() => handleValidate(product.id, false)}
                      className="text-red-600 hover:text-red-900 px-3 py-1 bg-red-100 rounded"
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucun produit en attente de validation
        </div>
      )}
    </div>
  );
};

export default AdminValidationTable;
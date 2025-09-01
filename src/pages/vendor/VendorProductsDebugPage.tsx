import React from 'react';
import { ProductDataDebugger } from '../../components/debug/ProductDataDebugger';

export const VendorProductsDebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Debug Produits Vendeur - Structure Mockups
          </h1>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Mode Debug :</strong> Cette page affiche toutes les données des produits vendeur 
                  avec leur structure de mockups. Utilisez la console pour voir les détails complets 
                  et le bouton "Exporter JSON" pour télécharger la structure complète.
                </p>
              </div>
            </div>
          </div>
          <ProductDataDebugger product={{}} />
        </div>
      </div>
    </div>
  );
}; 
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SellDesignPage from '../pages/vendor/SellDesignPage';
import VendorProductsPage from '../pages/vendor/VendorProductsPage';
import VendorProductPreviewDemo from '../pages/vendor/VendorProductPreviewDemo';
import VendorProductsPageWithPreview from '../pages/vendor/VendorProductsPageWithPreview';
import AppelDeFondsPage from '../pages/AppelDeFondsPage';

// Routes pour les pages vendeur
export const VendorRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Page principale de création de produits personnalisés */}
      <Route path="/vendeur/sell-design" element={<SellDesignPage />} />
      
      {/* Page des produits vendeur */}
      <Route path="/vendeur/products" element={<VendorProductsPage />} />
      
      {/* Page des produits avec aperçu avancé */}
      <Route path="/vendeur/products/preview" element={<VendorProductsPageWithPreview />} />
      
      {/* Page de démonstration des composants d'aperçu */}
      <Route path="/vendeur/products/demo" element={<VendorProductPreviewDemo />} />
      
      {/* Page d'appel de fonds */}
      <Route path="/vendeur/appel-de-fonds" element={<AppelDeFondsPage />} />
    </Routes>
  );
};

export default VendorRoutes; 
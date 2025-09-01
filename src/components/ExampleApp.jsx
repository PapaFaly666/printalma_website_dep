import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductsDisplay from './ProductsDisplay';
import CreateProductPage from './CreateProductPage';

const ExampleApp = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Route principale - redirection vers la liste des produits admin */}
          <Route path="/" element={<Navigate to="/admin/products" replace />} />
          
          {/* Page de gestion des produits admin */}
          <Route path="/admin/products" element={<ProductsDisplay />} />
          
          {/* Page de création de produit admin */}
          <Route path="/admin/add-product" element={<CreateProductPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default ExampleApp; 
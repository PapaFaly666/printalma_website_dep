import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FormAdapter from './FormAdapter';

const CreateProductPage = () => {
  const navigate = useNavigate();

  const handleProductSubmit = (productData) => {
    console.log('✅ Produit créé:', productData);
    // La redirection est gérée automatiquement par FormAdapter
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Retour à la liste"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Créer un nouveau produit</h1>
              <p className="text-gray-600 mt-1">
                Remplissez les informations ci-dessous pour créer votre produit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormAdapter 
          onSubmit={handleProductSubmit}
          enableRedirect={true}
        />
      </div>
    </div>
  );
};

export default CreateProductPage; 
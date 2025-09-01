import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Données factices pour les tests
const FAKE_CATEGORIES = [
  { id: 1, name: 'T-Shirts' },
  { id: 2, name: 'Hoodies' },
  { id: 3, name: 'Polos' },
  { id: 4, name: 'Débardeurs' }
];

const FAKE_COLORS = [
  { id: 1, name: 'Rouge', hexCode: '#FF0000' },
  { id: 2, name: 'Bleu', hexCode: '#0000FF' },
  { id: 3, name: 'Noir', hexCode: '#000000' },
  { id: 4, name: 'Blanc', hexCode: '#FFFFFF' },
  { id: 5, name: 'Vert', hexCode: '#00FF00' },
  { id: 6, name: 'Jaune', hexCode: '#FFFF00' }
];

const FAKE_SIZES = [
  { id: 1, name: 'XS' },
  { id: 2, name: 'S' },
  { id: 3, name: 'M' },
  { id: 4, name: 'L' },
  { id: 5, name: 'XL' },
  { id: 6, name: 'XXL' }
];

const FAKE_IMAGES = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400',
  'https://images.unsplash.com/photo-1583743814966-8936f37f4042?w=400'
];

const FormAdapter = ({ 
  onSubmit = (data) => console.log('Données du produit:', data),
  enableRedirect = true // Nouveau prop pour activer/désactiver la redirection
}) => {
  const navigate = useNavigate();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    colors: [],
    sizes: [],
    images: []
  });

  // États pour la validation
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Veuillez sélectionner une catégorie';
    }

    if (formData.colors.length === 0) {
      newErrors.colors = 'Veuillez sélectionner au moins une couleur';
    }

    if (formData.sizes.length === 0) {
      newErrors.sizes = 'Veuillez sélectionner au moins une taille';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Préparer les données pour la soumission avec ID unique
      const productData = {
        id: Date.now(), // ID unique pour la simulation
        ...formData,
        colors: formData.colors.map(colorId => 
          FAKE_COLORS.find(color => color.id === parseInt(colorId))
        ),
        sizes: formData.sizes.map(sizeId => 
          FAKE_SIZES.find(size => size.id === parseInt(sizeId))
        ),
        category: FAKE_CATEGORIES.find(cat => cat.id === parseInt(formData.categoryId)),
        price: Math.floor(Math.random() * 50000) + 10000, // Prix aléatoire entre 10000 et 60000
        stock: Math.floor(Math.random() * 100) + 1, // Stock aléatoire entre 1 et 100
        featured: Math.random() > 0.5, // Featured aléatoire
        status: Math.random() > 0.3 ? 'PUBLISHED' : 'DRAFT', // Status aléatoire
        description: `Description détaillée pour ${formData.name}. Ce produit est de haute qualité et disponible en plusieurs couleurs et tailles.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🔄 [FormAdapter] Création du produit...', productData);

      // Simuler la sauvegarde en localStorage
      const existingProducts = JSON.parse(localStorage.getItem('fake_products') || '[]');
      const updatedProducts = [productData, ...existingProducts];
      localStorage.setItem('fake_products', JSON.stringify(updatedProducts));

      console.log('💾 [FormAdapter] Produit sauvegardé en localStorage');

      await onSubmit(productData);
      
      console.log('✅ [FormAdapter] onSubmit appelé avec succès');

      // Réinitialiser le formulaire après soumission réussie
      setFormData({
        name: '',
        categoryId: '',
        colors: [],
        sizes: [],
        images: []
      });
      setErrors({});
      
      console.log('🧹 [FormAdapter] Formulaire réinitialisé');
      
      // Redirection vers la page d'affichage si activée
      if (enableRedirect) {
        console.log('🔄 [FormAdapter] Redirection activée, navigation vers /admin/products...');
        
        // Redirection immédiate sans setTimeout
        navigate('/admin/products', { 
          state: { 
            newProduct: productData,
            message: `Produit "${productData.name}" créé avec succès!`
          }
        });
        
        console.log('✅ [FormAdapter] Navigate appelé');
      } else {
        console.log('ℹ️ [FormAdapter] Redirection désactivée');
      }
      
    } catch (error) {
      console.error('❌ [FormAdapter] Erreur lors de la soumission:', error);
      setErrors({ submit: 'Erreur lors de la création du produit' });
    } finally {
      setIsSubmitting(false);
      console.log('🏁 [FormAdapter] isSubmitting = false');
    }
  };

  // Gestion des changements de champs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Supprimer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Gestion des sélections multiples
  const handleMultiSelect = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));

    // Supprimer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Ajouter une image (simulation d'upload)
  const handleAddImage = () => {
    const randomImage = FAKE_IMAGES[Math.floor(Math.random() * FAKE_IMAGES.length)];
    if (!formData.images.includes(randomImage)) {
      handleInputChange('images', [...formData.images, randomImage]);
    }
  };

  // Supprimer une image
  const handleRemoveImage = (indexToRemove) => {
    handleInputChange('images', formData.images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Créer un nouveau produit</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom du produit */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: T-shirt Premium Coton"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Catégorie */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <select
            id="category"
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.categoryId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner une catégorie</option>
            {FAKE_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
        </div>

        {/* Couleurs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleurs disponibles * ({formData.colors.length} sélectionnée{formData.colors.length > 1 ? 's' : ''})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FAKE_COLORS.map(color => (
              <label 
                key={color.id}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  formData.colors.includes(color.id.toString()) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.colors.includes(color.id.toString())}
                  onChange={(e) => handleMultiSelect('colors', color.id.toString(), e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hexCode }}
                />
                <span className="text-sm">{color.name}</span>
              </label>
            ))}
          </div>
          {errors.colors && <p className="text-red-500 text-xs mt-1">{errors.colors}</p>}
        </div>

        {/* Tailles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tailles disponibles * ({formData.sizes.length} sélectionnée{formData.sizes.length > 1 ? 's' : ''})
          </label>
          <div className="flex flex-wrap gap-2">
            {FAKE_SIZES.map(size => (
              <label 
                key={size.id}
                className={`px-4 py-2 border rounded-md cursor-pointer transition-all hover:bg-gray-50 ${
                  formData.sizes.includes(size.id.toString())
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.sizes.includes(size.id.toString())}
                  onChange={(e) => handleMultiSelect('sizes', size.id.toString(), e.target.checked)}
                  className="sr-only"
                />
                {size.name}
              </label>
            ))}
          </div>
          {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images du produit ({formData.images.length})
          </label>
          
          <button
            type="button"
            onClick={handleAddImage}
            className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            + Ajouter une image (factice)
          </button>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Produit ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Erreur générale */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer le produit'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                categoryId: '',
                colors: [],
                sizes: [],
                images: []
              });
              setErrors({});
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormAdapter; 
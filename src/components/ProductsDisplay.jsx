import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, Edit2, Trash2, Plus, Search, Filter, Star } from 'lucide-react';

const ProductsDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Charger les produits depuis localStorage
  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem('fake_products') || '[]');
    setProducts(savedProducts);
    setFilteredProducts(savedProducts);
    
    // Afficher message de succès si on vient de créer un produit
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state]);

  // Filtrer les produits
  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category?.id === parseInt(selectedCategory)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Obtenir les catégories uniques
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price).replace('XOF', 'CFA');
  };

  // Supprimer un produit
  const handleDelete = (productId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      localStorage.setItem('fake_products', JSON.stringify(updatedProducts));
    }
  };

  // Basculer le statut featured
  const toggleFeatured = (productId) => {
    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, featured: !p.featured } : p
    );
    setProducts(updatedProducts);
    localStorage.setItem('fake_products', JSON.stringify(updatedProducts));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
              <p className="text-gray-600 mt-2">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <button
              onClick={() => navigate('/admin/add-product')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Nouveau Produit
            </button>
          </div>

          {/* Message de succès */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
              {successMessage}
            </div>
          )}

          {/* Filtres */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtre par catégorie */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des produits */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {products.length === 0 ? 'Aucun produit créé' : 'Aucun produit trouvé'}
            </h3>
            <p className="text-gray-500 mb-6">
              {products.length === 0 ? 'Commencez par créer votre premier produit' : 'Essayez de modifier vos critères de recherche'}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => navigate('/admin/add-product')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Créer un produit
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                
                {/* Image du produit */}
                <div className="relative">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  
                  {/* Badge featured */}
                  {product.featured && (
                    <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star size={12} />
                      Featured
                    </div>
                  )}
                  
                  {/* Badge status */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold ${
                    product.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{product.name}</h3>
                  
                  {/* Catégorie */}
                  <p className="text-sm text-gray-600 mb-2">{product.category?.name}</p>
                  
                  {/* Prix et stock */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Couleurs et tailles */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-600">Couleurs:</span>
                      <div className="flex gap-1">
                        {product.colors?.slice(0, 4).map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.hexCode }}
                            title={color.name}
                          />
                        ))}
                        {product.colors?.length > 4 && (
                          <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Tailles:</span>
                      <span className="text-xs text-gray-500">
                        {product.sizes?.map(s => s.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFeatured(product.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          product.featured 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={product.featured ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Star size={16} />
                      </button>
                      
                      <button
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsDisplay; 
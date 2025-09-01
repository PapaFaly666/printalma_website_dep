import React, { useState } from "react";
import { ChevronDown, ChevronUp, Heart, Filter, Venus, Baby, Home, FileText, ShoppingBag } from "lucide-react";

// Composant SVG pour l'icône Mars/Homme
const MarsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 3h5v5"/>
    <path d="m21 3-6.75 6.75"/>
    <circle cx="10" cy="14" r="6"/>
  </svg>
);

export default function ProductsPage() {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [productsOpen, setProductsOpen] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    category: null, // Changé en sélection unique
    products: [],
    colors: [],
    priceRange: "",
    sortBy: "Trier Par"
  });
  const [viewMode, setViewMode] = useState("Produits");

  const categories = [
    { id: "hommes", name: "Hommes", icon: MarsIcon },
    { id: "femmes", name: "Femmes", icon: Venus },
    { id: "enfants", name: "Enfants", icon: Baby },
    { id: "bebes", name: "Bébés", icon: Baby },
    { id: "accessoires", name: "Accessoires", icon: ShoppingBag },
    { id: "maison", name: "Maison & décor", icon: Home },
    { id: "stickers", name: "Stickers", icon: FileText }
  ];

  const productTypes = [
    "T-shirts",
    "Sweat-shirts", 
    "Casquettes et bonnets",
    "Sacs et sacs à dos",
    "Mugs et tasses",
    "Gourdes",
    "Stickers"
  ];

  const products = [
    {
      id: 1,
      name: "T-shirt court oversize Femme",
      subtitle: "Je n'ai jamais voulu grandir",
      price: "13.500 FCFA",
      image: "/9.jpg",
      badge: null,
      category: "Femmes"
    },
    {
      id: 2,
      name: "Casquette vintage décontractée",
      subtitle: "Lettrage Sunny Vibes brodé",
      price: "14.500 FCFA",
      image: "/11.jpg",
      badge: "Brodé",
      badgeColor: "bg-blue-600",
      category: "Accessoires"
    },
    {
      id: 3,
      name: "T-shirt bio oversize Stanley/Stella Unisexe",
      subtitle: "Fui ou regretter",
      price: "16.500 FCFA",
      image: "/10.jpg",
      badge: "Durable",
      badgeColor: "bg-green-600",
      category: "Hommes"
    },
    {
      id: 4,
      name: "Sweat-shirt à capuche Premium",
      subtitle: "Design exclusif",
      price: "23.000 FCFA",
      image: "/7.jpg",
      badge: null,
      category: "Hommes"
    },
    {
      id: 5,
      name: "Mug céramique personnalisé",
      subtitle: "Design artistique",
      price: "8.000 FCFA",
      image: "/8.jpg",
      badge: null,
      category: "Maison"
    },
    {
      id: 6,
      name: "Sac tote canvas bio",
      subtitle: "Écologique et tendance",
      price: "11.500 FCFA",
      image: "/10.jpg",
      badge: "Durable",
      badgeColor: "bg-green-600",
      category: "Accessoires"
    }
  ];

  const toggleCategory = (categoryId) => {
    setSelectedFilters(prev => ({
      ...prev,
      category: prev.category === categoryId ? null : categoryId // Sélection unique, déselection si déjà sélectionné
    }));
  };

  const toggleProduct = (productType) => {
    setSelectedFilters(prev => ({
      ...prev,
      products: prev.products.includes(productType)
        ? prev.products.filter(type => type !== productType)
        : [...prev.products, productType]
    }));
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
      {/* Breadcrumb avec dégradé */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-gray-500">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Accueil</span>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">Acheter</span>
          </nav>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec gradient */}
        <div className="mb-8">
          <div 
            className="rounded-2xl p-8 mb-6 shadow-lg"
            style={{
              background: "linear-gradient(90deg, #1E88E5 0%, #5C6BC0 25%, #7B1FA2 50%, #C2185B 75%, #D32F2F 100%)"
            }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">Nos meilleures ventes</h1>
            <p className="text-white/90 text-lg">Découvrez notre sélection de produits les plus populaires</p>
          </div>
          
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-white rounded-xl p-4 shadow-md">
            <div className="flex flex-wrap gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-100 transition-colors">
                  <option>Trier Par</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                  <option>Nouveautés</option>
                  <option>Popularité</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Colors Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-100 transition-colors">
                  <option>Couleurs</option>
                  <option>Blanc</option>
                  <option>Noir</option>
                  <option>Bleu</option>
                  <option>Rouge</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Quick Filters avec les couleurs du thème */}
              <button className="bg-green-100 text-green-700 border border-green-200 rounded-lg px-4 py-2.5 text-sm hover:bg-green-200 transition-colors font-medium">
                Durable
              </button>
              <button className="bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-4 py-2.5 text-sm hover:bg-blue-200 transition-colors font-medium">
                Brodé
              </button>

              {/* Price Range Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-100 transition-colors">
                  <option>Marge De Prix</option>
                  <option>0 - 10.000 FCFA</option>
                  <option>10.000 - 20.000 FCFA</option>
                  <option>20.000 - 30.000 FCFA</option>
                  <option>30.000+ FCFA</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* More Filters */}
              <button className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium">
                <Filter className="h-4 w-4" />
                Plus de filtres
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 text-sm bg-gray-100 rounded-lg p-1">
              <span className="text-gray-600 px-2">Affichage:</span>
              <button 
                onClick={() => setViewMode("Produits")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === "Produits" 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Produits
              </button>
              <button 
                onClick={() => setViewMode("Design")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === "Design" 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Design
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="w-72 flex-shrink-0">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 hover:bg-gray-50 rounded-t-xl transition-colors"
              >
                <span>Catégories</span>
                {categoriesOpen ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
              </button>
              
              {categoriesOpen && (
                <div className="px-5 pb-5 space-y-3">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button 
                        key={category.id} 
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-colors group ${
                          selectedFilters.category === category.id 
                            ? 'bg-blue-50 border-blue-200 border' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className={`h-5 w-5 transition-all ${
                          selectedFilters.category === category.id
                            ? 'text-blue-600 scale-110'
                            : 'text-gray-600 group-hover:text-blue-600 group-hover:scale-110'
                        }`} />
                        <span className={`text-sm font-medium transition-colors ${
                          selectedFilters.category === category.id
                            ? 'text-blue-700'
                            : 'text-gray-700 group-hover:text-gray-900'
                        }`}>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100">
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 hover:bg-gray-50 rounded-t-xl transition-colors"
              >
                <span>Produits</span>
                {productsOpen ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
              </button>
              
              {productsOpen && (
                <div className="px-5 pb-5 space-y-3">
                  {productTypes.map((productType) => (
                    <label key={productType} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors group">
                      <input
                        type="checkbox"
                        checked={selectedFilters.products.includes(productType)}
                        onChange={() => toggleProduct(productType)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">{productType}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
                     style={{ aspectRatio: "4 / 5" }}>
                  
                  {/* Image de fond */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />

                  {/* Badge en haut */}
                  {product.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full text-white shadow-lg ${product.badgeColor}`}>
                        {product.badge}
                      </span>
                    </div>
                  )}

                  {/* Bouton favoris en haut à droite */}
                  <button className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 group/heart">
                    <Heart className="h-4 w-4 text-gray-600 group-hover/heart:text-red-500 group-hover/heart:scale-110 transition-all" />
                  </button>

                  {/* Overlay texte en bas */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 z-10">
                    <div className="mb-2">
                      <span className="bg-white text-black px-2 py-1 rounded text-sm font-bold">
                        {product.price}
                      </span>
                    </div>
                    <div className="text-white">
                      <h3 className="font-bold text-lg leading-tight mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-200 font-medium">
                        {product.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-12 text-center">
              <button 
                className="px-8 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Charger plus de produits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
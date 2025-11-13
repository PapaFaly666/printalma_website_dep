import { useState, useEffect, useRef } from "react";
import { ShoppingCart, LayoutDashboard, ChevronRight, X } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { categoriesService, Category } from "../services/categoriesService";
import { subCategoriesService, SubCategory } from "../services/subCategoriesService";

const NavBar = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);

  const VISIBLE_CATEGORIES_LIMIT = 4;
  // Filtrer pour n'afficher que les catégories avec des sous-catégories
  const categoriesWithSubCategories = categories.filter(category =>
    subCategories.some(sub => sub.categoryId === category.id)
  );
  const visibleCategories = categoriesWithSubCategories.slice(0, VISIBLE_CATEGORIES_LIMIT);
  const hiddenCategories = categoriesWithSubCategories.slice(VISIBLE_CATEGORIES_LIMIT);

  const { itemCount, openCart } = useCart();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isSuperAdmin, isVendeur, logout } = useAuth();

  // Charger les catégories et sous-catégories
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, subCategoriesData] = await Promise.all([
          categoriesService.getActiveCategories(),
          subCategoriesService.getAllSubCategories()
        ]);
        setCategories(categoriesData);
        setSubCategories(subCategoriesData.filter(sub => sub.isActive));
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Debug pour voir les changements du panier
  useEffect(() => {
    console.log('🛒 [NavBar] itemCount mis à jour:', itemCount);
  }, [itemCount]);

  // Gérer le scroll pour masquer/afficher le header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY) {
        // Scroll vers le haut - afficher le header
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll vers le bas avec un seuil de 100px - masquer le header
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleCategoryClick = (category?: Category, subCategory?: SubCategory) => {
    if (subCategory) {
      console.log(`Navigate to: /filtered-articles?category=${subCategory.name}`);
      navigate(`/filtered-articles?category=${subCategory.name}`);
    } else if (category) {
      console.log(`Navigate to: /filtered-articles?category=${category.name}`);
      navigate(`/filtered-articles?category=${category.name}`);
    } else {
      // Cas où on clique sur "Personnalisation" sans catégorie spécifique
      navigate('/customize-product');
    }
    setIsMobileMenuOpen(false);
    setShowAllCategoriesModal(false);
  };

  return (
    <>
      {/* Header supérieur - Blanc avec logo et actions - Disparaît au scroll */}
      <div 
        className={`bg-white h-14 sm:h-16 md:h-18 lg:h-20 xl:h-22 2xl:h-24 border-b border-gray-100 transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50
        }}
      >
        {/* Container principal avec même padding que ArtistesSection */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo Printalma */}
          <div className="flex-shrink-0 flex items-center">
            <div
              className="cursor-pointer flex items-center justify-center"
              onClick={() => navigate("/")}
            >
              <img
                src="/printalma_logo.svg"
                alt="Logo Printalma"
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 xl:h-36 xl:w-36 2xl:h-40 2xl:w-40 object-contain transition-all duration-200"
              />
            </div>
          </div>

          {/* Barre de recherche centrale - Repositionnée */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-lg">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Recherche de designs/produits"
                className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-3 xl:py-3.5 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base xl:text-lg transition-all duration-200"
                onClick={() => setShowSearchModal(true)}
                readOnly
              />
            </div>
          </div>

          {/* Actions droite */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Bouton Devenir Vendeur */}
            <button
              style={{ backgroundColor: "#F2D12E", color: "black" }}
              className="hidden sm:flex text-black font-semibold px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 xl:px-6 xl:py-3 rounded-full text-xs sm:text-sm lg:text-base xl:text-lg items-center space-x-1 lg:space-x-2 hover:bg-yellow-400 transition-all duration-200"
            >
              <img
                src="/marketplace.svg"
                alt="marketplace"
                className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5"
              />
              <span>Devenir Vendeur</span>
            </button>

            {/* Recherche mobile */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="md:hidden text-gray-700 hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10 rounded-md flex items-center justify-center transition-all duration-200"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Panier */}
            <button
              onClick={() => {
                console.log('🛒 [NavBar] Clic sur l icône panier, itemCount:', itemCount);
                openCart();
              }}
              className="text-gray-700 hover:bg-gray-100 relative flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-md transition-all duration-200"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Compte */}
            <div className="hidden md:block relative group">
              <button className="text-gray-700 hover:bg-gray-100 flex items-center space-x-1 lg:space-x-2 px-2 py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-2.5 rounded-md transition-all duration-200">
                <img src="/connexion.svg" alt="connexion" className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                <span className="hidden lg:inline text-sm lg:text-base xl:text-lg">
                  {isAuthenticated && user ? `${user.firstName} ${user.lastName}` : 'Compte'}
                </span>
                <svg className="h-3 w-3 lg:h-4 lg:w-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {isAuthenticated && user ? (
                    <>
                      {/* Bouton pour retourner à l'interface admin/vendeur */}
                      {(isAdmin() || isSuperAdmin() || isVendeur()) && (
                        <>
                          <button
                            onClick={() => {
                              if (isVendeur()) {
                                navigate('/vendeur/dashboard');
                              } else if (isAdmin() || isSuperAdmin()) {
                                navigate('/admin/dashboard');
                              }
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-[#049be5]/10 transition-colors text-sm flex items-center gap-2 text-[#049be5] font-medium"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {isVendeur() ? 'Mon espace vendeur' : 'Mon espace admin'}
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                        </>
                      )}

                      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                        {user.email}
                      </div>

                      <button
                        onClick={() => {
                          logout();
                          navigate('/');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors text-sm text-red-600"
                      >
                        Se déconnecter
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                      >
                        Se connecter
                      </button>
                      <button
                        onClick={() => navigate('/register')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                      >
                        S'inscrire
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Favoris */}
            <button className="relative text-gray-700 hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 xl:h-12 xl:w-12 rounded-md flex items-center justify-center transition-all duration-200">
              <svg className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 bg-pink-500 text-white text-xs lg:text-sm rounded-full flex items-center justify-center font-medium">
                2
              </span>
            </button>

            {/* Menu mobile */}
            <button
              className="lg:hidden text-gray-700 hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9 rounded-md flex items-center justify-center transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Spacer pour compenser le header fixe */}
      <div className="h-14 sm:h-16 md:h-18 lg:h-20 xl:h-22 2xl:h-24"></div>

      {/* Menu Navigation - STICKY - Dégradé bleu exact comme l'image */}
      <nav
        className={`h-12 sm:h-14 lg:h-16 xl:h-18 sticky z-40 shadow-sm transition-all duration-300 ${
          isHeaderVisible ? 'top-14 sm:top-16 md:top-18 lg:top-20 xl:top-22 2xl:top-24' : 'top-0'
        }`}
        style={{
          background:
            "linear-gradient(90deg, #1E88E5 0%, #5C6BC0 25%, #7B1FA2 50%, #C2185B 75%, #D32F2F 100%)",
        }}
      >
        {/* Container principal avec même padding que ArtistesSection */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-center h-full">
            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Bouton Personnalisation toujours visible avec icône fire */}
              <button
                onClick={() => handleCategoryClick()}
                className="py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-medium transition-colors text-sm lg:text-base xl:text-lg flex items-center space-x-1 lg:space-x-2"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5"
                />
                <span>Personnalisation</span>
              </button>

              {loading ? (
                <div className="flex items-center space-x-8">
                  <div className="text-white/80 text-sm">Chargement...</div>
                </div>
              ) : (
                <>
                  {visibleCategories.map((category) => {
                    const categorySubCategories = subCategories.filter(sub => sub.categoryId === category.id);

                    return (
                      <div key={category.id} className="relative group">
                        {categorySubCategories.length > 0 ? (
                          <>
                            <button className="flex items-center space-x-1 lg:space-x-2 py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-medium transition-colors text-sm lg:text-base xl:text-lg">
                              <span>{category.name}</span>
                              <svg className="h-3 w-3 lg:h-4 lg:w-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {/* Dropdown */}
                            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <div className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                  {categorySubCategories.map((subCategory) => (
                                    <button
                                      key={subCategory.id}
                                      onClick={() => handleCategoryClick(category, subCategory)}
                                      className="text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                      <div className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                        {subCategory.name}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <button
                                    onClick={() => handleCategoryClick(category)}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                  >
                                    Voir tout dans {category.name} →
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => handleCategoryClick(category)}
                            className="py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-medium transition-colors text-sm lg:text-base xl:text-lg flex items-center space-x-1 lg:space-x-2"
                          >
                            <span>{category.name}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Bouton "Voir plus" si plus de 4 catégories avec sous-catégories */}
                  {categoriesWithSubCategories.length > VISIBLE_CATEGORIES_LIMIT && (
                    <button
                      onClick={() => setShowAllCategoriesModal(true)}
                      className="flex items-center space-x-1 lg:space-x-2 py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-medium transition-colors text-sm lg:text-base xl:text-lg"
                    >
                      <span>Plus</span>
                      <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Navigation Medium */}
            <div className="hidden md:flex lg:hidden items-center space-x-4 lg:space-x-6">
              {/* Bouton Personnalisation toujours visible avec icône fire */}
              <button
                onClick={() => handleCategoryClick()}
                className="py-2 lg:py-3 text-white hover:text-white/80 font-medium transition-colors text-sm lg:text-base flex items-center space-x-1 lg:space-x-2"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-3 h-3 lg:w-4 lg:h-4"
                />
                <span>Personnalisation</span>
              </button>

              {loading ? (
                <div className="text-white/80 text-sm">Chargement...</div>
              ) : (
                categories.slice(0, 2).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="py-2 lg:py-3 text-white hover:text-white/80 font-medium transition-colors text-sm lg:text-base flex items-center space-x-1 lg:space-x-2"
                  >
                    <span>{category.name}</span>
                  </button>
                ))
              )}
            </div>

            {/* Navigation Mobile */}
            <div className="flex md:hidden items-center space-x-2 sm:space-x-3">
              {/* Bouton Personnalisation toujours visible avec icône fire */}
              <button
                onClick={() => handleCategoryClick()}
                className="py-2 sm:py-3 text-white hover:text-white/80 font-medium transition-colors text-xs sm:text-sm flex items-center space-x-1"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                />
                <span>Perso</span>
              </button>

              {loading ? (
                <div className="text-white/80 text-xs">Chargement...</div>
              ) : (
                categories.slice(0, 1).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="py-2 sm:py-3 text-white hover:text-white/80 font-medium transition-colors text-xs sm:text-sm flex items-center space-x-1"
                  >
                    <span>{category.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg relative z-30">
          {/* Container principal avec même padding que ArtistesSection */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-2">
              {/* Auth section mobile */}
              <div className="flex space-x-2 pb-4 border-b border-gray-200 mb-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded-md">
                  Se connecter
                </button>
                <button className="flex-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-sm rounded-md">
                  S'inscrire
                </button>
              </div>

              {/* Bouton Personnalisation toujours visible avec icône fire */}
              <button
                onClick={() => handleCategoryClick()}
                className="w-full text-left py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-4 h-4"
                />
                <span>Personnalisation</span>
              </button>

              {/* Categories */}
              {loading ? (
                <div className="text-gray-500 text-sm py-3 px-4">Chargement des catégories...</div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full text-left py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>{category.name}</span>
                  </button>
                ))
              )}

              {/* Devenir Vendeur button mobile */}
              <button className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4 py-2 text-sm rounded-md flex items-center justify-center space-x-1">
                <img
                  src="/marketplace.svg"
                  alt="marketplace"
                  className="h-4 w-4"
                />
                <span>Devenir Vendeur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recherche */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          {/* Container principal avec même padding que ArtistesSection */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    placeholder="Rechercher des designs/produits"
                    className="w-full pl-12 pr-12 h-14 text-lg border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    "T-shirts",
                    "Sweats",
                    "Posters",
                    "Casquettes",
                    "Art Digital",
                    "Bijoux",
                  ].map((category) => (
                    <button
                      key={category}
                      className="p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSearchModal(false)}
            className="absolute top-6 right-6 p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal pour afficher toutes les catégories */}
      {showAllCategoriesModal && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAllCategoriesModal(false)}
          />

          {/* Modal minimaliste */}
          <div className="relative mx-auto w-full max-w-5xl bg-white m-4 max-h-[80vh] flex flex-col rounded-lg shadow-xl">
            {/* Header simple */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Toutes les catégories
              </h3>
              <button
                onClick={() => setShowAllCategoriesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content minimaliste */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-1">
                {categoriesWithSubCategories.map((category) => {
                  const categorySubCategories = subCategories.filter(sub => sub.categoryId === category.id);

                  return (
                    <div key={category.id} className="border-b border-gray-100">
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        onClick={() => handleCategoryClick(category)}
                      >
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {categorySubCategories.length}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      {/* Sous-catégories toujours visibles */}
                      <div className="px-4 pb-3 bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                          {categorySubCategories.map((subCategory) => (
                            <button
                              key={subCategory.id}
                              onClick={() => handleCategoryClick(category, subCategory)}
                              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-white hover:text-blue-600 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
                            >
                              {subCategory.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;
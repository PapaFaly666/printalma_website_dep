import { useState, useEffect, useRef } from "react";
import { ShoppingCart, LayoutDashboard, ChevronRight, X } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { categoriesService, Category } from "../services/categoriesService";
import { subCategoriesService, SubCategory } from "../services/subCategoriesService";
import Button from "./ui/Button";

const NavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const VISIBLE_CATEGORIES_LIMIT = 4;
  // Filtrer pour n'afficher que les catégories avec des sous-catégories
  const categoriesWithSubCategories = categories.filter(category =>
    subCategories.some(sub => sub.categoryId === category.id)
  );
  const visibleCategories = categoriesWithSubCategories.slice(0, VISIBLE_CATEGORIES_LIMIT);
  const hiddenCategories = categoriesWithSubCategories.slice(VISIBLE_CATEGORIES_LIMIT);

  const { itemCount, openCart } = useCart();
  const { favoritesCount, openFavorites } = useFavorites();
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/filtered-articles?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
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
        <div className="w-full px-6 h-full flex items-center justify-between">
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
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Recherche de designs/produits"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-3 xl:py-3.5 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base xl:text-lg transition-all duration-200"
              />
            </form>
          </div>

          {/* Actions droite */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Bouton Devenir Vendeur */}
            <Button
              onClick={() => navigate('/devenir-vendeur')}
              variant="primary"
              size="lg"
              className="hidden sm:flex"
              icon={
                <img
                  src="/marketplace.svg"
                  alt="marketplace"
                  className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
                />
              }
            >
              Devenir Vendeur
            </Button>


            {/* Panier */}
            <div className="relative">
              <Button
                onClick={() => {
                  console.log('🛒 [NavBar] Clic sur l icône panier, itemCount:', itemCount);
                  openCart();
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />}
              />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </div>

            {/* Compte */}
            <div className="hidden md:block relative group">
              <Button
                variant="ghost"
                size="md"
                icon={<img src="/connexion.svg" alt="connexion" className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />}
                iconPosition="left"
                className="space-x-1 lg:space-x-2"
              >
                <span className="hidden lg:inline text-sm lg:text-base xl:text-lg">
                  {isAuthenticated && user ? `${user.firstName} ${user.lastName}` : 'Compte'}
                </span>
                <svg className="h-3 w-3 lg:h-4 lg:w-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>

              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {isAuthenticated && user ? (
                    <>
                      {/* Bouton pour retourner à l'interface admin/vendeur */}
                      {(isAdmin() || isSuperAdmin() || isVendeur()) && (
                        <>
                          <Button
                            onClick={() => {
                              if (isVendeur()) {
                                navigate('/vendeur/dashboard');
                              } else if (isAdmin() || isSuperAdmin()) {
                                navigate('/admin/dashboard');
                              }
                            }}
                            variant="ghost"
                            size="md"
                            fullWidth
                            className="justify-start hover:bg-[#049be5]/10 text-[#049be5] rounded-lg"
                            icon={<LayoutDashboard className="w-5 h-5" />}
                          >
                            {isVendeur() ? 'Mon espace vendeur' : 'Mon espace admin'}
                          </Button>
                          <div className="border-t border-gray-100 my-1"></div>
                        </>
                      )}

                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                        {user.email}
                      </div>

                      <Button
                        onClick={() => {
                          logout();
                          navigate('/');
                        }}
                        variant="danger"
                        size="md"
                        fullWidth
                        className="justify-start hover:bg-red-50 rounded-lg"
                      >
                        Se déconnecter
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => navigate('/login')}
                        variant="secondary"
                        size="md"
                        fullWidth
                        className="mb-2 rounded-lg"
                      >
                        Se connecter
                      </Button>
                      <Button
                        onClick={() => navigate('/register')}
                        variant="outline"
                        size="md"
                        fullWidth
                        className="rounded-lg"
                      >
                        S'inscrire
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Favoris */}
            <div className="relative">
              <Button
                onClick={() => {
                  console.log('💖 [NavBar] Clic sur l icône favoris, favoritesCount:', favoritesCount);
                  openFavorites();
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 xl:h-12 xl:w-12 p-0"
                icon={
                  <svg className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 bg-pink-500 text-white text-xs lg:text-sm rounded-full flex items-center justify-center font-medium">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </div>

            {/* Menu mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              icon={
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Spacer pour compenser le header fixe */}
      <div className="h-14 sm:h-16 md:h-18 lg:h-20 xl:h-22 2xl:h-24"></div>

      {/* Menu Navigation - STICKY - Dégradé bleu exact comme l'image */}
      <nav
        className={`h-14 sm:h-16 lg:h-18 xl:h-20 2xl:h-22 sticky z-40 shadow-sm transition-all duration-300 ${
          isHeaderVisible ? 'top-14 sm:top-16 md:top-18 lg:top-20 xl:top-22 2xl:top-24' : 'top-0'
        }`}
        style={{
          background:
            "linear-gradient(90deg, #1E88E5 0%, #5C6BC0 25%, #7B1FA2 50%, #C2185B 75%, #D32F2F 100%)",
        }}
      >
        {/* Container principal avec même padding que ArtistesSection */}
        <div className="container mx-auto px-0 h-full">
          <div className="flex items-center justify-center h-full">
            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Bouton Personnalisation toujours visible avec icône fire */}
              <button
                onClick={() => handleCategoryClick()}
                className="py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-semibold transition-colors text-base lg:text-lg xl:text-xl flex items-center space-x-1 lg:space-x-2"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                />
                <span>Personnalisation</span>
              </button>

              {loading ? (
                <div className="flex items-center space-x-8">
                  <div className="text-white/80 text-base lg:text-lg">Chargement...</div>
                </div>
              ) : (
                <>
                  {visibleCategories.map((category) => {
                    const categorySubCategories = subCategories.filter(sub => sub.categoryId === category.id);

                    return (
                      <div key={category.id} className="relative group">
                        {categorySubCategories.length > 0 ? (
                          <>
                            <button className="flex items-center space-x-1 lg:space-x-2 py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-semibold transition-colors text-base lg:text-lg xl:text-xl">
                              <span>{category.name}</span>
                              <svg className="h-4 w-4 lg:h-5 lg:w-5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                      <div className="font-semibold text-base lg:text-lg text-gray-900 hover:text-blue-600 transition-colors">
                                        {subCategory.name}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <Button
                                    onClick={() => handleCategoryClick(category)}
                                    variant="ghost"
                                    size="md"
                                    className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                                  >
                                    Voir tout dans {category.name} →
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => handleCategoryClick(category)}
                            className="py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-semibold transition-colors text-base lg:text-lg xl:text-xl flex items-center space-x-1 lg:space-x-2"
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
                      className="flex items-center space-x-1 lg:space-x-2 py-2 lg:py-3 xl:py-4 text-white hover:text-white/80 font-semibold transition-colors text-base lg:text-lg xl:text-xl"
                    >
                      <span>Plus</span>
                      <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
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
                className="py-2 lg:py-3 text-white hover:text-white/80 font-semibold transition-colors text-base lg:text-lg flex items-center space-x-1 lg:space-x-2"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-4 h-4 lg:w-5 lg:h-5"
                />
                <span>Personnalisation</span>
              </button>

              {loading ? (
                <div className="text-white/80 text-base lg:text-lg">Chargement...</div>
              ) : (
                categories.slice(0, 2).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="py-2 lg:py-3 text-white hover:text-white/80 font-semibold transition-colors text-base lg:text-lg flex items-center space-x-1 lg:space-x-2"
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
                className="py-2 sm:py-3 text-white hover:text-white/80 font-semibold transition-colors text-sm sm:text-base flex items-center space-x-1"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
                <span>Perso</span>
              </button>

              {loading ? (
                <div className="text-white/80 text-sm sm:text-base">Chargement...</div>
              ) : (
                categories.slice(0, 1).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="py-2 sm:py-3 text-white hover:text-white/80 font-semibold transition-colors text-sm sm:text-base flex items-center space-x-1"
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
          <div className="container mx-auto px-0 py-2">
            <div className="space-y-2">
              {/* Auth section mobile */}
              <div className="flex space-x-2 pb-4 border-b border-gray-200 mb-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                >
                  Se connecter
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  variant="outline"
                  size="md"
                  className="flex-1"
                >
                  S'inscrire
                </Button>
              </div>

              {/* Bouton Personnalisation toujours visible avec icône fire */}
              <button
                onClick={() => handleCategoryClick()}
                className="w-full text-left py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2 text-base font-medium"
              >
                <img
                  src="/fire.svg"
                  alt="Fire"
                  className="w-5 h-5"
                />
                <span>Personnalisation</span>
              </button>

              {/* Categories */}
              {loading ? (
                <div className="text-gray-500 text-base py-3 px-4">Chargement des catégories...</div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full text-left py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2 text-base font-medium"
                  >
                    <span>{category.name}</span>
                  </button>
                ))
              )}

              {/* Devenir Vendeur button mobile */}
              <Button
                onClick={() => {
                  navigate('/devenir-vendeur');
                  setIsMobileMenuOpen(false);
                }}
                variant="primary"
                size="lg"
                fullWidth
                className="mt-4"
                icon={
                  <img
                    src="/marketplace.svg"
                    alt="marketplace"
                    className="h-5 w-5 lg:h-6 lg:w-6"
                  />
                }
              >
                Devenir Vendeur
              </Button>
            </div>
          </div>
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
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">
                Toutes les catégories
              </h3>
              <Button
                onClick={() => setShowAllCategoriesModal(false)}
                variant="ghost"
                size="sm"
                className="p-0 h-10 w-10"
                icon={<X className="w-6 h-6 text-gray-500" />}
              />
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
                        <span className="font-semibold text-base lg:text-lg text-gray-900">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-base text-gray-500">
                            {categorySubCategories.length}
                          </span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      {/* Sous-catégories toujours visibles */}
                      <div className="px-4 pb-3 bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                          {categorySubCategories.map((subCategory) => (
                            <Button
                              key={subCategory.id}
                              onClick={() => handleCategoryClick(category, subCategory)}
                              variant="outline"
                              size="sm"
                              className="hover:bg-white hover:text-blue-600 hover:border-blue-300"
                            >
                              {subCategory.name}
                            </Button>
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
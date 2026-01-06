import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interface pour un produit favori (stocke toutes les données nécessaires)
export interface FavoriteProduct {
  id: number;
  vendorName: string;
  price: number;
  status: string; // Required for compatibility with VendorProductFromAPI
  defaultColorId?: number;
  adminProduct?: any;
  designApplication: any; // Required for compatibility with VendorProductFromAPI
  designPositions: any[]; // Required for compatibility with VendorProductFromAPI
  designTransforms: any[]; // Required for compatibility with VendorProductFromAPI
  selectedColors: any[]; // Required for compatibility with VendorProductFromAPI
  selectedSizes?: any[];
  images?: any;
  designId: number | null; // Required for compatibility with VendorProductFromAPI
  vendor?: any;
  addedAt: number; // Timestamp pour l'ordre d'ajout
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  favoritesCount: number;
  isFavoritesOpen: boolean;
  addToFavorites: (product: any) => void;
  removeFromFavorites: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: any) => void;
  openFavorites: () => void;
  closeFavorites: () => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'printalma_favorites';

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialiser le state directement avec les données du localStorage
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        console.log('💖 [FavoritesContext] Favoris chargés depuis localStorage:', parsedFavorites.length);
        return parsedFavorites;
      }
    } catch (error) {
      console.error('❌ [FavoritesContext] Erreur lors du chargement des favoris:', error);
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    }
    return [];
  });

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const isFirstRender = React.useRef(true);

  // Sauvegarder les favoris dans le localStorage à chaque changement (sauf au premier render)
  useEffect(() => {
    // Ignorer le premier render pour éviter d'écraser le localStorage
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      console.log('💾 [FavoritesContext] Favoris sauvegardés:', favorites.length);
    } catch (error) {
      console.error('❌ [FavoritesContext] Erreur lors de la sauvegarde des favoris:', error);
    }
  }, [favorites]);

  const addToFavorites = (product: any) => {
    // Vérifier si le produit est déjà dans les favoris
    if (favorites.some(fav => fav.id === product.id)) {
      console.log('⚠️ [FavoritesContext] Produit déjà en favori:', product.id);
      return;
    }

    const favoriteProduct: FavoriteProduct = {
      id: product.id,
      vendorName: product.vendorName,
      price: product.price,
      status: product.status,
      defaultColorId: product.defaultColorId,
      adminProduct: product.adminProduct,
      designApplication: product.designApplication,
      designPositions: product.designPositions,
      designTransforms: product.designTransforms,
      selectedColors: product.selectedColors,
      selectedSizes: product.selectedSizes,
      images: product.images,
      designId: product.designId,
      vendor: product.vendor,
      addedAt: Date.now()
    };

    setFavorites(prev => [...prev, favoriteProduct]);
    console.log('💖 [FavoritesContext] Produit ajouté aux favoris:', product.id, product.vendorName);
  };

  const removeFromFavorites = (productId: number) => {
    setFavorites(prev => prev.filter(fav => fav.id !== productId));
    console.log('💔 [FavoritesContext] Produit retiré des favoris:', productId);
  };

  const isFavorite = (productId: number): boolean => {
    return favorites.some(fav => fav.id === productId);
  };

  const toggleFavorite = (product: any) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }
  };

  const openFavorites = () => {
    console.log('💖 [FavoritesContext] Ouverture du drawer favoris');
    setIsFavoritesOpen(true);
  };

  const closeFavorites = () => {
    console.log('💖 [FavoritesContext] Fermeture du drawer favoris');
    setIsFavoritesOpen(false);
  };

  const clearFavorites = () => {
    setFavorites([]);
    console.log('🗑️ [FavoritesContext] Tous les favoris ont été supprimés');
  };

  const value: FavoritesContextType = {
    favorites,
    favoritesCount: favorites.length,
    isFavoritesOpen,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    openFavorites,
    closeFavorites,
    clearFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites doit être utilisé à l\'intérieur d\'un FavoritesProvider');
  }
  return context;
};

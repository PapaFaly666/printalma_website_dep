import { useState, useEffect, useMemo } from 'react';
import { ProductService, Product } from '../services/productService';

export interface ProductsAPIState {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UseProductsAPIReturn extends ProductsAPIState {
  page: number;
  limit: number;
  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  changeLimit: (limit: number) => void;
  // Actions
  refetch: () => Promise<void>;
  deleteProduct: (id: number, mode?: 'soft' | 'hard') => Promise<boolean>;
  // État
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalProducts: number;
}

export const useProductsAPI = (initialPage: number = 1, initialLimit: number = 20): UseProductsAPIReturn => {
  // ✨ SIMPLIFIÉ: États de base uniquement
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // ✨ SIMPLIFIÉ: Une seule fonction de fetch sans callbacks complexes
  const fetchProducts = async () => {
    try {
      console.log('🔄 [useProductsAPI] Fetch des produits...');
      setLoading(true);
      setError(null);
      
      const result = await ProductService.getProducts();
      
      if (result.success && result.data) {
        console.log(`✅ [useProductsAPI] ${result.data.length} produits récupérés`);
        setAllProducts(result.data);
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [useProductsAPI] Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✨ SIMPLIFIÉ: useEffect simple sans dépendances complexes
  useEffect(() => {
    fetchProducts();
  }, []); // Pas de dépendances pour éviter les re-exécutions

  // ✨ SIMPLIFIÉ: Calculs dérivés avec useMemo simple
  const totalProducts = allProducts.length;
  const totalPages = Math.ceil(totalProducts / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedProducts = useMemo(() => 
    allProducts.slice(startIndex, endIndex), 
    [allProducts, startIndex, endIndex]
  );
  
  const pagination = useMemo(() => ({
    page,
    limit,
    total: totalProducts,
    totalPages,
  }), [page, limit, totalProducts, totalPages]);

  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // ✨ SIMPLIFIÉ: Fonctions simples sans useCallback pour éviter les dépendances
  const goToPage = (newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(clampedPage);
  };

  const nextPage = () => {
    if (hasNextPage) setPage(p => p + 1);
  };

  const prevPage = () => {
    if (hasPrevPage) setPage(p => p - 1);
  };

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const refetch = async () => {
    await fetchProducts();
  };

  const deleteProduct = async (id: number, mode: 'soft' | 'hard' = 'soft'): Promise<boolean> => {
    try {
      console.log(`🗑️ [useProductsAPI] Suppression ${mode} du produit ${id}...`);
      const result = await ProductService.deleteProduct(id, mode);

      if (result.success) {
        setAllProducts(prev => prev.filter(product => product.id !== id));
        
        const newTotalPages = Math.ceil((allProducts.length - 1) / limit);
        if (page > newTotalPages) {
          setPage(Math.max(1, newTotalPages));
        }

        console.log(`✅ [useProductsAPI] Produit ${id} supprimé avec succès`);
        return true;
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression du produit');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error(`❌ [useProductsAPI] Erreur suppression ${id}:`, errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  return {
    products: paginatedProducts,
    loading,
    error,
    pagination,
    page,
    limit,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    refetch,
    deleteProduct,
    hasNextPage,
    hasPrevPage,
    totalProducts
  };
}; 
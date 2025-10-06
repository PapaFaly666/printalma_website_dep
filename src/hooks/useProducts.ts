import { useState, useEffect, useCallback } from 'react';
import { Product } from '../schemas/product.schema';
import { ProductService } from '../services/productService';

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  operations: {
    delete: {
      loading: boolean;
    };
    update: {
      loading: boolean;
    };
    restore: {
      loading: boolean;
    };
  };
  refreshProducts: () => Promise<void>;
  deleteProduct: (id: number) => Promise<boolean>;
  updateProduct: (id: number, data: any) => Promise<Product | null>;
  restoreProduct: (id: number) => Promise<boolean>;
}

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États des opérations
  const [operations, setOperations] = useState({
    delete: { loading: false },
    update: { loading: false },
    restore: { loading: false }
  });

  const fetchProducts = useCallback(async () => {
    try {
      console.log('🔄 [useProducts] Fetch des produits...');
      setIsLoading(true);
      setError(null);
      
      const result = await ProductService.getProducts();
      
      if (result.success && result.data) {
        console.log(`✅ [useProducts] ${result.data.length} produits récupérés`);
        setProducts(result.data);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des produits');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [useProducts] Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: number): Promise<boolean> => {
    try {
      setOperations(prev => ({ ...prev, delete: { loading: true } }));
      console.log(`🗑️ [useProducts] Suppression du produit ${id}...`);
      
      const result = await ProductService.deleteProduct(id, 'soft');
      
      if (result.success) {
        // Mettre à jour la liste des produits
        setProducts(prev => prev.map(product => 
          product.id === id 
            ? { ...product, deletedAt: new Date().toISOString() }
            : product
        ));
        console.log(`✅ [useProducts] Produit ${id} supprimé avec succès`);
        return true;
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression du produit');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error(`❌ [useProducts] Erreur suppression ${id}:`, errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setOperations(prev => ({ ...prev, delete: { loading: false } }));
    }
  }, []);

  const updateProduct = useCallback(async (id: number, data: any): Promise<Product | null> => {
    try {
      setOperations(prev => ({ ...prev, update: { loading: true } }));
      console.log(`🔄 [useProducts] Mise à jour du produit ${id}...`);
      
      const result = await ProductService.updateProduct(id, data);
      
      if (result.success && result.data) {
        // Mettre à jour la liste des produits
        setProducts(prev => prev.map(product => 
          product.id === id ? result.data! : product
        ));
        console.log(`✅ [useProducts] Produit ${id} mis à jour avec succès`);
        return result.data;
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour du produit');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error(`❌ [useProducts] Erreur mise à jour ${id}:`, errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setOperations(prev => ({ ...prev, update: { loading: false } }));
    }
  }, []);

  const restoreProduct = useCallback(async (id: number): Promise<boolean> => {
    try {
      setOperations(prev => ({ ...prev, restore: { loading: true } }));
      console.log(`🔄 [useProducts] Restauration du produit ${id}...`);
      
      const result = await ProductService.restoreProduct(id);
      
      if (result.success) {
        // Mettre à jour la liste des produits
        setProducts(prev => prev.map(product => 
          product.id === id 
            ? { ...product, deletedAt: null }
            : product
        ));
        console.log(`✅ [useProducts] Produit ${id} restauré avec succès`);
        return true;
      } else {
        throw new Error(result.error || 'Erreur lors de la restauration du produit');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error(`❌ [useProducts] Erreur restauration ${id}:`, errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setOperations(prev => ({ ...prev, restore: { loading: false } }));
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    operations,
    refreshProducts,
    deleteProduct,
    updateProduct,
    restoreProduct
  };
}; 
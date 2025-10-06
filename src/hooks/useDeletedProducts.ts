import { useEffect, useState, useCallback } from 'react';import { Product } from '../schemas/product.schema';import {   fetchDeletedProducts,   restoreProduct,   hardDeleteProduct,  softDeleteProduct,  fetchProductById} from '../services/api';

// Clé de stockage local pour les produits supprimés
const DELETED_PRODUCTS_STORAGE_KEY = 'printalma_deleted_products';

// Types
type OperationStatus = {
  loading: boolean;
  error: Error | null;
};

type DeletedProductOperations = {
  restore: OperationStatus;
  hardDelete: OperationStatus;
  softDelete: OperationStatus;
};

export interface UseDeletedProductsReturn {
  deletedProducts: Product[];
  isLoading: boolean;
  error: Error | null;
  operations: DeletedProductOperations;
  restoreProduct: (id: number) => Promise<Product | null>;
  hardDeleteProduct: (id: number) => Promise<boolean>;
  softDeleteProduct: (id: number) => Promise<boolean>;
  addToDeletedProducts: (product: Product) => void;
  refreshDeletedProducts: () => Promise<void>;
}

export const useDeletedProducts = (): UseDeletedProductsReturn => {
  // State
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Individual operation states
  const [operations, setOperations] = useState<DeletedProductOperations>({
    restore: { loading: false, error: null },
    hardDelete: { loading: false, error: null },
    softDelete: { loading: false, error: null }
  });

  // Charger les produits supprimés depuis le stockage local
  const loadFromLocalStorage = useCallback(() => {
    try {
      console.log('Chargement des produits supprimés depuis le localStorage...');
      const storedData = localStorage.getItem(DELETED_PRODUCTS_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as Product[];
        console.log(`${parsedData.length} produits supprimés chargés depuis le localStorage.`);
        return parsedData;
      } else {
        console.log('Aucun produit supprimé trouvé dans le localStorage.');
      }
    } catch (err) {
      console.error('Error loading deleted products from localStorage:', err);
    }
    return [];
  }, []);

  // Sauvegarder les produits supprimés dans le stockage local
  const saveToLocalStorage = useCallback((products: Product[]) => {
    try {
      console.log(`Sauvegarde de ${products.length} produits supprimés dans le localStorage...`);
      localStorage.setItem(DELETED_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      console.log('Produits supprimés sauvegardés avec succès dans le localStorage.');
    } catch (err) {
      console.error('Error saving deleted products to localStorage:', err);
    }
  }, []);

  /**
   * Load all deleted products from the API or local storage
   */
  const refreshDeletedProducts = useCallback(async (): Promise<void> => {
    try {
      console.log('Début du rafraîchissement des produits supprimés...');
      setIsLoading(true);
      setError(null);
      
      // Essayer d'abord de récupérer depuis l'API
      console.log('Récupération des produits supprimés depuis l\'API...');
      const data = await fetchDeletedProducts();
      
      // Si l'API renvoie des données, les utiliser
      if (data && data.length > 0) {
        console.log(`${data.length} produits supprimés récupérés depuis l'API.`);
        setDeletedProducts(data);
        // Mettre à jour le stockage local avec ces données
        saveToLocalStorage(data);
      } else {
        console.log('Aucun produit supprimé récupéré depuis l\'API, chargement depuis le stockage local...');
        // Sinon, charger depuis le stockage local
        const localData = loadFromLocalStorage();
        console.log(`${localData.length} produits supprimés chargés depuis le stockage local.`);
        setDeletedProducts(localData);
      }
    } catch (err) {
      // En cas d'erreur, charger depuis le stockage local
      console.log('Erreur lors de la récupération depuis l\'API, chargement depuis le stockage local...');
      const localData = loadFromLocalStorage();
      console.log(`${localData.length} produits supprimés chargés depuis le stockage local (après erreur).`);
      setDeletedProducts(localData);
      
      const error = err instanceof Error ? err : new Error('Failed to load deleted products');
      setError(error);
      console.error('Error loading deleted products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromLocalStorage, saveToLocalStorage]);

  /**
   * Ajouter un produit au cache des produits supprimés
   */
  const addToDeletedProducts = useCallback((product: Product): void => {
    console.log("Ajout d'un produit à la corbeille:", product.id, product.name);
    // Ajouter un champ deletedAt si ce n'est pas déjà fait
    const productWithDeletedAt = {
      ...product,
      deletedAt: product.deletedAt || new Date().toISOString()
    };
    
    // Mettre à jour l'état
    setDeletedProducts(prev => {
      // Vérifier si le produit existe déjà
      const exists = prev.some(p => p.id === product.id);
      if (!exists) {
        const newList = [...prev, productWithDeletedAt];
        // Mettre à jour le stockage local
        saveToLocalStorage(newList);
        console.log(`Produit ${product.id} (${product.name}) ajouté à la corbeille. Total: ${newList.length}`);
        return newList;
      }
      console.log(`Produit ${product.id} déjà dans la corbeille.`);
      return prev;
    });
  }, [saveToLocalStorage]);

  /**
   * Soft delete a product and add it to cache
   * @param id - The ID of the product to soft-delete
   * @returns True if soft-deletion was successful, false otherwise
   */
  const softDeleteProductById = async (id: number): Promise<boolean> => {
    // Update operation state
    setOperations(prev => ({
      ...prev,
      softDelete: { loading: true, error: null }
    }));
    
    try {
      console.log(`Tentative de suppression du produit ${id}...`);
      // Fetch the product data before deletion to have complete product info
      const product = await fetchProductById(id);
      console.log(`Produit récupéré:`, product);
      
      // Call the API
      const result = await softDeleteProduct(id);
      console.log(`Réponse de l'API après suppression:`, result);
      
      // Add to deleted products cache with the deletion timestamp
      const deletedProduct = {
        ...product,
        deletedAt: result.deletedAt
      };
      
      console.log(`Ajout du produit supprimé à la corbeille:`, deletedProduct);
      // Add the product to deleted products cache
      addToDeletedProducts(deletedProduct);
      
      // Reset operation state
      setOperations(prev => ({
        ...prev,
        softDelete: { loading: false, error: null }
      }));
      
      return true;
    } catch (err) {
      // Handle error
      const error = err instanceof Error ? err : new Error(`Failed to soft-delete product ${id}`);
      
      setOperations(prev => ({
        ...prev,
        softDelete: { loading: false, error }
      }));
      
      console.error(`Error soft-deleting product ${id}:`, err);
      return false;
    }
  };

  /**
   * Restore a soft-deleted product
   * @param id - The ID of the product to restore
   * @returns The restored product or null if an error occurred
   */
  const restoreProductById = async (id: number): Promise<Product | null> => {
    // Update operation state
    setOperations(prev => ({
      ...prev,
      restore: { loading: true, error: null }
    }));
    
    try {
      // Call the API
      const result = await restoreProduct(id);
      
      // Remove the restored product from the list and local storage
      setDeletedProducts(prev => {
        const filtered = prev.filter(p => p.id !== id);
        saveToLocalStorage(filtered);
        return filtered;
      });
      
      // Reset operation state
      setOperations(prev => ({
        ...prev,
        restore: { loading: false, error: null }
      }));
      
      return result.product;
    } catch (err) {
      // Handle error
      const error = err instanceof Error ? err : new Error(`Failed to restore product ${id}`);
      
      setOperations(prev => ({
        ...prev,
        restore: { loading: false, error }
      }));
      
      console.error(`Error restoring product ${id}:`, err);
      return null;
    }
  };

  /**
   * Permanently delete a product
   * @param id - The ID of the product to permanently delete
   * @returns True if deletion was successful, false otherwise
   */
  const hardDeleteProductById = async (id: number): Promise<boolean> => {
    // Update operation state
    setOperations(prev => ({
      ...prev,
      hardDelete: { loading: true, error: null }
    }));

    // Create a backup for rollback on error
    const productsBackup = [...deletedProducts];
    
    try {
      // Optimistic update - remove from UI immediately
      setDeletedProducts(prev => {
        const filtered = prev.filter(p => p.id !== id);
        saveToLocalStorage(filtered);
        return filtered;
      });

      // Perform the hard deletion
      await hardDeleteProduct(id);
      
      // Reset operation state
      setOperations(prev => ({
        ...prev,
        hardDelete: { loading: false, error: null }
      }));
      
      return true;
    } catch (err) {
      // Handle error and rollback
      const error = err instanceof Error ? err : new Error(`Failed to permanently delete product ${id}`);
      
      // Rollback to previous state
      setDeletedProducts(productsBackup);
      saveToLocalStorage(productsBackup);
      
      setOperations(prev => ({
        ...prev,
        hardDelete: { loading: false, error }
      }));
      
      console.error(`Error hard deleting product ${id}:`, err);
      return false;
    }
  };

  // Load deleted products on initial render
  useEffect(() => {
    refreshDeletedProducts();
  }, [refreshDeletedProducts]);

  return {    deletedProducts,    isLoading,    error,    operations,    restoreProduct: restoreProductById,    hardDeleteProduct: hardDeleteProductById,    softDeleteProduct: softDeleteProductById,    addToDeletedProducts,    refreshDeletedProducts  };};
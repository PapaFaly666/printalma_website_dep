import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  VendorDesignProductResponse,
  VendorDesignProductStatus,
  CreateVendorDesignProductDto,
  UpdateVendorDesignProductDto,
  DesignUploadResponse,
  ValidationErrors,
} from '../types/vendorDesignProduct';
import {
  vendorDesignProductAPI,
  validateTransformations,
  hasValidationErrors,
} from '../services/vendorDesignProductAPI';

interface UseVendorDesignProductState {
  designProducts: VendorDesignProductResponse[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}

interface UseVendorDesignProductActions {
  // CRUD operations
  loadDesignProducts: (status?: VendorDesignProductStatus) => Promise<void>;
  createDesignProduct: (data: CreateVendorDesignProductDto) => Promise<VendorDesignProductResponse>;
  updateDesignProduct: (id: number, data: UpdateVendorDesignProductDto) => Promise<VendorDesignProductResponse>;
  deleteDesignProduct: (id: number) => Promise<void>;
  updateStatus: (id: number, status: VendorDesignProductStatus) => Promise<VendorDesignProductResponse>;
  
  // Upload and workflow
  uploadDesign: (file: File) => Promise<DesignUploadResponse>;
  createCompleteDesignProduct: (
    file: File,
    productId: number,
    transformations: {
      positionX: number;
      positionY: number;
      scale: number;
      rotation: number;
      name?: string;
      description?: string;
    },
    status?: VendorDesignProductStatus
  ) => Promise<VendorDesignProductResponse>;
  
  // Validation
  validateTransformations: (data: Partial<CreateVendorDesignProductDto | UpdateVendorDesignProductDto>) => ValidationErrors;
  
  // State management
  clearError: () => void;
  resetUploadProgress: () => void;
}

export interface UseVendorDesignProductReturn extends UseVendorDesignProductState, UseVendorDesignProductActions {}

/**
 * Hook principal pour gérer les designs-produits de vendeur
 */
export function useVendorDesignProduct(): UseVendorDesignProductReturn {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<UseVendorDesignProductState>({
    designProducts: [],
    loading: false,
    error: null,
    uploadProgress: 0,
  });

  // Fonction utilitaire pour gérer les erreurs
  const handleError = useCallback((error: any, operation: string) => {
    console.error(`❌ Erreur ${operation}:`, error);
    const errorMessage = error.response?.data?.message || error.message || `Erreur lors de ${operation}`;
    setState(prev => ({ ...prev, error: errorMessage, loading: false }));
  }, []);

  // Fonction utilitaire pour vérifier l'authentification
  const checkAuth = useCallback(() => {
    if (!isAuthenticated) {
      throw new Error('Utilisateur non authentifié');
    }
  }, [isAuthenticated]);

  // Charger les designs-produits
  const loadDesignProducts = useCallback(async (status?: VendorDesignProductStatus) => {
    try {
      if (!isAuthenticated) throw new Error('Utilisateur non authentifié');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const designProducts = await vendorDesignProductAPI.getDesignProducts(undefined, status);
      setState(prev => ({ ...prev, designProducts, loading: false }));
    } catch (error) {
      handleError(error, 'chargement des designs-produits');
    }
  }, [isAuthenticated, handleError]);

  // Créer un design-produit
  const createDesignProduct = useCallback(async (data: CreateVendorDesignProductDto): Promise<VendorDesignProductResponse> => {
    try {
      if (!isAuthenticated) throw new Error('Utilisateur non authentifié');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Validation côté client
      const validationErrors = validateTransformations(data);
      if (hasValidationErrors(validationErrors)) {
        throw new Error(Object.values(validationErrors).join(', '));
      }
      
      const designProduct = await vendorDesignProductAPI.createDesignProduct(data, undefined);
      
      // Ajouter à la liste locale
      setState(prev => ({
        ...prev,
        designProducts: [...prev.designProducts, designProduct],
        loading: false,
      }));
      
      return designProduct;
    } catch (error) {
      handleError(error, 'création du design-produit');
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Mettre à jour un design-produit
  const updateDesignProduct = useCallback(async (id: number, data: UpdateVendorDesignProductDto): Promise<VendorDesignProductResponse> => {
    try {
      if (!isAuthenticated) throw new Error('Utilisateur non authentifié');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Validation côté client
      const validationErrors = validateTransformations(data);
      if (hasValidationErrors(validationErrors)) {
        throw new Error(Object.values(validationErrors).join(', '));
      }
      
      const updatedDesignProduct = await vendorDesignProductAPI.updateDesignProduct(id, data, undefined);
      
      // Mettre à jour la liste locale
      setState(prev => ({
        ...prev,
        designProducts: prev.designProducts.map(dp => 
          dp.id === id ? updatedDesignProduct : dp
        ),
        loading: false,
      }));
      
      return updatedDesignProduct;
    } catch (error) {
      handleError(error, 'mise à jour du design-produit');
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Supprimer un design-produit
  const deleteDesignProduct = useCallback(async (id: number): Promise<void> => {
    try {
      if (!isAuthenticated) throw new Error('Utilisateur non authentifié');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await vendorDesignProductAPI.deleteDesignProduct(id, undefined);
      
      // Retirer de la liste locale
      setState(prev => ({
        ...prev,
        designProducts: prev.designProducts.filter(dp => dp.id !== id),
        loading: false,
      }));
    } catch (error) {
      handleError(error, 'suppression du design-produit');
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Mettre à jour le statut
  const updateStatus = useCallback(async (id: number, status: VendorDesignProductStatus): Promise<VendorDesignProductResponse> => {
    try {
      if (!isAuthenticated) throw new Error('Utilisateur non authentifié');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const updatedDesignProduct = await vendorDesignProductAPI.updateDesignProductStatus(id, status, undefined);
      
      // Mettre à jour la liste locale
      setState(prev => ({
        ...prev,
        designProducts: prev.designProducts.map(dp => 
          dp.id === id ? updatedDesignProduct : dp
        ),
        loading: false,
      }));
      
      return updatedDesignProduct;
    } catch (error) {
      handleError(error, 'mise à jour du statut');
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Upload design
  const uploadDesign = useCallback(async (file: File): Promise<DesignUploadResponse> => {
    try {
      if (!isAuthenticated) throw new Error('Utilisateur non authentifié');
      setState(prev => ({ ...prev, loading: true, error: null, uploadProgress: 0 }));
      
      // Validation du fichier
      if (!file || !file.type.startsWith('image/')) {
        throw new Error('Veuillez sélectionner un fichier image valide');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Le fichier est trop volumineux (max 10MB)');
      }
      
      const result = await vendorDesignProductAPI.uploadDesign(file, undefined);
      
      setState(prev => ({ ...prev, loading: false, uploadProgress: 100 }));
      return result;
    } catch (error) {
      handleError(error, 'upload du design');
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Workflow complet
  const createCompleteDesignProduct = useCallback(async (
    file: File,
    productId: number,
    transformations: {
      positionX: number;
      positionY: number;
      scale: number;
      rotation: number;
      name?: string;
      description?: string;
    },
    status: VendorDesignProductStatus = VendorDesignProductStatus.DRAFT
  ): Promise<VendorDesignProductResponse> => {
    try {
      if (!isAuthenticated) throw new Error('Utilisateur non authentifié');
      setState(prev => ({ ...prev, loading: true, error: null, uploadProgress: 0 }));
      
      // Validation des transformations
      const validationErrors = validateTransformations(transformations);
      if (hasValidationErrors(validationErrors)) {
        throw new Error(Object.values(validationErrors).join(', '));
      }
      
      // Workflow complet
      const designProduct = await vendorDesignProductAPI.createCompleteDesignProduct(
        file,
        productId,
        transformations,
        undefined,
        status
      );
      
      // Ajouter à la liste locale
      setState(prev => ({
        ...prev,
        designProducts: [...prev.designProducts, designProduct],
        loading: false,
        uploadProgress: 100,
      }));
      
      return designProduct;
    } catch (error) {
      handleError(error, 'création complète du design-produit');
      throw error;
    }
  }, [isAuthenticated, handleError]);

  // Fonctions utilitaires
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const resetUploadProgress = useCallback(() => {
    setState(prev => ({ ...prev, uploadProgress: 0 }));
  }, []);

  // Charger les designs-produits au montage
  useEffect(() => {
    if (isAuthenticated) {
      loadDesignProducts();
    }
  }, [isAuthenticated, loadDesignProducts]); // Retirer loadDesignProducts des deps pour éviter les boucles

  return {
    // State
    designProducts: state.designProducts,
    loading: state.loading,
    error: state.error,
    uploadProgress: state.uploadProgress,
    
    // Actions
    loadDesignProducts,
    createDesignProduct,
    updateDesignProduct,
    deleteDesignProduct,
    updateStatus,
    uploadDesign,
    createCompleteDesignProduct,
    validateTransformations,
    clearError,
    resetUploadProgress,
  };
}

/**
 * Hook pour récupérer un design-produit spécifique
 */
export function useVendorDesignProductById(id: number | null) {
  const { isAuthenticated } = useAuth();
  const [designProduct, setDesignProduct] = useState<VendorDesignProductResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isAuthenticated) return;

    const loadDesignProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await vendorDesignProductAPI.getDesignProduct(id, undefined);
        setDesignProduct(result);
      } catch (err: any) {
        console.error('❌ Erreur chargement design-produit:', err);
        setError(err.response?.data?.message || err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadDesignProduct();
  }, [id, isAuthenticated]);

  return { designProduct, loading, error };
}

/**
 * Hook pour filtrer les designs-produits par statut
 */
export function useVendorDesignProductsByStatus(status: VendorDesignProductStatus) {
  const { isAuthenticated } = useAuth();
  const [designProducts, setDesignProducts] = useState<VendorDesignProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDesignProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await vendorDesignProductAPI.getDesignProductsByStatus(status, undefined);
        setDesignProducts(result);
      } catch (err: any) {
        console.error('❌ Erreur chargement designs-produits par statut:', err);
        setError(err.response?.data?.message || err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadDesignProducts();
  }, [status, isAuthenticated]);

  return { designProducts, loading, error };
} 
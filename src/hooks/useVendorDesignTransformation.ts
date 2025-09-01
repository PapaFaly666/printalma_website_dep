import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { transformationService, Transformation } from '../services/transformationService';
import { ProductService } from '../services/productService';
import { designService } from '../services/designService';

interface AdminProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;
      viewType: string;
      delimitations: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        coordinateType: 'PIXEL' | 'PERCENTAGE';
      }>;
    }>;
  }>;
  sizes: Array<{
    id: number;
    sizeName: string;
  }>;
}

interface Design {
  id: number;
  name: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

interface UseVendorDesignTransformationProps {
  baseProductId: number;
  initialDesignId?: number;
}

interface TransformationState {
  adminProduct: AdminProduct | null;
  designs: Design[];
  transformations: Transformation[];
  selectedDesign: Design | null;
  loading: boolean;
  error: string | null;
}

interface TransformationActions {
  setSelectedDesign: (design: Design | null) => void;
  createTransformation: (payload: any) => Promise<Transformation | null>;
  publishTransformation: (transformationId: number, payload: any) => Promise<boolean>;
  refreshTransformations: () => Promise<void>;
  cleanupOldTransformations: (olderThanDays?: number) => Promise<void>;
  clearError: () => void;
}

export const useVendorDesignTransformation = ({
  baseProductId,
  initialDesignId
}: UseVendorDesignTransformationProps): TransformationState & TransformationActions => {
  const [state, setState] = useState<TransformationState>({
    adminProduct: null,
    designs: [],
    transformations: [],
    selectedDesign: null,
    loading: false,
    error: null
  });

  // Initialisation - Charger les données de base
  useEffect(() => {
    const initialize = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Charger en parallèle tous les données nécessaires
        const [adminProductResult, designsResult, transformationsResult] = await Promise.all([
          ProductService.getProductSmart(baseProductId),
          designService.getDesigns({ status: 'published' }),
          transformationService.getTransformations()
        ]);

        // Sélectionner le design initial si spécifié
        let selectedDesign = null;
        if (initialDesignId) {
          selectedDesign = designsResult.designs.find(d => d.id === initialDesignId) || null;
        }

        // Normaliser les IDs des designs
        const normalizedDesigns = designsResult.designs.map(design => ({
          ...design,
          id: typeof design.id === 'string' ? parseInt(design.id, 10) : design.id
        }));

        setState(prev => ({
          ...prev,
          adminProduct: adminProductResult.data,
          designs: normalizedDesigns as Design[],
          transformations: transformationsResult.transformations,
          selectedDesign: selectedDesign as Design,
          loading: false
        }));

        console.log('✅ Workflow initialisé avec succès');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'initialisation';
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
        toast.error(errorMessage);
        console.error('❌ Erreur initialisation workflow:', error);
      }
    };

    initialize();
  }, [baseProductId, initialDesignId]);

  // Actions
  const setSelectedDesign = useCallback((design: Design | null) => {
    setState(prev => ({ ...prev, selectedDesign: design }));
  }, []);

  const createTransformation = useCallback(async (payload: any): Promise<Transformation | null> => {
    try {
      const response = await fetch('https://printalma-back-dep.onrender.com/vendor/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'TRANSFORMATION') {
        console.log('✅ Transformation créée:', result);
        
        // Rafraîchir la liste des transformations
        await refreshTransformations();
        
        return {
          id: result.transformationId,
          vendorId: 0,
          baseProductId: payload.baseProductId,
          designId: payload.designId,
          status: 'TRANSFORMATION',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          position: payload.designPosition,
          autoGeneratedName: payload.vendorName
        };
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la transformation';
      toast.error(errorMessage);
      console.error('❌ Erreur création transformation:', error);
      return null;
    }
  }, []);

  const publishTransformation = useCallback(async (transformationId: number, payload: any): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const result = await transformationService.publishTransformation(transformationId, payload);
      
      if (result.status === 'PUBLISHED') {
        toast.success('Produit publié avec succès !');
        
        // Rafraîchir la liste des transformations
        await refreshTransformations();
        
        setState(prev => ({ ...prev, loading: false }));
        return true;
      }
      
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la publication';
      toast.error(errorMessage);
      console.error('❌ Erreur publication:', error);
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return false;
    }
  }, []);

  const refreshTransformations = useCallback(async (): Promise<void> => {
    try {
      const result = await transformationService.getTransformations();
      setState(prev => ({ ...prev, transformations: result.transformations }));
    } catch (error) {
      console.error('❌ Erreur rafraîchissement transformations:', error);
    }
  }, []);

  const cleanupOldTransformations = useCallback(async (olderThanDays: number = 14): Promise<void> => {
    try {
      const result = await transformationService.cleanupTransformations(olderThanDays);
      toast.success(`${result.removed} prototypes nettoyés`);
      
      // Rafraîchir la liste
      await refreshTransformations();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du nettoyage';
      toast.error(errorMessage);
      console.error('❌ Erreur nettoyage:', error);
    }
  }, [refreshTransformations]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // État
    ...state,
    // Actions
    setSelectedDesign,
    createTransformation,
    publishTransformation,
    refreshTransformations,
    cleanupOldTransformations,
    clearError
  };
};

export default useVendorDesignTransformation; 
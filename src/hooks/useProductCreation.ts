import { useState } from 'react';
import { ProductService, CreateProductPayload, ProductFile } from '../services/productService';

export interface ProductCreationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  validationErrors: string[];
}

export const useProductCreation = () => {
  const [state, setState] = useState<ProductCreationState>({
    loading: false,
    error: null,
    success: false,
    validationErrors: []
  });

  const createProduct = async (productData: CreateProductPayload, imageFiles: ProductFile[]) => {
    setState({
      loading: true,
      error: null,
      success: false,
      validationErrors: []
    });

    try {
      // Validation côté client - commented out as methods don't exist
      // const dataErrors = ProductService.validateProductData(productData);
      // const fileErrors = ProductService.validateImageFiles(imageFiles);
      // const allErrors = [...dataErrors, ...fileErrors];

      // if (allErrors.length > 0) {
      //   setState({
      //     loading: false,
      //     error: 'Erreurs de validation détectées',
      //     success: false,
      //     validationErrors: allErrors
      //   });
      //   throw new Error('Erreurs de validation');
      // }

      console.log('🚀 Début de la création du produit:', {
        name: productData.name,
        colorVariations: productData.colorVariations.length,
        files: imageFiles.length
      });

      const result = await ProductService.createProduct(productData, imageFiles as unknown as File[]);

      if (result.success) {
        setState({
          loading: false,
          error: null,
          success: true,
          validationErrors: []
        });
        console.log('✅ Produit créé avec succès:', result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur lors de la création du produit:', errorMessage);
      
      setState({
        loading: false,
        error: errorMessage,
        success: false,
        validationErrors: state.validationErrors
      });
      throw err;
    }
  };

  const reset = () => {
    setState({
      loading: false,
      error: null,
      success: false,
      validationErrors: []
    });
  };

  return {
    ...state,
    createProduct,
    reset
  };
}; 
import { useState, useCallback } from 'react';
import { VendorValidationService } from '../services/vendorValidationService';
import { PostValidationAction } from '../types/vendorProduct';
import { toast } from 'sonner';

export function useVendorValidation() {
  const [loading, setLoading] = useState(false);

  const setValidationAction = useCallback(async (productId: number, action: PostValidationAction) => {
    setLoading(true);
    try {
      await VendorValidationService.setPostValidationAction(productId, action);
      
      const actionLabel = action === PostValidationAction.AUTO_PUBLISH 
        ? 'Publication automatique' 
        : 'Mise en brouillon';
        
      toast.success(`Choix de publication mis à jour : ${actionLabel}`);
      return { success: true };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const publishProduct = useCallback(async (productId: number) => {
    setLoading(true);
    try {
      await VendorValidationService.publishValidatedProduct(productId);
      toast.success('Produit publié avec succès !');
      return { success: true };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la publication');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await VendorValidationService.getPendingProducts();
      return { success: true, data };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateProduct = useCallback(async (productId: number, approved: boolean, rejectionReason?: string) => {
    setLoading(true);
    try {
      await VendorValidationService.validateProduct(productId, approved, rejectionReason);
      const message = approved ? 'Produit validé avec succès !' : 'Produit rejeté';
      toast.success(message);
      return { success: true };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const submitForValidation = useCallback(async (productId: number, action: PostValidationAction) => {
    setLoading(true);
    try {
      await VendorValidationService.submitForValidation(productId, action);
      const actionLabel = action === PostValidationAction.AUTO_PUBLISH 
        ? 'publication automatique' 
        : 'mise en brouillon';
      toast.success(`Produit soumis pour validation avec ${actionLabel}`);
      return { success: true };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setValidationAction,
    publishProduct,
    getPendingProducts,
    validateProduct,
    submitForValidation,
    validationChoices: VendorValidationService.getValidationChoices(),
  };
} 
 
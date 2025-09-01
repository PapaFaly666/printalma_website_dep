import { useState, useCallback } from 'react';
import { autoValidationService, AutoValidationResult } from '../services/autoValidationService';

export const useAutoValidation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoValidateDesign = useCallback(async (designId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await autoValidationService.autoValidateProductsForDesign(designId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const autoValidateAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await autoValidationService.autoValidateAllProducts();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    autoValidateDesign,
    autoValidateAll,
    loading,
    error,
  };
};
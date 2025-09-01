import { useState, useCallback } from 'react';
import { autoValidationService, AutoValidationResult } from '../services/autoValidationService';

interface UseAutoValidationReturn {
  // États
  isLoading: boolean;
  error: string | null;
  lastResult: AutoValidationResult | null;
  
  // Actions
  autoValidateAll: () => Promise<void>;
  autoValidateProduct: (productId: number) => Promise<void>;
  clearError: () => void;
  clearResult: () => void;
}

export const useAutoValidation = (): UseAutoValidationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AutoValidationResult | null>(null);

  const autoValidateAll = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await autoValidationService.autoValidateAll();
      setLastResult(result);
      console.log(`🤖 Auto-validation globale: ${result.message}`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'auto-validation globale';
      setError(errorMessage);
      console.error('Erreur auto-validation globale:', err);
      
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const autoValidateProduct = useCallback(async (productId: number) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await autoValidationService.autoValidateProduct(productId);
      setLastResult(result);
      console.log(`🤖 Auto-validation produit ${productId}: ${result.message}`);
      
    } catch (err: any) {
      const errorMessage = err.message || `Erreur lors de l'auto-validation du produit ${productId}`;
      setError(errorMessage);
      console.error(`Erreur auto-validation produit ${productId}:`, err);
      
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    isLoading,
    error,
    lastResult,
    autoValidateAll,
    autoValidateProduct,
    clearError,
    clearResult
  };
};
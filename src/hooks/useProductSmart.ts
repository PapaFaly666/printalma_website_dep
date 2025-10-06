import { useState, useEffect } from 'react';
import { ProductService, ProductServiceResult } from '../services/productService';

interface UseProductSmartResult {
  data: ProductServiceResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProductSmart(productId: number): UseProductSmartResult {
  const [data, setData] = useState<ProductServiceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 useProductSmart: Récupération du produit ${productId}...`);
      const result = await ProductService.getProductSmart(productId);
      console.log(`✅ useProductSmart: Produit ${productId} trouvé via ${result.source}`);
      setData(result);
    } catch (err: any) {
      console.error(`❌ useProductSmart: Erreur pour le produit ${productId}:`, err);
      setError(err.message || 'Erreur lors de la récupération du produit');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const refetch = () => {
    fetchProduct();
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
} 
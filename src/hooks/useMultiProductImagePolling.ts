import { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '../config/api';

/**
 * 🔄 HOOK DE POLLING MULTI-PRODUITS
 *
 * Gère le polling de génération d'images pour plusieurs produits simultanément.
 * Utilise l'endpoint: GET /vendor/products/:id/images-status
 *
 * @features
 * - Polling parallèle de plusieurs produits
 * - Agrégation des statuts
 * - Arrêt automatique quand tous les produits sont terminés
 * - Gestion des erreurs par produit
 *
 * @example
 * ```tsx
 * const { isPolling, allGenerated, productsStatus } = useMultiProductImagePolling({
 *   productIds: [123, 124, 125],
 *   onAllComplete: (results) => {
 *     console.log('Tous les produits générés!', results);
 *   }
 * });
 * ```
 */

// ============================================
// TYPES
// ============================================

export interface FinalImage {
  id: number;
  colorId: number;
  colorName: string;
  finalImageUrl: string;
  imageType: string;
}

export interface SingleProductStatus {
  productId: number;
  productName?: string;
  success: boolean;
  product?: {
    id: number;
    status: string;
    designId: number;
  };
  imagesGeneration: {
    totalExpected: number;
    totalGenerated: number;
    percentage: number;
    allGenerated: boolean;
  };
  finalImages: FinalImage[];
  error?: string;
}

export interface AggregatedStatus {
  totalProducts: number;
  completedProducts: number;
  totalImages: number;
  generatedImages: number;
  overallPercentage: number;
  allGenerated: boolean;
  products: SingleProductStatus[];
}

interface UseMultiProductImagePollingOptions {
  productIds: number[];
  pollingInterval?: number; // défaut: 2500ms
  maxAttempts?: number; // défaut: 120 (~5 minutes)
  onAllComplete?: (results: SingleProductStatus[]) => void;
  onProductComplete?: (productId: number, status: SingleProductStatus) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

interface UseMultiProductImagePollingResult {
  isPolling: boolean;
  aggregatedStatus: AggregatedStatus | null;
  allGenerated: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
  retryCount: number;
}

// ============================================
// HOOK
// ============================================

export function useMultiProductImagePolling({
  productIds,
  pollingInterval = 2500,
  maxAttempts = 120,
  onAllComplete,
  onProductComplete,
  onError,
  enabled = true
}: UseMultiProductImagePollingOptions): UseMultiProductImagePollingResult {
  const [isPolling, setIsPolling] = useState(false);
  const [aggregatedStatus, setAggregatedStatus] = useState<AggregatedStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef(0);
  const completedProductsRef = useRef<Set<number>>(new Set());
  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

  /**
   * Fetch le statut d'un seul produit
   */
  const fetchSingleProductStatus = async (productId: number): Promise<SingleProductStatus> => {
    // Si déjà complété, ne pas re-fetch
    if (completedProductsRef.current.has(productId)) {
      // Retourner le dernier statut connu depuis aggregatedStatus
      const existing = aggregatedStatus?.products.find(p => p.productId === productId);
      if (existing) {
        return existing;
      }
    }

    try {
      const controller = new AbortController();
      abortControllersRef.current.set(productId, controller);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/vendor/products/${productId}/images-status`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`📡 [Produit ${productId}] Réponse API complète:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération du statut');
      }

      const status: SingleProductStatus = {
        productId,
        success: true,
        product: data.product,
        imagesGeneration: data.imagesGeneration || {
          totalExpected: 0,
          totalGenerated: 0,
          percentage: 0,
          allGenerated: false
        },
        finalImages: data.finalImages || []
      };

      console.log(`📊 [Produit ${productId}] Statut parsé:`, {
        totalExpected: status.imagesGeneration.totalExpected,
        totalGenerated: status.imagesGeneration.totalGenerated,
        allGenerated: status.imagesGeneration.allGenerated
      });

      // Si toutes les images sont générées, marquer comme complété
      if (status.imagesGeneration.allGenerated) {
        completedProductsRef.current.add(productId);
        console.log(`✅ [Produit ${productId}] Toutes les images générées!`);
        onProductComplete?.(productId, status);
      }

      return status;

    } catch (err) {
      // Ignorer les erreurs d'abort
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error(`❌ [Produit ${productId}] Erreur:`, errorMessage);

      return {
        productId,
        success: false,
        imagesGeneration: {
          totalExpected: 0,
          totalGenerated: 0,
          percentage: 0,
          allGenerated: false
        },
        finalImages: [],
        error: errorMessage
      };
    } finally {
      abortControllersRef.current.delete(productId);
    }
  };

  /**
   * Fetch le statut de tous les produits en parallèle
   */
  const fetchAllProductsStatus = async (): Promise<boolean> => {
    try {
      const statuses = await Promise.all(
        productIds.map(id => fetchSingleProductStatus(id))
      );

      console.log('📦 [Multi-Polling] Statuses reçus:', statuses.map(s => ({
        productId: s.productId,
        totalExpected: s.imagesGeneration.totalExpected,
        totalGenerated: s.imagesGeneration.totalGenerated,
        allGenerated: s.imagesGeneration.allGenerated
      })));

      // Calculer l'agrégation
      const totalImages = statuses.reduce((sum, s) => sum + s.imagesGeneration.totalExpected, 0);
      const generatedImages = statuses.reduce((sum, s) => sum + s.imagesGeneration.totalGenerated, 0);
      const completedProducts = statuses.filter(s => s.imagesGeneration.allGenerated).length;
      const overallPercentage = totalImages > 0 ? Math.round((generatedImages / totalImages) * 100) : 0;
      const allGenerated = statuses.every(s => s.imagesGeneration.allGenerated);

      const aggregated: AggregatedStatus = {
        totalProducts: productIds.length,
        completedProducts,
        totalImages,
        generatedImages,
        overallPercentage,
        allGenerated,
        products: statuses
      };

      setAggregatedStatus(aggregated);

      console.log(`📊 [Multi-Polling] Progression globale: ${overallPercentage}% (${generatedImages}/${totalImages} images)`);

      // Si tout est généré, arrêter le polling
      if (allGenerated) {
        console.log('✅ [Multi-Polling] Toutes les images de tous les produits générées!');
        onAllComplete?.(statuses);
        return true; // Arrêter
      }

      return false; // Continuer

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification';
      console.error('❌ [Multi-Polling] Erreur:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  };

  /**
   * Démarrer le polling
   */
  const startPolling = useCallback(() => {
    if (!enabled || productIds.length === 0) {
      console.log('⏭️ [Multi-Polling] Polling non démarré:', { enabled, productIds: productIds.length });
      return;
    }

    if (isPolling) {
      console.log('⏭️ [Multi-Polling] Déjà en cours');
      return;
    }

    console.log(`🚀 [Multi-Polling] Démarrage pour ${productIds.length} produit(s):`, productIds);
    setIsPolling(true);
    setError(null);
    attemptRef.current = 0;
    completedProductsRef.current.clear();

    // Vérification immédiate
    fetchAllProductsStatus().then((shouldStop) => {
      if (shouldStop) {
        stopPolling();
        return;
      }

      // Démarrer le polling régulier
      intervalRef.current = setInterval(async () => {
        attemptRef.current++;
        setRetryCount(attemptRef.current);

        // Vérifier le nombre max de tentatives
        if (attemptRef.current >= maxAttempts) {
          console.warn(`⏱️ [Multi-Polling] Nombre max de tentatives atteint (${maxAttempts})`);
          setError('Délai d\'attente dépassé pour la génération des images');
          stopPolling();
          onError?.('Délai d\'attente dépassé');
          return;
        }

        const shouldStop = await fetchAllProductsStatus();
        if (shouldStop) {
          stopPolling();
        }
      }, pollingInterval);
    });
  }, [enabled, productIds, isPolling, pollingInterval, maxAttempts, onAllComplete, onError]);

  /**
   * Arrêter le polling
   */
  const stopPolling = useCallback(() => {
    console.log('🛑 [Multi-Polling] Arrêt du polling');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Annuler toutes les requêtes en cours
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();

    setIsPolling(false);
  }, []);

  // Démarrage automatique
  useEffect(() => {
    if (enabled && productIds.length > 0) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, productIds.length]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const allGenerated = aggregatedStatus?.allGenerated || false;

  return {
    isPolling,
    aggregatedStatus,
    allGenerated,
    error,
    startPolling,
    stopPolling,
    retryCount
  };
}

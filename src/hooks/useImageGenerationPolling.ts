import { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../config/api';

interface FinalImage {
  id: number;
  colorId: number;
  colorName: string;
  finalImageUrl: string;
  imageType: string;
}

interface ImagesGenerationStatus {
  totalExpected: number;
  totalGenerated: number;
  percentage: number;
  allGenerated: boolean;
}

interface ImagesStatusResponse {
  success: boolean;
  productId: number;
  product: {
    id: number;
    status: string;
    designId: number;
  };
  imagesGeneration: ImagesGenerationStatus;
  finalImages: FinalImage[];
}

interface UseImageGenerationPollingOptions {
  productId: number | null;
  pollingInterval?: number; // en ms, défaut 3000 (3 secondes)
  maxAttempts?: number; // Nombre max de tentatives, défaut 100 (~5 minutes)
  onComplete?: (finalImages: FinalImage[]) => void;
  onError?: (error: string) => void;
  enabled?: boolean; // Pour activer/désactiver le polling
}

interface UseImageGenerationPollingResult {
  isPolling: boolean;
  status: ImagesGenerationStatus | null;
  finalImages: FinalImage[];
  error: string | null;
  allGenerated: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  retryCount: number;
}

/**
 * Hook pour poller l'état de génération des images d'un produit
 */
export function useImageGenerationPolling({
  productId,
  pollingInterval = 3000,
  maxAttempts = 100,
  onComplete,
  onError,
  enabled = true
}: UseImageGenerationPollingOptions): UseImageGenerationPollingResult {
  const [isPolling, setIsPolling] = useState(false);
  const [status, setStatus] = useState<ImagesGenerationStatus | null>(null);
  const [finalImages, setFinalImages] = useState<FinalImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPolling(false);
  };

  const checkImagesStatus = async (): Promise<boolean> => {
    if (!productId) return false;

    try {
      // Créer un nouveau AbortController pour cette requête
      const controller = new AbortController();
      abortControllerRef.current = controller;

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ImagesStatusResponse = await response.json();

      console.log('🖼️ [useImageGenerationPolling] Statut images:', {
        productId: data.productId,
        allGenerated: data.imagesGeneration?.allGenerated,
        percentage: data.imagesGeneration?.percentage,
        finalImagesCount: data.finalImages?.length || 0,
        attempt: attemptRef.current + 1
      });

      if (data.success && data.imagesGeneration) {
        setStatus(data.imagesGeneration);
        setFinalImages(data.finalImages || []);

        // Vérifier si toutes les images sont générées
        if (data.imagesGeneration.allGenerated) {
          console.log('✅ [useImageGenerationPolling] Toutes les images générées!', {
            totalImages: data.finalImages?.length || 0
          });
          onComplete?.(data.finalImages || []);
          return true; // Arrêter le polling
        }
      }

      return false; // Continuer le polling
    } catch (err) {
      // Ignorer les erreurs d'abort (lorsqu'on arrête manuellement)
      if (err instanceof Error && err.name === 'AbortError') {
        return false;
      }

      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification';
      console.error('❌ [useImageGenerationPolling] Erreur:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  };

  const startPolling = () => {
    if (!productId || !enabled) {
      console.log('⏭️ [useImageGenerationPolling] Polling non démarré:', { productId, enabled });
      return;
    }

    if (isPolling) {
      console.log('⏭️ [useImageGenerationPolling] Déjà en cours');
      return;
    }

    console.log('🚀 [useImageGenerationPolling] Démarrage polling pour produit:', productId);
    setIsPolling(true);
    setError(null);
    attemptRef.current = 0;

    // Vérification immédiate
    checkImagesStatus().then((shouldStop) => {
      if (shouldStop) {
        stopPolling();
        return;
      }

      // Démarrer le polling si pas terminé
      intervalRef.current = setInterval(async () => {
        attemptRef.current++;
        setRetryCount(attemptRef.current);

        // Vérifier le nombre max de tentatives
        if (attemptRef.current >= maxAttempts) {
          console.warn(`⏱️ [useImageGenerationPolling] Nombre max de tentatives atteint (${maxAttempts})`);
          setError('Délai d\'attente dépassé pour la génération des images');
          stopPolling();
          onError?.('Délai d\'attente dépassé');
          return;
        }

        const shouldStop = await checkImagesStatus();
        if (shouldStop) {
          stopPolling();
        }
      }, pollingInterval);
    });
  };

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Redémarrer le polling si productId change
  useEffect(() => {
    if (enabled && productId) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [productId, enabled]);

  const allGenerated = status?.allGenerated || false;

  return {
    isPolling,
    status,
    finalImages,
    error,
    allGenerated,
    startPolling,
    stopPolling,
    retryCount
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🔄 HOOK USE_GENERATION_STATUS
 *
 * Hook personnalisé pour poller l'état de génération des images d'un produit vendeur.
 *
 * @endpoint GET /api/public/vendor-products/:productId/generation-status?vendorId=X
 *
 * @features
 * - Polling automatique toutes les 2 secondes
 * - Arrêt automatique quand terminé ou échoué
 * - Timeout configurable (défaut: 2 minutes)
 * - Gestion des erreurs avec réessais
 * - Cleanup automatique au démontage
 *
 * @example
 * ```tsx
 * const { status, isLoading, error, isPolling } = useGenerationStatus(productId, vendorId);
 *
 * if (isLoading) return <div>Chargement...</div>;
 * if (error) return <div>Erreur: {error}</div>;
 *
 * return (
 *   <div>
 *     <p>Progression: {status?.completionPercentage}%</p>
 *     <p>Temps restant: {status?.estimatedRemainingSeconds}s</p>
 *   </div>
 * );
 * ```
 */

// ============================================
// TYPES
// ============================================

export type GenerationStatusType = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ColorGenerationInfo {
  id: number;
  name: string;
  colorCode: string;
  isGenerated: boolean;
  finalImageUrl: string | null;
  generatedAt: string | null;
}

export interface GenerationStatus {
  productId: number;
  productName: string;
  productStatus: string;

  // Statut de génération
  generationStatus: GenerationStatusType;

  // Progression
  totalColors: number;
  generatedColors: number;
  remainingColors: number;
  completionPercentage: number;

  // Temps estimé
  estimatedTimePerColor: number;
  estimatedRemainingTime: number;
  estimatedRemainingSeconds: number;

  // Images générées
  finalImages: Array<{
    colorId: number;
    colorName: string;
    colorCode: string;
    finalImageUrl: string;
    createdAt: string;
  }>;

  // Statut par couleur
  colors: ColorGenerationInfo[];

  primaryImageUrl: string;
  checkedAt: string;
  lastUpdate: string;
}

export interface UseGenerationStatusOptions {
  /** Intervalle entre chaque requête de polling (ms) - défaut: 2000 */
  pollInterval?: number;
  /** Durée maximale avant abandon (ms) - défaut: 120000 (2 minutes) */
  maxDuration?: number;
  /** Callback appelé à chaque mise à jour du statut */
  onUpdate?: (status: GenerationStatus) => void;
  /** Callback appelé quand la génération est terminée avec succès */
  onComplete?: (status: GenerationStatus) => void;
  /** Callback appelé quand la génération échoue */
  onError?: (error: string) => void;
  /** Démarrer le polling automatiquement - défaut: true */
  autoStart?: boolean;
}

export interface UseGenerationStatusReturn {
  /** Statut actuel de la génération */
  status: GenerationStatus | null;
  /** Est en cours de chargement initial */
  isLoading: boolean;
  /** Le polling est actif */
  isPolling: boolean;
  /** Erreur rencontrée */
  error: string | null;
  /** La génération est terminée (succès) */
  isCompleted: boolean;
  /** La génération a échoué */
  isFailed: boolean;
  /** Relancer le polling manuellement */
  refetch: () => Promise<void>;
  /** Arrêter le polling */
  stopPolling: () => void;
  /** Démarrer le polling */
  startPolling: () => void;
}

// ============================================
// API
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

/**
 * Récupère le statut de génération d'un produit
 */
async function fetchGenerationStatus(
  productId: number,
  vendorId: number
): Promise<GenerationStatus> {
  const url = `${API_BASE}/api/public/vendor-products/${productId}/generation-status?vendorId=${vendorId}`;

  console.log(`📡 [useGenerationStatus] Récupération statut:`, url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Erreur lors de la récupération du statut');
  }

  console.log(`✅ [useGenerationStatus] Statut reçu:`, {
    generationStatus: result.data.generationStatus,
    completionPercentage: result.data.completionPercentage,
    generatedColors: result.data.generatedColors,
    totalColors: result.data.totalColors
  });

  return result.data;
}

// ============================================
// HOOK
// ============================================

export function useGenerationStatus(
  productId: number | null,
  vendorId: number | null,
  options: UseGenerationStatusOptions = {}
): UseGenerationStatusReturn {
  const {
    pollInterval = 2000,
    maxDuration = 120000, // 2 minutes
    onUpdate,
    onComplete,
    onError,
    autoStart = true
  } = options;

  // États
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs pour éviter les stale closures
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  /**
   * Fonction de fetch unique
   */
  const fetchOnce = useCallback(async (): Promise<boolean> => {
    if (!productId || !vendorId) {
      console.warn('⚠️ [useGenerationStatus] productId ou vendorId manquant');
      return false;
    }

    try {
      const data = await fetchGenerationStatus(productId, vendorId);

      setStatus(data);
      setError(null);
      setIsLoading(false);

      // Callback de mise à jour
      onUpdate?.(data);

      // Vérifier si terminé
      if (data.generationStatus === 'completed') {
        console.log('✅ [useGenerationStatus] Génération terminée !');
        onComplete?.(data);
        return true; // Arrêter le polling
      } else if (data.generationStatus === 'failed') {
        console.error('❌ [useGenerationStatus] Génération échouée');
        const errorMsg = 'La génération des images a échoué';
        setError(errorMsg);
        onError?.(errorMsg);
        return true; // Arrêter le polling
      }

      return false; // Continuer le polling

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [useGenerationStatus] Erreur fetching:', err);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);

      // Ne pas arrêter le polling en cas d'erreur réseau
      // Réessayer au prochain cycle
      return false;
    }
  }, [productId, vendorId, onUpdate, onComplete, onError]);

  /**
   * Arrêter le polling
   */
  const stopPolling = useCallback(() => {
    console.log('🛑 [useGenerationStatus] Arrêt du polling');

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsPolling(false);
  }, []);

  /**
   * Démarrer le polling
   */
  const startPolling = useCallback(() => {
    if (!productId || !vendorId) {
      console.warn('⚠️ [useGenerationStatus] Impossible de démarrer: IDs manquants');
      return;
    }

    if (isPolling) {
      console.log('ℹ️ [useGenerationStatus] Polling déjà en cours');
      return;
    }

    console.log(`🚀 [useGenerationStatus] Démarrage polling (interval: ${pollInterval}ms, max: ${maxDuration}ms)`);
    setIsPolling(true);
    startTimeRef.current = Date.now();

    // Timeout max
    timeoutRef.current = setTimeout(() => {
      console.warn(`⏱️ [useGenerationStatus] Timeout atteint (${maxDuration}ms)`);
      stopPolling();
      setError('Délai d\'attente dépassé. Veuillez rafraîchir la page.');
      onError?.('Délai d\'attente dépassé');
    }, maxDuration);

    // Premier fetch immédiat
    fetchOnce().then((shouldStop) => {
      if (shouldStop) {
        stopPolling();
        return;
      }

      // Ensuite, polling régulier
      pollingIntervalRef.current = setInterval(async () => {
        const shouldStop = await fetchOnce();
        if (shouldStop) {
          stopPolling();
        }
      }, pollInterval);
    });
  }, [productId, vendorId, pollInterval, maxDuration, fetchOnce, isPolling, stopPolling, onError]);

  /**
   * Refetch manuel
   */
  const refetch = useCallback(async () => {
    console.log('🔄 [useGenerationStatus] Refetch manuel');
    setIsLoading(true);
    setError(null);

    const shouldStop = await fetchOnce();
    if (shouldStop) {
      stopPolling();
    }
  }, [fetchOnce, stopPolling]);

  // ============================================
  // EFFECTS
  // ============================================

  // Démarrage automatique
  useEffect(() => {
    if (autoStart && productId && vendorId && !isPolling) {
      startPolling();
    }
  }, [autoStart, productId, vendorId, isPolling, startPolling]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // États dérivés
  const isCompleted = status?.generationStatus === 'completed';
  const isFailed = status?.generationStatus === 'failed';

  return {
    status,
    isLoading,
    isPolling,
    error,
    isCompleted,
    isFailed,
    refetch,
    stopPolling,
    startPolling
  };
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Formater le temps restant en texte lisible
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }
}

/**
 * Formater le pourcentage de complétion
 */
export function formatCompletion(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

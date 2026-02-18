import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Image as ImageIcon, Package } from 'lucide-react';
import { useMultiProductImagePolling, SingleProductStatus } from '../../hooks/useMultiProductImagePolling';

/**
 * 🖼️ MODAL DE PROGRESSION DE GÉNÉRATION MULTI-PRODUITS
 *
 * Affiche la progression de génération d'images pour plusieurs produits simultanément.
 * Utilise l'endpoint: GET /vendor/products/:id/images-status
 *
 * @features
 * - Polling automatique de plusieurs produits
 * - Affichage de la progression globale
 * - Détail par produit
 * - Fermeture automatique quand terminé
 *
 * @example
 * ```tsx
 * <MultiProductImagesModal
 *   productIds={[123, 124, 125]}
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onComplete={() => {
 *     console.log('Toutes les images générées!');
 *     navigate('/vendeur/products');
 *   }}
 * />
 * ```
 */

// ============================================
// TYPES
// ============================================

interface MultiProductImagesModalProps {
  productIds: number[];
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: (results: SingleProductStatus[]) => void;
  onError?: (error: string) => void;
  autoCloseDelay?: number; // Délai avant fermeture auto (ms), défaut: 2000
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const MultiProductImagesModal: React.FC<MultiProductImagesModalProps> = ({
  productIds,
  isOpen,
  onClose,
  onComplete,
  onError,
  autoCloseDelay = 2000
}) => {
  const [shouldAutoClose, setShouldAutoClose] = React.useState(false);

  // Hook de polling multi-produits
  const {
    isPolling,
    aggregatedStatus,
    allGenerated,
    error,
    stopPolling
  } = useMultiProductImagePolling({
    productIds,
    pollingInterval: 2500,
    maxAttempts: 120,
    onAllComplete: (results) => {
      console.log('✅ [MultiProductImagesModal] Toutes les images générées!');
      onComplete?.(results);
      setShouldAutoClose(true);
    },
    onError: (errorMsg) => {
      console.error('❌ [MultiProductImagesModal] Erreur:', errorMsg);
      onError?.(errorMsg);
    },
    enabled: isOpen && productIds.length > 0
  });

  // Fermeture automatique après succès
  React.useEffect(() => {
    if (shouldAutoClose && allGenerated) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoClose, allGenerated, onClose, autoCloseDelay]);

  // Arrêter le polling si le modal est fermé
  React.useEffect(() => {
    if (!isOpen && isPolling) {
      stopPolling();
    }
  }, [isOpen, isPolling, stopPolling]);

  // Ne pas afficher si fermé
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          // Permettre la fermeture uniquement si terminé ou erreur
          if (allGenerated || error) {
            onClose?.();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-500" />
              Génération des Images
            </h2>
            {(allGenerated || error) && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Fermer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* État d'erreur */}
            {error && (
              <div className="flex flex-col items-center gap-4 py-8">
                <XCircle className="w-16 h-16 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Erreur de génération</h3>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* État de succès */}
            {allGenerated && !error && (
              <div className="flex flex-col items-center gap-4 py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Génération terminée !
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  {aggregatedStatus?.generatedImages} images générées pour {aggregatedStatus?.totalProducts} produit(s)
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Fermeture automatique dans {autoCloseDelay / 1000}s...
                </p>
              </div>
            )}

            {/* État en cours */}
            {!allGenerated && !error && aggregatedStatus && (
              <div className="flex flex-col gap-6">
                {/* Titre */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Génération des images en cours...
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {aggregatedStatus.completedProducts}/{aggregatedStatus.totalProducts} produit(s) terminé(s)
                  </p>
                </div>

                {/* Barre de progression globale */}
                <div className="relative">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${aggregatedStatus.overallPercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-center mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {aggregatedStatus.overallPercentage}% ({aggregatedStatus.generatedImages}/{aggregatedStatus.totalImages} images)
                  </p>
                </div>

                {/* Liste des produits */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Détails par produit :
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {aggregatedStatus.products.map((product) => (
                      <ProductStatusItem key={product.productId} product={product} />
                    ))}
                  </div>
                </div>

                {/* Indicateur de polling */}
                <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">
                    {isPolling ? 'Vérification en cours...' : 'En attente...'}
                  </span>
                </div>
              </div>
            )}

            {/* État de chargement initial */}
            {!aggregatedStatus && !error && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-gray-600 dark:text-gray-400">
                  Chargement du statut de génération...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// SOUS-COMPOSANTS
// ============================================

interface ProductStatusItemProps {
  product: SingleProductStatus;
}

/**
 * Affiche le statut d'un produit individuel
 */
const ProductStatusItem: React.FC<ProductStatusItemProps> = ({ product }) => {
  const isComplete = product.imagesGeneration.allGenerated;
  const hasError = !product.success && product.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center gap-3 p-3 rounded-lg border
        ${isComplete
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : hasError
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }
      `}
    >
      {/* Icône de statut */}
      {isComplete ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
      ) : hasError ? (
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
      )}

      {/* Icône produit */}
      <Package className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />

      {/* Info produit */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          Produit #{product.productId}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {isComplete
            ? `${product.imagesGeneration.totalGenerated} images générées`
            : hasError
            ? product.error
            : `${product.imagesGeneration.totalGenerated}/${product.imagesGeneration.totalExpected} images`
          }
        </p>
      </div>

      {/* Pourcentage */}
      {!hasError && (
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {product.imagesGeneration.percentage}%
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// EXPORTS
// ============================================

export default MultiProductImagesModal;

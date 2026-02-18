import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { useGenerationStatus, formatRemainingTime, formatCompletion, ColorGenerationInfo } from '../../hooks/useGenerationStatus';

// ============================================
// TYPES
// ============================================

interface GenerationProgressModalProps {
  productId: number | null;
  vendorId: number | null;
  productName?: string;
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: (status: any) => void;
  onError?: (error: string) => void;
}

// ============================================
// COMPOSANT
// ============================================

/**
 * 🔄 MODAL DE PROGRESSION DE GÉNÉRATION
 *
 * Affiche un modal avec la progression de la génération des images d'un produit.
 * Utilise le hook useGenerationStatus pour le polling automatique.
 *
 * @example
 * ```tsx
 * <GenerationProgressModal
 *   productId={123}
 *   vendorId={3}
 *   productName="Tshirt Dragon"
 *   isOpen={showProgress}
 *   onClose={() => setShowProgress(false)}
 *   onComplete={(status) => {
 *     console.log('Génération terminée!', status);
 *     setShowProgress(false);
 *   }}
 * />
 * ```
 */
export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  productId,
  vendorId,
  productName,
  isOpen,
  onClose,
  onComplete,
  onError
}) => {
  // Hook de polling
  const {
    status,
    isLoading,
    isPolling,
    error,
    isCompleted,
    isFailed,
    stopPolling
  } = useGenerationStatus(productId, vendorId, {
    pollInterval: 2000, // 2 secondes
    maxDuration: 120000, // 2 minutes max
    onUpdate: (status) => {
      console.log('📊 Mise à jour progression:', status.completionPercentage);
    },
    onComplete: (status) => {
      console.log('✅ Génération terminée!');
      onComplete?.(status);
    },
    onError: (errorMsg) => {
      console.error('❌ Erreur génération:', errorMsg);
      onError?.(errorMsg);
    }
  });

  // Fermer et arrêter le polling si le modal est fermé
  React.useEffect(() => {
    if (!isOpen && isPolling) {
      stopPolling();
    }
  }, [isOpen, isPolling, stopPolling]);

  // Si terminé avec succès, fermer automatiquement après 2 secondes
  React.useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, onClose]);

  // Contenu à afficher
  const content = useMemo(() => {
    // État initial de chargement
    if (isLoading && !status) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-gray-600">Chargement du statut de génération...</p>
        </div>
      );
    }

    // Erreur
    if (isFailed || error) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <XCircle className="w-16 h-16 text-red-500" />
          <h3 className="text-xl font-bold text-gray-900">Échec de la génération</h3>
          <p className="text-center text-gray-600">
            {error || 'Une erreur est survenue lors de la génération des images.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      );
    }

    // Succès
    if (isCompleted) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900">Génération terminée !</h3>
          <p className="text-center text-gray-600">
            {status?.generatedColors}/{status?.totalColors} images générées avec succès
          </p>
        </div>
      );
    }

    // En cours
    if (status) {
      return (
        <div className="flex flex-col gap-6 py-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Génération des images en cours...
            </h3>
            {productName && (
              <p className="text-gray-600">{productName}</p>
            )}
          </div>

          {/* Barre de progression */}
          <div className="relative">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${status.completionPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-center mt-2 text-sm font-medium text-gray-700">
              {formatCompletion(status.completionPercentage)}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {status.generatedColors}
              </div>
              <div className="text-xs text-gray-600">Générées</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">
                {status.remainingColors}
              </div>
              <div className="text-xs text-gray-600">Restantes</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-700">
                {status.totalColors}
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>

          {/* Temps estimé */}
          {status.estimatedRemainingSeconds > 0 && (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>
                Environ {formatRemainingTime(status.estimatedRemainingSeconds)} restantes
              </span>
            </div>
          )}

          {/* Liste des couleurs */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">Progression par couleur :</h4>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {status.colors.map((color) => (
                <ColorStatusItem key={color.id} color={color} />
              ))}
            </div>
          </div>

          {/* Spinner de chargement */}
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">
              {isPolling ? 'Génération en cours...' : 'En attente...'}
            </span>
          </div>
        </div>
      );
    }

    return null;
  }, [status, isLoading, error, isCompleted, isFailed, isPolling, productName, onComplete]);

  // Ne pas afficher si ouvert est false
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec bouton fermer */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-500" />
              Génération des Images
            </h2>
            {!isCompleted && !isFailed && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fermer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Contenu */}
          <div className="p-6">
            {content}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// SOUS-COMPOSANTS
// ============================================

interface ColorStatusItemProps {
  color: ColorGenerationInfo;
}

/**
 * Affiche le statut d'une couleur individuelle
 */
const ColorStatusItem: React.FC<ColorStatusItemProps> = ({ color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center gap-2 p-2 rounded-lg border
        ${color.isGenerated
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-200'
        }
      `}
    >
      {/* Indicateur de statut */}
      {color.isGenerated ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
      )}

      {/* Nom de la couleur */}
      <span className="text-sm font-medium text-gray-900 flex-1">
        {color.name}
      </span>

      {/* Swatch de couleur */}
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: color.colorCode }}
      />

      {/* Image générée (miniature) */}
      {color.finalImageUrl && (
        <img
          src={color.finalImageUrl}
          alt={color.name}
          className="w-8 h-8 object-cover rounded border border-gray-200 flex-shrink-0"
        />
      )}
    </motion.div>
  );
};

// ============================================
// EXPORTS
// ============================================

export default GenerationProgressModal;

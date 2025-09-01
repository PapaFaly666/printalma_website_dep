import React from 'react';

interface TransformStatusIndicatorProps {
  isLoading: boolean;
  isSaving: boolean;
  backendAvailable: boolean;
  authError?: string | null;
  onRetryBackend: () => void;
}

export const TransformStatusIndicator: React.FC<TransformStatusIndicatorProps> = ({
  isLoading,
  isSaving,
  backendAvailable,
  authError,
  onRetryBackend
}) => {
  // Priorité d'affichage : Auth Error > Loading > Saving > Backend Status
  if (authError) {
    return (
      <div className="absolute top-2 left-2 z-50 bg-red-100 border border-red-300 rounded-lg px-3 py-1 text-xs text-red-800 shadow-sm max-w-xs">
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-0.5"></div>
          <div className="flex-1">
            <div className="font-medium">🔒 Erreur d'Authentification</div>
            <div className="text-xs mt-1 text-red-700">{authError}</div>
            <button 
              onClick={onRetryBackend}
              className="mt-2 px-2 py-1 bg-red-200 hover:bg-red-300 rounded text-red-900 transition-colors text-xs"
              title="Réessayer après connexion"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute top-2 left-2 z-50 bg-blue-100 border border-blue-300 rounded-lg px-3 py-1 text-xs text-blue-800 shadow-sm animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin border-2 border-blue-300 border-t-transparent"></div>
          <span>📥 Chargement transformations...</span>
        </div>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="absolute top-2 left-2 z-50 bg-green-100 border border-green-300 rounded-lg px-3 py-1 text-xs text-green-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span>💾 Sauvegarde en cours...</span>
        </div>
      </div>
    );
  }

  if (!backendAvailable) {
    return (
      <div className="absolute top-2 right-2 z-50 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1 text-xs text-yellow-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span>💾 Mode local actif</span>
          <button 
            onClick={onRetryBackend}
            className="ml-1 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-yellow-900 transition-colors"
            title="Resynchroniser avec le serveur"
          >
            🔄 Sync
          </button>
        </div>
      </div>
    );
  }

  // Mode normal : backend disponible, pas de sauvegarde en cours
  return (
    <div className="absolute top-2 right-2 z-50 bg-green-100 border border-green-300 rounded-lg px-3 py-1 text-xs text-green-800 shadow-sm opacity-75">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>✅ Synchronisé</span>
      </div>
    </div>
  );
};

export default TransformStatusIndicator; 
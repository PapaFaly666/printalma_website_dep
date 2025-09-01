import React from 'react';
import { useDesignTransformsOptimized } from '../hooks/useDesignTransformsOptimized';
import { DesignTransformsDiagnostic } from './DesignTransformsDiagnostic';

interface Props {
  vendorProductId: number;
  designUrl: string;
  onTransformChange?: (transforms: Record<string, any>) => void;
}

export function DesignTransformsManager({ 
  vendorProductId, 
  designUrl, 
  onTransformChange 
}: Props) {
  const {
    transforms,
    isLoading,
    isDirty,
    isSaving,
    error,
    updateTransform,
    saveManually,
    resetToBackend,
    hasUnsavedChanges,
    isInitialized
  } = useDesignTransformsOptimized({
    vendorProductId,
    designUrl,
    autoSaveDelay: 3000 // 3 secondes avant auto-save
  });

  // Notifier le parent des changements
  React.useEffect(() => {
    onTransformChange?.(transforms);
  }, [transforms, onTransformChange]);

  // Affichage pendant le chargement initial avec timeout de sécurité
  if (isLoading && !isInitialized) {
    return (
      <>
        <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-blue-700 dark:text-blue-400">Chargement des transformations...</span>
        </div>
        
        {/* Diagnostic automatique si chargement > 5s */}
        <DesignTransformsDiagnostic
          vendorProductId={vendorProductId}
          designUrl={designUrl}
          isLoading={isLoading}
          isInitialized={isInitialized}
          error={error}
          transforms={transforms}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicateur d'état */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <>
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-orange-700 dark:text-orange-400">Modifications non sauvées</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 dark:text-green-400">Sauvegardé</span>
            </>
          )}
          
          {isSaving && (
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-xs">Sauvegarde...</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <>
              <button
                onClick={resetToBackend}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isSaving}
              >
                Annuler
              </button>
              <button
                onClick={saveManually}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Recharger la page
            </button>
            <button
              onClick={() => {
                // Nettoyer localStorage et recharger
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith('design_transforms')) {
                    localStorage.removeItem(key);
                  }
                });
                window.location.reload();
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Nettoyer cache & recharger
            </button>
          </div>
        </div>
      )}

      {/* Diagnostic si erreur persistante */}
      {error && (
        <DesignTransformsDiagnostic
          vendorProductId={vendorProductId}
          designUrl={designUrl}
          isLoading={isLoading}
          isInitialized={isInitialized}
          error={error}
          transforms={transforms}
        />
      )}

      {/* Informations de debug (dev seulement) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary>Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
            {JSON.stringify({ 
              transforms, 
              isDirty, 
              isSaving,
              isInitialized,
              transformsCount: Object.keys(transforms).length,
              vendorProductId,
              designUrlLength: designUrl?.length || 0
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
} 
import React, { useState } from 'react';
import { autoValidationService, AutoValidationResult } from '../../services/autoValidationService';

interface AutoValidationControlsProps {
  onValidationComplete?: (result: AutoValidationResult) => void;
  className?: string;
}

const AutoValidationControls: React.FC<AutoValidationControlsProps> = ({
  onValidationComplete,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AutoValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAutoValidateAll = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await autoValidationService.autoValidateAll();
      setLastResult(result);
      
      if (onValidationComplete) {
        onValidationComplete(result);
      }
      
      // Afficher un message de succès
      console.log(`🤖 Auto-validation: ${result.message}`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'auto-validation';
      setError(errorMessage);
      console.error('Erreur auto-validation:', err);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bouton d'auto-validation globale */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleAutoValidateAll}
          disabled={isLoading}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors duration-200
            ${isLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
              <span>Auto-validation en cours...</span>
            </>
          ) : (
            <>
              <span className="text-base">🤖</span>
              <span>Auto-valider tous les produits éligibles</span>
            </>
          )}
        </button>

        {/* Indicateur du dernier résultat */}
        {lastResult && !isLoading && (
          <div className="text-sm text-green-600">
            ✅ {lastResult.updated.length} produit(s) auto-validé(s)
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <span className="text-base">❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* Résumé des produits auto-validés */}
      {lastResult && lastResult.updated.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">
            🎉 Produits auto-validés ({lastResult.updated.length})
          </h4>
          <div className="space-y-1">
            {lastResult.updated.slice(0, 5).map((product) => (
              <div key={product.id} className="text-sm text-green-700">
                • <span className="font-medium">{product.name}</span> 
                <span className="text-xs opacity-75 ml-2">
                  (ID: {product.id})
                </span>
              </div>
            ))}
            {lastResult.updated.length > 5 && (
              <div className="text-sm text-green-600 italic">
                ... et {lastResult.updated.length - 5} autre(s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information explicative */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <div className="flex items-start gap-2">
          <span className="text-base mt-0.5">ℹ️</span>
          <div>
            <p className="font-medium mb-1">Comment fonctionne l'auto-validation ?</p>
            <p>
              Un produit vendeur est automatiquement validé lorsque <strong>tous ses designs</strong> 
              ont été approuvés par un administrateur. Cela évite la double validation des éléments 
              déjà vérifiés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoValidationControls;
import React, { useState } from 'react';
import { autoValidationService, AutoValidationResult } from '../../services/autoValidationService';

interface AutoValidationButtonProps {
  designId?: number;
  onSuccess?: (result: AutoValidationResult) => void;
  onError?: (error: Error) => void;
  variant: 'design' | 'global';
  className?: string;
}

export const AutoValidationButton: React.FC<AutoValidationButtonProps> = ({
  designId,
  onSuccess,
  onError,
  variant,
  className = ""
}) => {
  const [loading, setLoading] = useState(false);

  const handleAutoValidation = async () => {
    setLoading(true);
    try {
      let result;
      
      if (variant === 'design' && designId) {
        result = await autoValidationService.autoValidateProductsForDesign(designId);
      } else {
        result = await autoValidationService.autoValidateAllProducts();
      }

      onSuccess?.(result);
      
      // Notification de succès
      console.log(`🤖 ${result.message}`);
      
    } catch (error) {
      onError?.(error as Error);
      console.error('Erreur auto-validation:', error);
    } finally {
      setLoading(false);
    }
  };

  const buttonText = variant === 'design' 
    ? 'Auto-valider les produits de ce design'
    : 'Auto-valider tous les produits éligibles';

  return (
    <button
      onClick={handleAutoValidation}
      disabled={loading || (variant === 'design' && !designId)}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
        ${loading 
          ? 'bg-gray-400 cursor-not-allowed text-white' 
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
        }
        ${className}
      `}
    >
      {loading ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Auto-validation en cours...</span>
        </>
      ) : (
        <>
          <span className="text-base">🤖</span>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};

export default AutoValidationButton;
import React from 'react';
import { PostValidationAction } from '../../types/vendorProduct';
import { useVendorValidation } from '../../hooks/useVendorValidation';

interface ValidationActionSelectorProps {
  productId: number;
  currentAction: PostValidationAction;
  disabled?: boolean;
  onActionChange?: (action: PostValidationAction) => void;
}

export const ValidationActionSelector: React.FC<ValidationActionSelectorProps> = ({
  productId,
  currentAction,
  disabled = false,
  onActionChange
}) => {
  const { validationChoices, setValidationAction, loading } = useVendorValidation();

  const handleActionChange = async (action: PostValidationAction) => {
    const result = await setValidationAction(productId, action);
    if (result.success && onActionChange) {
      onActionChange(action);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Que faire après validation admin ?
      </h3>
      
      <div className="space-y-2">
        {validationChoices.map((choice) => (
          <label
            key={choice.action}
            className={`
              flex items-start p-4 border rounded-lg cursor-pointer transition-all
              ${currentAction === choice.action 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="validationAction"
              value={choice.action}
              checked={currentAction === choice.action}
              onChange={() => !disabled && handleActionChange(choice.action)}
              disabled={disabled || loading}
              className="mt-1 mr-3"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{choice.icon}</span>
                <span className="font-medium text-gray-900 dark:text-white">{choice.label}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{choice.description}</p>
            </div>
          </label>
        ))}
      </div>
      
      {loading && (
        <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Mise à jour en cours...
        </div>
      )}
    </div>
  );
}; 
 
import React from 'react';
import { PostValidationAction } from '../../types/cascadeValidation';

interface PostValidationActionSelectorProps {
  currentAction: PostValidationAction;
  onActionChange: (action: PostValidationAction) => void;
  disabled?: boolean;
  className?: string;
}

export const PostValidationActionSelector: React.FC<PostValidationActionSelectorProps> = ({
  currentAction,
  onActionChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Que faire après validation du design ?
      </label>
      
      <div className="space-y-3">
        <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.AUTO_PUBLISH}
            checked={currentAction === PostValidationAction.AUTO_PUBLISH}
            onChange={(e) => onActionChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mt-1 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                🚀 Publication automatique
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Le produit sera publié immédiatement après validation du design par l'administrateur
            </p>
          </div>
        </label>
        
        <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.TO_DRAFT}
            checked={currentAction === PostValidationAction.TO_DRAFT}
            onChange={(e) => onActionChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mt-1 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                📝 Publication manuelle
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Le produit sera mis en brouillon validé, je pourrai le publier quand je veux
            </p>
          </div>
        </label>
      </div>
      
      {disabled && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          ⚠️ Impossible de modifier après validation
        </p>
      )}
    </div>
  );
}; 
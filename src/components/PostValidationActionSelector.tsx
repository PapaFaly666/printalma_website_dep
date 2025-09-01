// components/PostValidationActionSelector.tsx

import React from 'react';
import { PostValidationAction } from '../types/cascadeValidation';

interface PostValidationActionSelectorProps {
  value: PostValidationAction;
  onChange: (action: PostValidationAction) => void;
  disabled?: boolean;
  className?: string;
}

export const PostValidationActionSelector: React.FC<PostValidationActionSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Après validation du design :
      </label>
      
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.AUTO_PUBLISH}
            checked={value === PostValidationAction.AUTO_PUBLISH}
            onChange={(e) => onChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              📦 Publier automatiquement
            </span>
            <p className="text-xs text-gray-500">
              Le produit sera publié dès que l'admin valide le design
            </p>
          </div>
        </label>
        
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.TO_DRAFT}
            checked={value === PostValidationAction.TO_DRAFT}
            onChange={(e) => onChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              📝 Mettre en brouillon
            </span>
            <p className="text-xs text-gray-500">
              Je publierai manuellement après validation
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}; 
 
 
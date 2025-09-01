import React from 'react';
import { PostValidationAction } from '../../types/cascadeValidation';

interface PostValidationActionSelectorProps {
  currentAction: PostValidationAction;
  onActionChange: (action: PostValidationAction) => void;
  disabled?: boolean;
}

export const PostValidationActionSelector: React.FC<PostValidationActionSelectorProps> = ({
  currentAction,
  onActionChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Que faire après validation du design ?
      </label>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.AUTO_PUBLISH}
            checked={currentAction === PostValidationAction.AUTO_PUBLISH}
            onChange={(e) => onActionChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <span className="text-sm">
            📢 <strong>Publier automatiquement</strong> - Le produit sera visible immédiatement
          </span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.TO_DRAFT}
            checked={currentAction === PostValidationAction.TO_DRAFT}
            onChange={(e) => onActionChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <span className="text-sm">
            📝 <strong>Mettre en brouillon</strong> - Je publierai manuellement plus tard
          </span>
        </label>
      </div>
    </div>
  );
}; 
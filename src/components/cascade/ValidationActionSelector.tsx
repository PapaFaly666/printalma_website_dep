// Sélecteur d'action post-validation pour le système de cascade

import React from 'react';
import { PostValidationAction } from '../../types/cascadeValidation';
import { Button } from '../ui/button';
import { Rocket, FileText } from 'lucide-react';

interface ValidationActionSelectorProps {
  selectedAction: PostValidationAction;
  onActionChange: (action: PostValidationAction) => void;
  disabled?: boolean;
}

export const ValidationActionSelector: React.FC<ValidationActionSelectorProps> = ({
  selectedAction,
  onActionChange,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Action après validation du design
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Publication automatique */}
        <Button
          variant={selectedAction === PostValidationAction.AUTO_PUBLISH ? "default" : "outline"}
          onClick={() => onActionChange(PostValidationAction.AUTO_PUBLISH)}
          disabled={disabled}
          className="h-auto p-4 flex-col items-start text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="h-5 w-5" />
            <span className="font-medium">Publier directement</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Le produit sera publié automatiquement après validation du design par l'admin
          </p>
        </Button>

        {/* Mise en brouillon */}
        <Button
          variant={selectedAction === PostValidationAction.TO_DRAFT ? "default" : "outline"}
          onClick={() => onActionChange(PostValidationAction.TO_DRAFT)}
          disabled={disabled}
          className="h-auto p-4 flex-col items-start text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5" />
            <span className="font-medium">Mettre en brouillon</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Le produit sera mis en brouillon après validation, vous pourrez le publier manuellement
          </p>
        </Button>
      </div>
    </div>
  );
};

export default ValidationActionSelector; 
 
import React from 'react';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { Rocket, Edit3, Info } from 'lucide-react';

interface WorkflowSelectorProps {
  workflowType: 'auto-publish' | 'manual-publish';
  onWorkflowChange: (type: 'auto-publish' | 'manual-publish') => void;
  designValidationStatus: {
    isValidated: boolean;
    needsValidation: boolean;
    message: string;
  };
  isPublishing?: boolean;
  onPublish: () => void;
}

/**
 * 🎯 Composant de sélection de workflow selon les spécifications backend
 * Implémente les deux workflows AUTO-PUBLISH et MANUAL-PUBLISH
 */
export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflowType,
  onWorkflowChange,
  designValidationStatus,
  isPublishing = false,
  onPublish
}) => {
  return (
    <div className="space-y-6">
      {/* 🆕 CHOIX DE WORKFLOW SELON LES SPÉCIFICATIONS */}
      <div className="publication-choice p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Workflow de publication
        </h3>
        
        <div className="space-y-3">
          <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            workflowType === 'auto-publish' 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}>
            <input 
              type="radio" 
              name="publicationWorkflow" 
              value="auto-publish"
              checked={workflowType === 'auto-publish'}
              onChange={() => onWorkflowChange('auto-publish')}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Rocket className="h-4 w-4 text-green-600" />
                📤 Publication automatique
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {designValidationStatus.isValidated 
                  ? 'Vos produits seront publiés immédiatement (design déjà validé)'
                  : 'Vos produits seront publiés automatiquement après validation du design par l\'admin'
                }
              </p>
              <div className="mt-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                  forcedStatus: PENDING
                </Badge>
              </div>
            </div>
          </label>
          
          <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            workflowType === 'manual-publish' 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}>
            <input 
              type="radio" 
              name="publicationWorkflow" 
              value="manual-publish"
              checked={workflowType === 'manual-publish'}
              onChange={() => onWorkflowChange('manual-publish')}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-600" />
                📝 Mettre en brouillon
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Vos produits resteront en brouillon après validation. Vous pourrez les publier quand vous voulez
              </p>
              <div className="mt-2">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs">
                  forcedStatus: DRAFT
                </Badge>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Bouton principal basé sur le workflow choisi */}
      <Button
        onClick={onPublish}
        disabled={isPublishing}
        className={`w-full ${
          workflowType === 'auto-publish'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-purple-600 hover:bg-purple-700'
        } text-white`}
      >
        {isPublishing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Création en cours...
          </>
        ) : (
          <>
            {workflowType === 'auto-publish' ? (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                {designValidationStatus.isValidated ? 'Publier directement' : 'Créer en attente'}
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Créer en brouillon
              </>
            )}
          </>
        )}
      </Button>
      
      {/* Message explicatif */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {workflowType === 'auto-publish' 
          ? (designValidationStatus.isValidated 
              ? 'Publication immédiate (design validé)' 
              : 'Création en attente de validation admin'
            )
          : 'Création en brouillon - publication manuelle requise'
        }
      </p>

      {/* Debug info pour développement */}
      <div className="text-xs text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded border">
        <div><strong>Debug:</strong></div>
        <div>Workflow choisi: {workflowType}</div>
        <div>forcedStatus envoyé: {workflowType === 'auto-publish' ? 'PENDING' : 'DRAFT'}</div>
        <div>Design validé: {designValidationStatus.isValidated ? 'Oui' : 'Non'}</div>
      </div>
    </div>
  );
};

export default WorkflowSelector; 
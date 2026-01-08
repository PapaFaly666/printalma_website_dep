import React from 'react';
import { PostValidationAction } from '../../types/cascadeValidation';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/Button';
import { Rocket, FileText, Info, CheckCircle, Clock } from 'lucide-react';

interface DesignValidationStatus {
  isValidated: boolean;
  needsValidation: boolean;
  message: string;
}

interface PostValidationActionSelectorProps {
  currentAction: PostValidationAction;
  onActionChange: (action: PostValidationAction) => void;
  disabled?: boolean;
  className?: string;
  designValidationStatus?: DesignValidationStatus;
}

export const PostValidationActionSelectorIntegrated: React.FC<PostValidationActionSelectorProps> = ({
  currentAction,
  onActionChange,
  disabled = false,
  className = "",
  designValidationStatus
}) => {
  // Descriptions adaptées selon le statut de validation du design
  const getActions = () => {
    if (!designValidationStatus?.isValidated) {
      // Design non validé
      return [
        {
          value: PostValidationAction.AUTO_PUBLISH,
          label: "🚀 Publier directement",
          description: "Le produit sera publié automatiquement une fois le design validé par l'administrateur",
          icon: <Rocket className="w-5 h-5" />,
          color: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100",
          textColor: "text-yellow-800",
          recommended: true
        },
        {
          value: PostValidationAction.TO_DRAFT,
          label: "💾 Sauver en brouillon",
          description: "Le design doit être validé avant publication. Sera mis en brouillon après validation.",
          icon: <FileText className="w-5 h-5" />,
          color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
          textColor: "text-blue-800",
          recommended: false
        }
      ];
    } else {
      // Design validé
      return [
        {
          value: PostValidationAction.AUTO_PUBLISH,
          label: "🚀 Publier maintenant",
          description: "Le produit sera publié immédiatement et visible par tous les clients",
          icon: <Rocket className="w-5 h-5" />,
          color: "border-green-200 bg-green-50 hover:bg-green-100",
          textColor: "text-green-800",
          recommended: true
        },
        {
          value: PostValidationAction.TO_DRAFT,
          label: "💾 Sauver en brouillon",
          description: "Sauver sans publier immédiatement",
          icon: <FileText className="w-5 h-5" />,
          color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
          textColor: "text-blue-800",
          recommended: false
        }
      ];
    }
  };

  const actions = getActions();

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="w-5 h-5 text-blue-600" />
          Options de publication
        </CardTitle>

        {/* Indicateur de statut design */}
        {designValidationStatus && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            designValidationStatus.isValidated
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {designValidationStatus.isValidated ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">✅ Design validé - Publication autorisée</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span className="font-medium">⏳ Design en attente de validation admin</span>
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <div key={action.value} className="relative">
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onActionChange(action.value)}
                className={`
                  w-full p-4 h-auto text-left justify-start transition-all duration-200
                  ${currentAction === action.value 
                    ? `${action.color} border-2 ${action.textColor}` 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    ${currentAction === action.value 
                      ? 'bg-white shadow-sm' 
                      : 'bg-gray-100'
                    }
                  `}>
                    {action.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {action.label}
                      </span>
                      {action.recommended && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                          Recommandé
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${currentAction === action.value 
                      ? 'border-current bg-current' 
                      : 'border-gray-300'
                    }
                  `}>
                    {currentAction === action.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Comment ça marche ?</p>
              {!designValidationStatus?.isValidated ? (
                <p>
                  Votre design doit d'abord être validé par l'administrateur.
                  Selon votre choix, le produit sera soit publié automatiquement après validation,
                  soit mis en brouillon pour une publication manuelle.
                </p>
              ) : (
                <p>
                  Votre design est validé ! Vous pouvez publier immédiatement
                  ou sauvegarder en brouillon pour publier plus tard.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 
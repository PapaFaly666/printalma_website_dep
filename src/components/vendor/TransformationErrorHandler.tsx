import React from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { 
  AlertCircle, 
  RefreshCw, 
  Shield, 
  Copy, 
  FileX,
  ServerCrash,
  Ban
} from 'lucide-react';
import { TransformationError } from '../../services/transformationService';

interface TransformationErrorHandlerProps {
  error: TransformationError | Error | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  onRedirect403?: () => void;
  className?: string;
}

export const TransformationErrorHandler: React.FC<TransformationErrorHandlerProps> = ({
  error,
  onRetry,
  onRefresh,
  onRedirect403,
  className = ''
}) => {
  if (!error) return null;

  const transformationError = error instanceof TransformationError ? error : null;
  const errorCode = transformationError?.code || 0;
  const errorMessage = transformationError?.message || error.message;
  const errorDetails = transformationError?.details;

  // Rendu selon le type d'erreur - Étape 6 de la documentation
  const renderErrorContent = () => {
    switch (errorCode) {
      case 400:
        return (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p><strong>Données invalides :</strong> {errorMessage}</p>
                {errorDetails?.details && (
                  <p className="text-sm text-red-700">
                    {errorDetails.details}
                  </p>
                )}
                <div className="flex space-x-2">
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Réessayer
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 403:
        return (
          <Alert className="border-orange-200 bg-orange-50">
            <Shield className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p><strong>Permission refusée :</strong> {errorMessage}</p>
                <p className="text-sm text-orange-700">
                  Vous n'êtes pas propriétaire de cette ressource.
                </p>
                <div className="flex space-x-2">
                  {onRedirect403 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRedirect403}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Page d'erreur 403
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 409:
        return (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Copy className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-2">
                <p><strong>Doublon détecté :</strong> {errorMessage}</p>
                <p className="text-sm text-yellow-700">
                  Cette ressource existe déjà. Rechargez la liste pour utiliser l'élément existant.
                </p>
                <div className="flex space-x-2">
                  {onRefresh && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Recharger la liste
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 404:
        return (
          <Alert className="border-blue-200 bg-blue-50">
            <FileX className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p><strong>Ressource introuvable :</strong> {errorMessage}</p>
                <p className="text-sm text-blue-700">
                  La ressource demandée n'existe pas ou a été supprimée.
                </p>
                <div className="flex space-x-2">
                  {onRefresh && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Rafraîchir
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 500:
        return (
          <Alert className="border-red-200 bg-red-50">
            <ServerCrash className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p><strong>Erreur serveur :</strong> {errorMessage}</p>
                <p className="text-sm text-red-700">
                  Une erreur interne du serveur s'est produite. Veuillez réessayer plus tard.
                </p>
                <div className="flex space-x-2">
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Réessayer
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      default:
        return (
          <Alert className="border-gray-200 bg-gray-50">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-800">
              <div className="space-y-2">
                <p><strong>Erreur :</strong> {errorMessage}</p>
                {errorDetails && (
                  <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                )}
                <div className="flex space-x-2">
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Réessayer
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className={`${className}`}>
      {renderErrorContent()}
    </div>
  );
};

// Hook pour utiliser facilement le gestionnaire d'erreurs
export const useTransformationErrorHandler = () => {
  const handleError = (error: TransformationError | Error) => {
    if (error instanceof TransformationError) {
      switch (error.code) {
        case 403:
          // Rediriger vers la page 403
          window.location.href = '/403';
          break;
        case 409:
          // Recharger la page ou rafraîchir les données
          window.location.reload();
          break;
        default:
          // Afficher l'erreur via toast ou modal
          console.error('Erreur transformation:', error);
      }
    } else {
      console.error('Erreur générale:', error);
    }
  };

  return { handleError };
};

export default TransformationErrorHandler; 
/**
 * 🚨 Composant de diagnostic et gestion des erreurs d'accès vendeur
 * Basé sur VENDOR_ACCOUNT_STATUS_GUIDE.md
 */

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle, RefreshCw, LogIn, Mail, Shield } from 'lucide-react';
import { vendorErrorHandler } from '../../services/vendorErrorHandler';
import { vendorReactivation } from '../../services/vendorReactivationService';

interface VendorAccessErrorProps {
  error?: any;
  onAction?: (action: string) => void;
  className?: string;
}

interface RecommendedAction {
  type: string;
  title: string;
  message: string;
  primaryAction?: string;
  primaryUrl?: string;
  secondaryAction?: string;
  secondaryUrl?: string;
  showReactivationForm: boolean;
  userId?: number;
  userEmail?: string;
}

const VendorAccessError: React.FC<VendorAccessErrorProps> = ({
  error,
  onAction,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<RecommendedAction | null>(null);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    // Diagnostiquer automatiquement au montage
    diagnoseProblem();
  }, [error]);

  const diagnoseProblem = async () => {
    setIsLoading(true);
    try {
      const result = await vendorErrorHandler.handleAccessError(error);
      setDiagnosis(result);
    } catch (err) {
      console.error('Erreur diagnostic:', err);
      // Fallback en cas d'erreur de diagnostic
      setDiagnosis({
        type: 'UNKNOWN_ERROR',
        title: 'Erreur de diagnostic',
        message: 'Impossible de diagnostiquer le problème. Veuillez rafraîchir la page.',
        showReactivationForm: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivation = async () => {
    setReactivating(true);
    try {
      await vendorReactivation.reactivateAccount('Réactivation depuis l\'erreur d\'accès');

      // Notifier le succès
      if (onAction) {
        onAction('reactivated');
      }

      // Recharger la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur lors de la réactivation:', error);
      // En cas d'erreur, on peut rediriger vers la page de profil
      window.location.href = '/vendeur/account';
    } finally {
      setReactivating(false);
    }
  };

  const handlePrimaryAction = () => {
    if (!diagnosis) return;

    if (diagnosis.type === 'SHOW_REACTIVATION_FORM') {
      handleReactivation();
    } else if (diagnosis.primaryUrl) {
      window.location.href = diagnosis.primaryUrl;
    }

    if (onAction) {
      onAction(diagnosis.type);
    }
  };

  const handleSecondaryAction = () => {
    if (!diagnosis?.secondaryUrl) return;
    window.location.href = diagnosis.secondaryUrl;
  };

  if (isLoading) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">🔍 Diagnostic en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diagnosis) {
    return (
      <Card className={`w-full max-w-md mx-auto border-red-200 ${className}`}>
        <CardContent className="pt-6">
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              ❌ Impossible de diagnostiquer le problème. Veuillez rafraîchir la page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getErrorIcon = () => {
    switch (diagnosis.type) {
      case 'SESSION_EXPIRED':
        return <LogIn className="h-8 w-8 text-blue-600" />;
      case 'ACCOUNT_DEACTIVATED':
        return <AlertTriangle className="h-8 w-8 text-orange-600" />;
      case 'INSUFFICIENT_ROLE':
        return <Shield className="h-8 w-8 text-red-600" />;
      case 'CONTACT_ADMIN':
        return <Mail className="h-8 w-8 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-gray-600" />;
    }
  };

  const getCardBorderColor = () => {
    switch (diagnosis.type) {
      case 'SESSION_EXPIRED':
        return 'border-blue-200';
      case 'ACCOUNT_DEACTIVATED':
        return 'border-orange-200';
      case 'INSUFFICIENT_ROLE':
        return 'border-red-200';
      case 'CONTACT_ADMIN':
        return 'border-yellow-200';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${getCardBorderColor()} ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          {getErrorIcon()}
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {diagnosis.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-600 text-center text-sm">
          {diagnosis.message}
        </p>

        <div className="space-y-2">
          {diagnosis.type === 'SHOW_REACTIVATION_FORM' && (
            <Button
              onClick={handleReactivation}
              disabled={reactivating}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {reactivating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Réactivation...
                </>
              ) : (
                diagnosis.primaryAction
              )}
            </Button>
          )}

          {diagnosis.type === 'REDIRECT_TO_LOGIN' && (
            <Button
              onClick={handlePrimaryAction}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {diagnosis.primaryAction}
            </Button>
          )}

          {diagnosis.type === 'CONTACT_ADMIN' && (
            <Button
              onClick={handlePrimaryAction}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              {diagnosis.primaryAction}
            </Button>
          )}

          {diagnosis.secondaryAction && (
            <Button
              onClick={handleSecondaryAction}
              variant="outline"
              className="w-full"
            >
              {diagnosis.secondaryAction}
            </Button>
          )}
        </div>

        {diagnosis.userEmail && (
          <div className="text-center pt-2 border-t border-gray-100">
            <small className="text-gray-500">
              Compte: {diagnosis.userEmail}
            </small>
          </div>
        )}

        {reactivating && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700 text-sm">
              ✅ Réactivation en cours... La page va se recharger automatiquement.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorAccessError;
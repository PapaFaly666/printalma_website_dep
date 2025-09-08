import React, { useEffect, useState, ReactNode } from 'react';
import { checkAdminAuth, redirectToLogin, type AuthCheckResult } from '../../middleware/authMiddleware';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '../ui/button';

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
  showAuthStatus?: boolean;
  requireAdmin?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  redirectTo = '/login',
  showAuthStatus = false,
  requireAdmin = true
}) => {
  const [authResult, setAuthResult] = useState<AuthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const checkAuth = () => {
    try {
      const result = checkAdminAuth();
      setAuthResult(result);
      
      // Si pas authentifié ou pas admin (selon requireAdmin), rediriger
      if (!result.isAuthenticated || (requireAdmin && !result.hasAdminAccess)) {
        setTimeout(() => {
          redirectToLogin(result.error);
        }, showAuthStatus ? 3000 : 100); // Délai plus long si on affiche le status
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setAuthResult({
        isAuthenticated: false,
        hasAdminAccess: false,
        error: 'Erreur de vérification d\'authentification'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
  };

  const handleGoToLogin = () => {
    redirectToLogin('Accès manuel vers login');
  };

  // Chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vérification des permissions
            </h2>
            <p className="text-gray-600 text-center">
              Validation de votre authentification en cours...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pas d'authentification
  if (!authResult || !authResult.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentification requise
            </h2>
            
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {authResult?.error || 'Vous devez être connecté pour accéder à cette page'}
              </AlertDescription>
            </Alert>
            
            {showAuthStatus && (
              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <p>🔍 Recherche de token en cours...</p>
                <p>⏱️ Redirection automatique dans 3 secondes</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline" size="sm">
                Réessayer
              </Button>
              <Button onClick={handleGoToLogin} size="sm">
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permissions insuffisantes
  if (requireAdmin && !authResult.hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Permissions insuffisantes
            </h2>
            
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                {authResult.error || 'Accès administrateur requis pour cette page'}
              </AlertDescription>
            </Alert>
            
            {showAuthStatus && authResult.userInfo && (
              <div className="text-sm text-gray-600 mb-4 space-y-1 text-center">
                <p>👤 Connecté en tant que: <strong>{authResult.userInfo.role}</strong></p>
                <p>📧 Email: {authResult.userInfo.email}</p>
                <p>⏰ Session expire: {new Date(authResult.userInfo.exp * 1000).toLocaleString()}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleGoToLogin} variant="outline" size="sm">
                Changer de compte
              </Button>
              <Button onClick={() => window.history.back()} size="sm">
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tout va bien, afficher le contenu
  return (
    <>
      {showAuthStatus && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-green-800 text-sm">
              <Shield className="h-4 w-4" />
              <span>✅ Authentifié en tant qu'admin</span>
              {authResult.userInfo && (
                <span>({authResult.userInfo.role})</span>
              )}
            </div>
            
            <div className="text-xs text-green-600">
              Session expire: {authResult.userInfo?.exp 
                ? new Date(authResult.userInfo.exp * 1000).toLocaleTimeString()
                : 'N/A'
              }
            </div>
          </div>
        </div>
      )}
      
      {children}
    </>
  );
};

// Composant d'ordre supérieur pour wrapper facilement les pages
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<RequireAuthProps, 'children'>
) => {
  return (props: P) => (
    <RequireAuth {...options}>
      <Component {...props} />
    </RequireAuth>
  );
};

export default RequireAuth;
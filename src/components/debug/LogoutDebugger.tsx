import React, { useState } from 'react';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CookieUtils, useCookieDebug } from '../../utils/cookieUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Bug, RefreshCw, Trash2, LogOut } from 'lucide-react';

/**
 * Composant de débogage pour diagnostiquer les problèmes de déconnexion
 * À utiliser temporairement pour identifier le problème avec les cookies HTTP
 */
export const LogoutDebugger: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuth();
  const { debugLogout, clearCookies, checkSession, debugCookies } = useCookieDebug();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleDebugLogout = async () => {
    console.log('🔍 Démarrage du diagnostic de déconnexion...');
    const info = await debugLogout();
    setDebugInfo(info);
  };

  const handleForceLogout = async () => {
    console.log('🚀 Déconnexion forcée...');
    await logout();
    // Attendre un peu puis refaire le diagnostic
    setTimeout(async () => {
      const info = await debugLogout();
      setDebugInfo(info);
    }, 1000);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Débogueur de Déconnexion
        </CardTitle>
        <p className="text-sm text-gray-600">
          Outils de diagnostic pour résoudre les problèmes de déconnexion avec cookies HTTP
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* État actuel */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <strong>État:</strong>
            <Badge className={isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isAuthenticated ? 'Connecté' : 'Déconnecté'}
            </Badge>
          </div>
          {user && (
            <div>
              <strong>Utilisateur:</strong> {user.firstName} {user.lastName} ({user.role})
            </div>
          )}
        </div>

        {/* Actions de diagnostic */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={handleDebugLogout} variant="outline" size="sm">
            <Bug className="h-4 w-4 mr-2" />
            Diagnostic
          </Button>
          
          <Button onClick={debugCookies} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Voir Cookies
          </Button>
          
          <Button onClick={clearCookies} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Nettoyer Cookies
          </Button>
          
          <Button onClick={handleForceLogout} variant="destructive" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion Test
          </Button>
        </div>

        {/* Résultats du diagnostic */}
        {debugInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Résultats du Diagnostic</h3>
            
            {/* Cookies côté client */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">🍪 Cookies côté client ({debugInfo.clientCookies.length})</h4>
              {debugInfo.clientCookies.length > 0 ? (
                <div className="space-y-1">
                  {debugInfo.clientCookies.map((cookie: any, index: number) => (
                    <div key={index} className="text-sm font-mono">
                      <strong>{cookie.name}:</strong> {cookie.value?.substring(0, 50)}...
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Aucun cookie visible côté client</p>
              )}
            </div>

            {/* Cookies de session */}
            <div className={`p-4 rounded-lg ${debugInfo.sessionCookies.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <h4 className="font-medium mb-2">
                🔑 Cookies de session ({debugInfo.sessionCookies.length})
                {debugInfo.sessionCookies.length > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800">PROBLÈME DÉTECTÉ</Badge>
                )}
              </h4>
              {debugInfo.sessionCookies.length > 0 ? (
                <div className="space-y-1">
                  {debugInfo.sessionCookies.map((cookie: string, index: number) => (
                    <div key={index} className="text-sm font-mono text-red-700">
                      {cookie}
                    </div>
                  ))}
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Ces cookies de session persistent après déconnexion !
                  </p>
                </div>
              ) : (
                <p className="text-sm text-green-600">✅ Aucun cookie de session détecté</p>
              )}
            </div>

            {/* État du backend */}
            <div className={`p-4 rounded-lg ${
              debugInfo.backendState.connected 
                ? debugInfo.backendState.authenticated 
                  ? 'bg-red-50' 
                  : 'bg-green-50'
                : 'bg-yellow-50'
            }`}>
              <h4 className="font-medium mb-2">
                📡 État du backend
                {debugInfo.backendState.connected && debugInfo.backendState.authenticated && (
                  <Badge className="ml-2 bg-red-100 text-red-800">UTILISATEUR ENCORE CONNECTÉ</Badge>
                )}
              </h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Connecté:</strong> {debugInfo.backendState.connected ? '✅' : '❌'}
                </div>
                <div>
                  <strong>Authentifié:</strong> {debugInfo.backendState.authenticated ? '❌ PROBLÈME' : '✅'}
                </div>
                {debugInfo.backendState.data && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    {JSON.stringify(debugInfo.backendState.data, null, 2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium mb-2">💡 Guide de diagnostic</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Cliquez sur "Diagnostic" pour analyser l'état actuel</li>
            <li>Si des cookies de session persistent, le problème vient du backend</li>
            <li>Si l'utilisateur reste authentifié côté backend, vérifiez l'endpoint de déconnexion</li>
            <li>Ouvrez la console pour voir les logs détaillés</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}; 
import { useEffect } from 'react';
import { hybridAuthService } from '../services/hybridAuthService';

/**
 * Hook pour s'assurer que le token est bien chargé depuis localStorage
 * Utilise en production pour corriger les problèmes 401
 */
export const useTokenRefresh = () => {
  useEffect(() => {
    // Forcer le rechargement du token à chaque fois que le hook est appelé
    console.log('🔄 useTokenRefresh - Rechargement forcé du token...');
    hybridAuthService.loadTokenFromStorage();

    // Forcer aussi la sauvegarde du token depuis le localStorage existant
    const authSession = localStorage.getItem('auth_session');
    if (authSession) {
      try {
        const data = JSON.parse(authSession);
        if (data.token || data.jwt) {
          const token = data.token || data.jwt;
          hybridAuthService.setToken(token);
          console.log('🔑 Token forcé dans le service hybride:', token.substring(0, 30) + '...');
        }
      } catch (e) {
        console.warn('⚠️ Erreur parsing session dans useTokenRefresh:', e);
      }
    }
  }, []); // Se déclenche une seule fois par composant
};

export default useTokenRefresh;
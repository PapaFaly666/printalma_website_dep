import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour maintenir la persistance de l'authentification
 * Vérifie périodiquement la validité de la session
 */
export const useAuthPersistence = () => {
  const { checkAuth, isAuthenticated, loading } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ne pas démarrer la vérification périodique si on est en train de charger la première fois
    if (loading) return;

    // Vérifier l'authentification toutes les 5 minutes si l'utilisateur est connecté
    if (isAuthenticated) {
      intervalRef.current = setInterval(() => {
        checkAuth();
      }, 5 * 60 * 1000); // 5 minutes
    } else {
      // Nettoyer l'intervalle si l'utilisateur n'est pas connecté
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Nettoyage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, loading, checkAuth]);

  // Vérifier l'authentification quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && !loading) {
        checkAuth();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && !loading) {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, loading, checkAuth]);
};
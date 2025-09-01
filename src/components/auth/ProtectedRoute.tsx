import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageLoading from '../ui/loading';
import { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Composant pour protéger les routes selon l'authentification et les permissions
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  redirectTo = '/login',
  requireAuth = true
}) => {
  const { isAuthenticated, user, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  // Affichage du chargement pendant la vérification d'authentification
  if (loading) {
    return <PageLoading message="Vérification des permissions..." />;
  }

  // Redirection si changement de mot de passe requis
  if (isAuthenticated && mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace state={{ from: location }} />;
  }

  // Vérification de l'authentification
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Vérification des rôles si spécifiés
  if (allowedRoles.length > 0 && user) {
    const hasPermission = allowedRoles.includes(user.role);
    
    if (!hasPermission) {
      // Redirection vers la page appropriée selon le rôle
      const defaultRedirect = user.role === 'VENDEUR' ? '/vendeur' : '/admin';
      return <Navigate to={defaultRedirect} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Composant spécialisé pour les routes admin
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Composant spécialisé pour les routes vendeur
 */
export const VendeurRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['VENDEUR']}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Composant spécialisé pour les routes super admin uniquement
 */
export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Composant pour les routes publiques (redirection si déjà connecté)
 */
export const PublicRoute: React.FC<{ 
  children: React.ReactNode; 
  redirectTo?: string;
}> = ({ children, redirectTo }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <PageLoading message="Chargement..." />;
  }

  if (isAuthenticated && user) {
    // Redirection vers la page appropriée selon le rôle
    const defaultRedirect = redirectTo || (user.role === 'VENDEUR' ? '/vendeur' : '/admin');
    return <Navigate to={defaultRedirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
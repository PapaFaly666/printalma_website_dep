import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  AuthState, 
  LoginRequest, 
  ChangePasswordRequest, 
  CreateClientRequest,
  ApiError 
} from '../types/auth.types';
import authService from '../services/auth.service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; mustChangePassword?: boolean; userId?: number; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<{ success: boolean; error?: string }>;
  forceChangePassword: (userId: number, currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  createClient: (clientData: CreateClientRequest) => Promise<{ success: boolean; error?: string; user?: User }>;
  refreshUser: () => Promise<void>;
  handlePasswordChanged: () => Promise<void>;
  checkAuth: () => Promise<void>;
  tempUserId: number | null;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isVendeur: () => boolean;
  hasPermission: (requiredRoles: string[]) => boolean;
  clearError: () => void;
  getVendorTypeLabel: () => string;
  getVendorTypeIcon: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    mustChangePassword: false,
    loading: true,
    error: null
  });

  // État pour savoir si c'est la première vérification
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // 🆕 NOUVEAU - État pour l'ID temporaire de l'utilisateur qui doit changer son mot de passe
  const [tempUserId, setTempUserId] = useState<number | null>(null);

  // Vérification de l'authentification au chargement de l'application
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Les vérifications périodiques sont maintenant gérées par useAuthPersistence

  const checkAuthStatus = async () => {
    try {
      // Ne montrer le loading que lors de la première vérification
      if (isInitialCheck) {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));
      } else {
        setAuthState(prev => ({ ...prev, error: null }));
      }
      
      // 1️⃣ Tentative principale : récupérer directement le profil complet (inclut profile_photo_url)
      try {
        const profile = await authService.getProfile();
        if (profile) {
          setAuthState({
            isAuthenticated: true,
            user: profile,
            mustChangePassword: profile.must_change_password || false,
            loading: false,
            error: null
          });
          setIsInitialCheck(false);
          return; // ✅ on a terminé
        }
      } catch (err: any) {
        // Si c'est une erreur 401, c'est normal (non connecté)
        if (err?.statusCode !== 401) {
          console.warn('Erreur lors de la récupération du profil:', err);
        }
      }

      // 2️⃣ Fallback : ancien endpoint /auth/check
      try {
        const response = await authService.checkAuth();
        if (response.isAuthenticated && response.user) {
          let userWithPhoto = response.user;

          // 🆕 Si l'utilisateur est vendeur et qu'il manque l'URL photo, tentons de la récupérer via le profil étendu
          if (
            userWithPhoto.role === 'VENDEUR' &&
            !userWithPhoto.profile_photo_url
          ) {
            try {
              const extended = await authService.getExtendedVendorProfile();
              if (extended.success && extended.vendor.profile_photo_url) {
                userWithPhoto = {
                  ...userWithPhoto,
                  profile_photo_url: extended.vendor.profile_photo_url
                } as User;
              }
            } catch (err) {
              console.warn('Impossible de récupérer la photo de profil étendue:', err);
            }
          }

          setAuthState({
            isAuthenticated: true,
            user: userWithPhoto,
            mustChangePassword: response.user.must_change_password || false,
            loading: false,
            error: null
          });
          setIsInitialCheck(false);
          return;
        }
      } catch (err: any) {
        // Si c'est une erreur 401, c'est normal (non connecté)
        if (err?.statusCode !== 401) {
          console.warn('Erreur lors de la vérification d\'authentification:', err);
        }
      }

      // Si on arrive ici, l'utilisateur n'est pas connecté
      setAuthState({
        isAuthenticated: false,
        user: null,
        mustChangePassword: false,
        loading: false,
        error: null
      });
      setIsInitialCheck(false);
    } catch (error) {
      console.warn('Erreur générale lors de la vérification d\'authentification:', error);
      // Silencieux - utilisateur simplement non connecté
      setAuthState({
        isAuthenticated: false,
        user: null,
        mustChangePassword: false,
        loading: false,
        error: null
      });
      setIsInitialCheck(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authService.login(credentials);
      
      // Vérifier si c'est une réponse de changement de mot de passe obligatoire
      if ('mustChangePassword' in response && response.mustChangePassword) {
        setAuthState(prev => ({
          ...prev,
          mustChangePassword: true,
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null
        }));
        
        // 🆕 NOUVEAU - Stocker l'ID temporaire
        setTempUserId(response.userId || null);
        
        return {
          success: false,
          mustChangePassword: true,
          userId: response.userId
        };
      }
      
      // Connexion réussie
      if ('user' in response) {
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          mustChangePassword: response.user.must_change_password || false,
          loading: false,
          error: null
        });
        
        // Réinitialiser le tempUserId
        setTempUserId(null);
        
        return { success: true };
      }
      
      throw new Error('Réponse de connexion inattendue');
      
    } catch (error: any) {
      // 🆕 AMÉLIORATION - Gestion spécifique des erreurs d'API
      let errorMessage = 'Erreur de connexion';
      
      // Vérifier si c'est une erreur d'API avec un message spécifique
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        // 🔍 Débogage pour voir ce qui est reçu
        console.log('🔍 Erreur de login détaillée:', {
          error,
          message: error.message,
          statusCode: error.statusCode,
          type: typeof error
        });
      }
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // 1. Appeler le backend pour supprimer les cookies HTTP côté serveur
      await authService.logout();
      
      // 2. Réinitialiser l'état local
      setAuthState({
        isAuthenticated: false,
        user: null,
        mustChangePassword: false,
        loading: false,
        error: null
      });
      
      // 3. Nettoyer les données temporaires
      setTempUserId(null);
      setIsInitialCheck(true); // Réinitialiser pour la prochaine connexion
      
      // 4. Attendre un peu pour que les cookies soient supprimés
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      // Même en cas d'erreur, on déconnecte l'utilisateur localement
      setAuthState({
        isAuthenticated: false,
        user: null,
        mustChangePassword: false,
        loading: false,
        error: null
      });
      
      setTempUserId(null);
      setIsInitialCheck(true); // Réinitialiser pour la prochaine connexion
    }
    
    // 5. Redirection différée pour éviter les problèmes de timing
    setTimeout(() => {
      window.location.href = '/login';
    }, 200);
  };

  const changePassword = async (passwordData: ChangePasswordRequest) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      await authService.changePassword(passwordData);
      
      // Actualiser les informations utilisateur après changement de mot de passe
      await refreshUser();
      
      setAuthState(prev => ({
        ...prev,
        mustChangePassword: false,
        loading: false,
        error: null
      }));
      
      return { success: true };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const forceChangePassword = async (userId: number, currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      await authService.forceChangePassword(userId, currentPassword, newPassword, confirmPassword);
      
      setAuthState(prev => ({
        ...prev,
        mustChangePassword: false,
        loading: false,
        error: null
      }));
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const createClient = async (clientData: CreateClientRequest) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authService.createClient(clientData);
      
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      
      return { 
        success: true, 
        user: response.user 
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du client';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authService.getProfile();
      setAuthState(prev => ({
        ...prev,
        user,
        mustChangePassword: user.must_change_password || false
      }));
    } catch (error) {
      console.error('Erreur lors de l\'actualisation du profil utilisateur:', error);
    }
  };

  const handlePasswordChanged = async () => {
    try {
      // Réinitialiser les états liés au changement obligatoire
      setAuthState(prev => ({
        ...prev,
        mustChangePassword: false,
        loading: false,
        error: null
      }));
      setTempUserId(null);
      
      // Vérifier l'authentification pour récupérer les données utilisateur
      await checkAuthStatus();
    } catch (error) {
      console.error('Erreur lors de la vérification post-changement de mot de passe:', error);
    }
  };

  const checkAuth = async () => {
    try {
      await checkAuthStatus();
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
    }
  };

  // Méthodes de vérification des permissions
  const isAdmin = () => authService.isAdmin(authState.user);
  const isSuperAdmin = () => authService.isSuperAdmin(authState.user);
  const isVendeur = () => authService.isVendeur(authState.user);
  const hasPermission = (requiredRoles: string[]) => authService.hasPermission(authState.user, requiredRoles);

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    changePassword,
    forceChangePassword,
    createClient,
    refreshUser,
    handlePasswordChanged,
    checkAuth,
    tempUserId,
    isAdmin,
    isSuperAdmin,
    isVendeur,
    hasPermission,
    clearError,
    getVendorTypeLabel: () => authService.getVendorTypeLabel(authState.user),
    getVendorTypeIcon: () => authService.getVendorTypeIcon(authState.user)
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};

// Hook pour vérifier si l'utilisateur a les permissions requises
export const usePermissions = (requiredRoles: string[]) => {
  const { user, hasPermission } = useAuth();
  return hasPermission(requiredRoles);
};

// Hook pour obtenir les métadonnées du type de vendeur
export const useVendeurType = () => {
  const { user } = useAuth();
  return user?.vendeur_type || null;
};

export default AuthContext; 
// Configuration de l'API PrintAlma
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

// Configuration des cookies basée sur l'environnement
export const COOKIE_CONFIG = {
  sameSite: (import.meta.env.VITE_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none',
  secure: import.meta.env.VITE_SECURE_COOKIES === 'true' || import.meta.env.VITE_ENVIRONMENT === 'production',
  httpOnly: true
};

// Endpoints de l'API
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CHECK: '/auth/check',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    // 🆕 NOUVEAU - Endpoint pour changement de mot de passe forcé
    FORCE_CHANGE_PASSWORD: '/auth/force-change-password',
    // Nouveaux endpoints vendeurs
    VENDORS: '/auth/vendors',
    VENDORS_STATS: '/auth/vendors/stats',
    REGISTER_VENDOR: '/auth/register-vendeur',
    // Nouveaux endpoints réinitialisation mot de passe
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_TOKEN: '/auth/verify-reset-token',
    RESET_PASSWORD: '/auth/reset-password',
    // 🆕 NOUVEAUX ENDPOINTS PROFIL VENDEUR ÉTENDU
    VENDOR_PROFILE: '/auth/vendor/profile',
    UPDATE_VENDOR_PROFILE: '/auth/vendor/profile',
    // 🆕 NOUVEAU ENDPOINT VÉRIFICATION NOM BOUTIQUE
    CHECK_SHOP_NAME: '/auth/check-shop-name'
    ,
    // 🆕 Désactivation / Réactivation compte vendeur
    VENDOR_DEACTIVATE: '/auth/vendor/deactivate',
    VENDOR_REACTIVATE: '/auth/vendor/reactivate'
  },
  ADMIN: {
    CREATE_CLIENT: '/auth/admin/create-client',
    // 🆕 NOUVEAU ENDPOINT CREATION VENDEUR ÉTENDU
    CREATE_VENDOR_EXTENDED: '/auth/admin/create-vendor-extended',
    LIST_CLIENTS: '/auth/admin/clients',
    CLIENT_STATS: '/auth/admin/clients/stats',
    TOGGLE_CLIENT_STATUS: (id: number) => `/auth/admin/clients/${id}/toggle-status`,
    RESET_VENDOR_PASSWORD: '/auth/admin/reset-vendor-password',
    UNLOCK_CLIENT: (id: number) => `/auth/admin/clients/${id}/unlock`,
    // Nouveau endpoint admin pour nettoyage tokens
    CLEANUP_RESET_TOKENS: '/auth/admin/cleanup-reset-tokens',
    // 🆕 NOUVEAUX ENDPOINTS STATISTIQUES ÉTENDUES
    VENDORS_STATS_BY_COUNTRY: '/auth/admin/vendors/stats-by-country',
    // 🆕 ENDPOINTS COMMISSION VENDEURS
    VENDOR_COMMISSION: (id: number) => `/admin/vendors/${id}/commission`,
    VENDORS_COMMISSIONS: '/admin/vendors/commissions',
    COMMISSION_STATS: '/admin/commission-stats',
    VENDOR_COMMISSION_HISTORY: (id: number) => `/admin/vendors/${id}/commission/history`
  },
  VENDOR: {
    // 🆕 ENDPOINT POUR QUE LE VENDEUR VOIT SA PROPRE COMMISSION
    MY_COMMISSION: '/vendors/my-commission',
    // 🆕 STATS COMPTE VENDEUR (dates membre depuis / dernière connexion)
    STATS: '/vendor/stats'
  }
};

// Messages d'erreur par défaut
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  UNAUTHORIZED: 'Session expirée, veuillez vous reconnecter',
  FORBIDDEN: 'Accès refusé - permissions insuffisantes',
  NOT_FOUND: 'Ressource non trouvée',
  CONFLICT: 'Conflit de données (ex: email déjà existant)',
  VALIDATION_ERROR: 'Données invalides',
  SERVER_ERROR: 'Erreur interne du serveur',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
  // 🆕 NOUVEAUX MESSAGES POUR UPLOAD PHOTOS
  INVALID_FILE_TYPE: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP',
  FILE_TOO_LARGE: 'Fichier trop volumineux. Taille maximale : 5MB',
  UPLOAD_FAILED: 'Échec de l\'upload de la photo'
};

// Configuration de pagination par défaut
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_PAGE_SIZE: 100
};

// 🆕 CONFIGURATION UPLOAD PHOTOS
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  PROFILE_PHOTO_DIMENSIONS: {
    width: 400,
    height: 400
  }
}; 
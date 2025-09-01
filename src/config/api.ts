// Configuration de l'API PrintAlma
export const API_CONFIG = {
  BASE_URL: 'https://printalma-back-dep.onrender.com',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

// Configuration des cookies
export const COOKIE_CONFIG = {
  sameSite: 'strict' as const,
  secure: false, // true en production
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
    VENDORS_STATS_BY_COUNTRY: '/auth/admin/vendors/stats-by-country'
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
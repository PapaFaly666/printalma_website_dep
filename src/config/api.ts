// Configuration de l'API PrintAlma
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3004',
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
    VENDOR_COMMISSION: (id: number) => `/api/admin/vendors/${id}/commission`,
    VENDORS_COMMISSIONS: '/api/admin/vendors/commissions',
    COMMISSION_STATS: '/api/admin/commission-stats',
    VENDOR_COMMISSION_HISTORY: (id: number) => `/api/admin/vendors/${id}/commission/history`
  },
  VENDOR: {
    // 🆕 ENDPOINT POUR QUE LE VENDEUR VOIT SA PROPRE COMMISSION
    MY_COMMISSION: '/vendors/my-commission',
    // 🆕 STATS COMPTE VENDEUR (dates membre depuis / dernière connexion)
    STATS: '/vendor/stats'
  },
  PAYDUNYA: {
    // Endpoint pour initialiser un paiement PayDunya
    INITIALIZE_PAYMENT: '/paydunya/payment',
    // Endpoint pour vérifier le statut d'un paiement
    CHECK_STATUS: (token: string) => `/paydunya/status/${token}`,
    // Endpoint pour tester la configuration PayDunya
    TEST_CONFIG: '/paydunya/test-config',
    // Endpoint callback (utilisé par PayDunya, pas par le frontend)
    CALLBACK: '/paydunya/callback',
    // Endpoint pour demander un remboursement (admin)
    REFUND: '/paydunya/refund'
  },
  ORDERS: {
    // Créer une commande (utilisateur authentifié)
    CREATE: '/orders',
    // Créer une commande guest (utilisateur non authentifié)
    CREATE_GUEST: '/orders/guest',
    // Récupérer mes commandes
    MY_ORDERS: '/orders/my-orders',
    // Récupérer une commande spécifique
    GET_ORDER: (orderId: number | string) => `/orders/${orderId}`,
    // Mettre à jour le statut d'une commande (admin)
    UPDATE_STATUS: (orderId: number) => `/orders/${orderId}/status`,
    // Annuler une commande
    CANCEL_ORDER: (orderId: number) => `/orders/${orderId}/cancel`,
    // Toutes les commandes (admin)
    ALL_ORDERS: '/orders/admin/all'
  },
  CUSTOMIZATIONS: {
    // Sauvegarder une personnalisation
    CREATE: '/customizations',
    // Récupérer une personnalisation par ID
    GET: (id: number) => `/customizations/${id}`,
    // Mettre à jour une personnalisation
    UPDATE: (id: number) => `/customizations/${id}`,
    // Supprimer une personnalisation
    DELETE: (id: number) => `/customizations/${id}`,
    // Récupérer mes personnalisations (utilisateur connecté)
    MY_CUSTOMIZATIONS: '/customizations/user/me',
    // Récupérer les personnalisations d'une session (guest)
    SESSION: (sessionId: string) => `/customizations/session/${sessionId}`,
    // Rechercher des personnalisations
    SEARCH: '/customizations/search',
    // Récupérer le draft d'un produit
    PRODUCT_DRAFT: (productId: number) => `/customizations/product/${productId}/draft`,
    // Upload d'image
    UPLOAD_IMAGE: '/customizations/upload-image',
    // Upload de prévisualisation (base64)
    UPLOAD_PREVIEW: '/customizations/upload-preview',
    // Migrer les personnalisations guest vers utilisateur
    MIGRATE: '/customizations/migrate'
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
  INVALID_FILE_TYPE: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF, WebP ou SVG',
  FILE_TOO_LARGE: 'Fichier trop volumineux. Taille maximale : 20MB',
  UPLOAD_FAILED: 'Échec de l\'upload de la photo'
};

// Messages d'erreur spécifiques pour les designers
export const DESIGNER_ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF, WebP ou SVG',
  FILE_TOO_LARGE: 'Fichier trop volumineux. Taille maximale pour l\'avatar de designer : 10MB',
  UPLOAD_FAILED: 'Échec de l\'upload de l\'avatar du designer'
};

// Configuration de pagination par défaut
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_PAGE_SIZE: 100
};

// 🆕 CONFIGURATION UPLOAD PHOTOS
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  PROFILE_PHOTO_DIMENSIONS: {
    width: 400,
    height: 400
  }
};

// 🆕 CONFIGURATION SPÉCIFIQUE POUR LES DESIGNERS
export const DESIGNER_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB pour les avatars de designers
  ALLOWED_IMAGE_TYPES: UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES, // Mêmes formats que la config générale
  PROFILE_PHOTO_DIMENSIONS: UPLOAD_CONFIG.PROFILE_PHOTO_DIMENSIONS
}; 
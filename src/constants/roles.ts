/**
 * Constantes pour les rôles et permissions
 * Centralisé pour faciliter la maintenance
 */

import { SystemRole } from '../types/roles';

// ===========================
// RÔLES SYSTÈME
// ===========================

export const ROLES = {
  SUPERADMIN: SystemRole.SUPERADMIN,
  ADMIN: SystemRole.ADMIN,
  MODERATEUR: SystemRole.MODERATEUR,
  SUPPORT: SystemRole.SUPPORT,
  COMPTABLE: SystemRole.COMPTABLE,
  VENDEUR: SystemRole.VENDEUR,
} as const;

// Groupes de rôles pour faciliter les vérifications
export const ROLE_GROUPS = {
  ADMIN_ROLES: [ROLES.SUPERADMIN, ROLES.ADMIN] as SystemRole[],
  STAFF_ROLES: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATEUR, ROLES.SUPPORT, ROLES.COMPTABLE] as SystemRole[],
  ALL_ROLES: Object.values(ROLES) as SystemRole[],
} as const;

// ===========================
// PERMISSIONS MODULES
// ===========================

export const PERMISSION_MODULES = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  USERS: 'users',
  VENDORS: 'vendors',
  DESIGNS: 'designs',
  CATEGORIES: 'categories',
  PAYMENTS: 'payments',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  CONTENT: 'content',
} as const;

// ===========================
// PERMISSIONS KEYS
// ===========================

export const PERMISSIONS = {
  // Produits
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_PUBLISH: 'products.publish',
  PRODUCTS_VALIDATE: 'products.validate',

  // Commandes
  ORDERS_VIEW: 'orders.view',
  ORDERS_VIEW_ALL: 'orders.view_all',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_MANAGE_STATUS: 'orders.manage_status',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',

  // Utilisateurs
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',

  // Vendeurs
  VENDORS_VIEW: 'vendors.view',
  VENDORS_APPROVE: 'vendors.approve',
  VENDORS_EDIT: 'vendors.edit',
  VENDORS_SUSPEND: 'vendors.suspend',

  // Designs
  DESIGNS_VIEW: 'designs.view',
  DESIGNS_VALIDATE: 'designs.validate',
  DESIGNS_REJECT: 'designs.reject',

  // Catégories
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_MANAGE: 'categories.manage',

  // Paiements
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_MANAGE: 'payments.manage',
  PAYMENTS_REFUND: 'payments.refund',

  // Paramètres
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',

  // Analytiques
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Contenu
  CONTENT_VIEW: 'content.view',
  CONTENT_EDIT: 'content.edit',
} as const;

// ===========================
// MAPPAGES RÔLES → PERMISSIONS PAR DÉFAUT
// ===========================

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  [ROLES.SUPERADMIN]: [
    // Accès complet à tout
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.ADMIN]: [
    // Produits
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_PUBLISH,
    PERMISSIONS.PRODUCTS_VALIDATE,
    // Commandes
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_MANAGE_STATUS,
    PERMISSIONS.ORDERS_CANCEL,
    // Utilisateurs
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    // Vendeurs
    PERMISSIONS.VENDORS_VIEW,
    PERMISSIONS.VENDORS_APPROVE,
    PERMISSIONS.VENDORS_EDIT,
    // Designs
    PERMISSIONS.DESIGNS_VIEW,
    PERMISSIONS.DESIGNS_VALIDATE,
    PERMISSIONS.DESIGNS_REJECT,
    // Catégories
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_MANAGE,
    // Analytiques
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    // Contenu
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_EDIT,
  ],

  [ROLES.MODERATEUR]: [
    // Produits
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_VALIDATE,
    // Commandes
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_VIEW_ALL,
    // Designs
    PERMISSIONS.DESIGNS_VIEW,
    PERMISSIONS.DESIGNS_VALIDATE,
    PERMISSIONS.DESIGNS_REJECT,
    // Contenu
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_EDIT,
  ],

  [ROLES.SUPPORT]: [
    // Commandes
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_MANAGE_STATUS,
    // Utilisateurs (lecture seule)
    PERMISSIONS.USERS_VIEW,
    // Vendeurs
    PERMISSIONS.VENDORS_VIEW,
  ],

  [ROLES.COMPTABLE]: [
    // Paiements
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_MANAGE,
    // Commandes (lecture seule)
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_VIEW_ALL,
    // Analytiques
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],

  [ROLES.VENDEUR]: [
    // Produits (propres produits uniquement)
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    // Commandes (propres commandes uniquement)
    PERMISSIONS.ORDERS_VIEW,
    // Designs (propres designs uniquement)
    PERMISSIONS.DESIGNS_VIEW,
  ],
};

// ===========================
// ROUTES ACCESSIBLES PAR RÔLE
// ===========================

export const ROLE_ROUTES: Record<SystemRole, string[]> = {
  [ROLES.SUPERADMIN]: [
    '/admin/*',
    '/vendeur/*',  // Pour tests
  ],

  [ROLES.ADMIN]: [
    '/admin/dashboard',
    '/admin/products',
    '/admin/orders',
    '/admin/users',
    '/admin/vendors',
    '/admin/categories',
    '/admin/analytics',
    '/admin/design-validation',
    '/admin/product-validation',
    '/admin/settings',
    '/admin/content-management',
    '/admin/themes',
    '/admin/stock',
    '/admin/delivery',
    '/admin/payment-methods',
    '/admin/payment-requests',
  ],

  [ROLES.MODERATEUR]: [
    '/admin/dashboard',
    '/admin/product-validation',
    '/admin/design-validation',
    '/admin/content-management',
  ],

  [ROLES.SUPPORT]: [
    '/admin/dashboard',
    '/admin/orders',
    '/admin/users',
  ],

  [ROLES.COMPTABLE]: [
    '/admin/dashboard',
    '/admin/orders',
    '/admin/payment-requests',
    '/admin/analytics',
  ],

  [ROLES.VENDEUR]: [
    '/vendeur/dashboard',
    '/vendeur/products',
    '/vendeur/designs',
    '/vendeur/sales',
    '/vendeur/account',
    '/vendeur/galleries',
    '/vendeur/stickers',
    '/vendeur/posters',
  ],
};

// ===========================
// LABELS D'AFFICHAGE
// ===========================

export const ROLE_LABELS: Record<SystemRole, string> = {
  [ROLES.SUPERADMIN]: 'Super Administrateur',
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.MODERATEUR]: 'Modérateur',
  [ROLES.SUPPORT]: 'Support Client',
  [ROLES.COMPTABLE]: 'Comptable',
  [ROLES.VENDEUR]: 'Vendeur',
};

// ===========================
// COULEURS D'AFFICHAGE (pour badges)
// ===========================

export const ROLE_COLORS: Record<SystemRole, { bg: string; text: string }> = {
  [ROLES.SUPERADMIN]: { bg: 'bg-purple-100', text: 'text-purple-800' },
  [ROLES.ADMIN]: { bg: 'bg-blue-100', text: 'text-blue-800' },
  [ROLES.MODERATEUR]: { bg: 'bg-green-100', text: 'text-green-800' },
  [ROLES.SUPPORT]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  [ROLES.COMPTABLE]: { bg: 'bg-orange-100', text: 'text-orange-800' },
  [ROLES.VENDEUR]: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
};

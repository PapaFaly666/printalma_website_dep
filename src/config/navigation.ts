import {
  BarChart3,
  Package,
  Tag,
  Palette,
  PackageSearch,
  Users,
  Trash2,
  CheckCircle,
  ShoppingBag,
  Truck,
  User,
  Shield,
  Image,
  CreditCard,
  Landmark,
  Settings,
  Home,
  LogOut,
  Camera,
  Store,
  Wallet,
  FileText,
  Banknote,
  Sticker,
} from 'lucide-react';
import { NavigationConfig } from '../types/navigation';

/**
 * Configuration centralisée de la navigation
 *
 * Cette configuration définit tous les menus de l'application de manière déclarative.
 * Chaque élément peut avoir des permissions qui contrôlent sa visibilité.
 */
export const navigationConfig: NavigationConfig = {
  // ========================================
  // NAVIGATION ADMIN
  // ========================================
  admin: [
    // Groupe: Produits
    {
      id: 'products-group',
      title: 'Produits',
      permissions: [
        'products.mockups.view',
        'products.categories.view',
        'products.themes.view',
        'products.stock.view',
        'users.vendors.view',
        'trash.view',
      ],
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: BarChart3,
          path: 'dashboard',
        },
        {
          id: 'products',
          label: 'Mockups',
          icon: Package,
          path: 'products',
          permission: 'products.mockups.view',
          countKey: 'mockupsCount',
        },
        {
          id: 'categories',
          label: 'Catégories',
          icon: Tag,
          path: 'categories',
          permission: 'products.categories.view',
        },
        {
          id: 'design-categories',
          label: 'Thèmes',
          icon: Palette,
          path: 'design-categories',
          permission: 'products.themes.view',
        },
        {
          id: 'stock',
          label: 'Stock',
          icon: PackageSearch,
          path: 'stock',
          permission: 'products.stock.view',
        },
        {
          id: 'clients',
          label: 'Vendeurs',
          icon: Users,
          path: 'clients',
          permission: 'users.vendors.view',
        },
        {
          id: 'trash',
          label: 'Corbeille',
          icon: Trash2,
          path: 'trash',
          permission: 'trash.view',
        },
      ],
    },

    // Groupe: Validation
    {
      id: 'validation-group',
      title: 'Validation',
      permissions: ['validation.designs.view', 'validation.auto.view'],
      items: [
        {
          id: 'design-validation',
          label: 'Design',
          icon: CheckCircle,
          path: 'design-validation',
          permission: 'validation.designs.view',
          badgeColor: 'yellow',
          countKey: 'designValidationCount',
        },
        {
          id: 'auto-validation',
          label: 'Auto-validation',
          icon: CheckCircle, // Vous pouvez utiliser un emoji ici si préféré
          path: 'auto-validation',
          permission: 'validation.auto.view',
        },
      ],
    },

    // Groupe: Commandes
    {
      id: 'orders-group',
      title: 'Commandes',
      permissions: ['orders.view', 'orders.delivery.view'],
      items: [
        {
          id: 'orders',
          label: 'Gestion des commandes',
          icon: ShoppingBag,
          path: 'orders',
          permission: 'orders.view',
        },
        {
          id: 'livraison',
          label: 'Livraison',
          icon: Truck,
          path: 'livraison',
          permission: 'orders.delivery.view',
        },
      ],
    },

    // Groupe: Utilisateurs
    {
      id: 'users-group',
      title: 'Utilisateurs',
      permissions: ['users.admins.view', 'users.admins.roles'],
      items: [
        {
          id: 'users',
          label: 'Gestion des utilisateurs',
          icon: Users,
          path: 'users',
          permission: 'users.admins.view',
        },
        {
          id: 'roles',
          label: 'Rôles & Permissions',
          icon: Shield,
          path: 'roles',
          permission: 'users.admins.roles',
        },
      ],
    },

    // Groupe: Contenu
    {
      id: 'content-group',
      title: 'Contenu',
      permission: 'content.view',
      items: [
        {
          id: 'content-init',
          label: 'Gestion du contenu',
          icon: Image,
          path: 'content-init',
          permission: 'content.view',
        },
      ],
    },

    // Groupe: Statistiques
    {
      id: 'statistics-group',
      title: 'Statistiques',
      permission: 'statistics.analytics',
      items: [
        {
          id: 'analytics',
          label: 'Analytiques',
          icon: BarChart3,
          path: 'analytics',
          permission: 'statistics.analytics',
        },
      ],
    },

    // Groupe: Paiements
    {
      id: 'payments-group',
      title: 'Paiements',
      permissions: ['payments.requests.view', 'payments.methods.view'],
      items: [
        {
          id: 'payment-requests',
          label: 'Demandes',
          icon: CreditCard,
          path: 'payment-requests',
          permission: 'payments.requests.view',
          badgeColor: 'red',
          countKey: 'paymentRequestsCount',
        },
        {
          id: 'payment-methods',
          label: 'Moyens de paiement',
          icon: Landmark,
          path: 'payment-methods',
          permission: 'payments.methods.view',
        },
      ],
    },
  ],

  // ========================================
  // NAVIGATION VENDEUR
  // ========================================
  vendor: [
    // Groupe: Vue d'ensemble
    {
      id: 'vendor-overview',
      title: "Vue d'ensemble",
      roles: ['VENDEUR'],
      items: [
        {
          id: 'vendor-dashboard',
          label: 'Tableau de bord',
          icon: BarChart3,
          path: 'dashboard',
        },
        {
          id: 'vendor-analytics',
          label: 'Analytiques',
          icon: BarChart3,
          path: 'analytics',
        },
      ],
    },

    // Groupe: Mes Produits
    {
      id: 'vendor-products',
      title: 'Mes Produits',
      roles: ['VENDEUR'],
      items: [
        {
          id: 'vendor-products',
          label: 'Mes Produits',
          icon: Package,
          path: 'products',
        },
        {
          id: 'vendor-sell-design',
          label: 'Créer Design',
          icon: Palette,
          path: 'vendor-sell-design',
        },
        {
          id: 'vendor-stickers',
          label: 'Vendre Stickers',
          icon: Sticker,
          path: 'stickers',
          badge: 'NOUVEAU',
          badgeColor: 'blue',
        },
      ],
    },

    // Groupe: Commandes
    {
      id: 'vendor-orders',
      title: 'Commandes',
      roles: ['VENDEUR'],
      items: [
        {
          id: 'vendor-orders',
          label: 'Mes Commandes',
          icon: ShoppingBag,
          path: 'orders',
        },
      ],
    },

    // Groupe: Profil & Boutique
    {
      id: 'vendor-profile',
      title: 'Profil & Boutique',
      roles: ['VENDEUR'],
      items: [
        {
          id: 'vendor-profile',
          label: 'Mon Profil',
          icon: User,
          path: 'profile',
        },
        {
          id: 'vendor-photo',
          label: 'Photo de Profil',
          icon: Camera,
          path: 'photo-profile',
        },
        {
          id: 'vendor-shop',
          label: 'Ma Boutique',
          icon: Store,
          path: 'shop-settings',
        },
      ],
    },

    // Groupe: Finances
    {
      id: 'vendor-finances',
      title: 'Finances',
      roles: ['VENDEUR'],
      items: [
        {
          id: 'vendor-earnings',
          label: 'Mes Gains',
          icon: Wallet,
          path: 'earnings',
        },
        {
          id: 'vendor-payment-requests',
          label: 'Demandes de Paiement',
          icon: FileText,
          path: 'payment-requests',
        },
        {
          id: 'vendor-appel-de-fonds',
          label: 'Appel de Fonds',
          icon: Banknote,
          path: 'appel-de-fonds',
        },
      ],
    },
  ],

  // ========================================
  // FOOTER (commun à tous)
  // ========================================
  footer: [
    {
      id: 'home',
      label: 'Retour au site',
      icon: Home,
      path: '/',
      textColor: 'text-[#049be5]',
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      path: 'settings',
      permission: 'settings.view',
    },
    {
      id: 'logout',
      label: 'Déconnexion',
      icon: LogOut,
      path: '#logout',
      textColor: 'text-gray-500',
    },
  ],
};

/**
 * Fonction helper pour obtenir la navigation en fonction du rôle
 */
export const getNavigationForRole = (role: 'ADMIN' | 'SUPERADMIN' | 'VENDEUR'): typeof navigationConfig.admin | typeof navigationConfig.vendor => {
  if (role === 'VENDEUR') {
    return navigationConfig.vendor;
  }
  return navigationConfig.admin;
};

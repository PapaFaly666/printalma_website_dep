/**
 * Helpers pour la gestion des rôles et permissions
 * Fonctions utilitaires centralisées et réutilisables
 */

import { SystemRole, UserWithRole, Permission } from '../types/roles';
import { ROLES, ROLE_GROUPS, DEFAULT_ROLE_PERMISSIONS, ROLE_ROUTES } from '../constants/roles';

// ===========================
// VÉRIFICATION DES RÔLES
// ===========================

/**
 * Normalise un rôle pour comparaison
 * Gère les variantes (SUPER_ADMIN, SUPERADMIN, etc.)
 */
export function normalizeRole(role?: string | null): SystemRole | null {
  if (!role) return null;

  const normalized = role.toString().toUpperCase().replace(/_/g, '');

  // Mappages des variantes
  const roleMap: Record<string, SystemRole> = {
    'SUPERADMIN': ROLES.SUPERADMIN,
    'SUPER': ROLES.SUPERADMIN,
    'ADMIN': ROLES.ADMIN,
    'MODERATEUR': ROLES.MODERATEUR,
    'MODERATOR': ROLES.MODERATEUR,
    'SUPPORT': ROLES.SUPPORT,
    'COMPTABLE': ROLES.COMPTABLE,
    'ACCOUNTANT': ROLES.COMPTABLE,
    'VENDEUR': ROLES.VENDEUR,
    'VENDOR': ROLES.VENDEUR,
    'SELLER': ROLES.VENDEUR,
  };

  return roleMap[normalized] || null;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(user: UserWithRole | null | undefined, role: SystemRole): boolean {
  if (!user) return false;

  const userRole = normalizeRole(user.role);
  return userRole === role;
}

/**
 * Vérifie si l'utilisateur a un des rôles spécifiés
 */
export function hasAnyRole(user: UserWithRole | null | undefined, roles: SystemRole[]): boolean {
  if (!user || !roles.length) return false;

  const userRole = normalizeRole(user.role);
  if (!userRole) return false;

  return roles.some(role => userRole === role);
}

/**
 * Vérifie si l'utilisateur a tous les rôles spécifiés
 */
export function hasAllRoles(user: UserWithRole | null | undefined, roles: SystemRole[]): boolean {
  if (!user || !roles.length) return false;

  const userRole = normalizeRole(user.role);
  if (!userRole) return false;

  // Un utilisateur ne peut avoir qu'un seul rôle système à la fois
  // Cette fonction est surtout utile avec les rôles personnalisés
  return roles.every(role => userRole === role);
}

/**
 * Vérifie si l'utilisateur est un administrateur (SUPERADMIN ou ADMIN)
 */
export function isAdmin(user: UserWithRole | null | undefined): boolean {
  return hasAnyRole(user, ROLE_GROUPS.ADMIN_ROLES);
}

/**
 * Vérifie si l'utilisateur est un super administrateur
 */
export function isSuperAdmin(user: UserWithRole | null | undefined): boolean {
  return hasRole(user, ROLES.SUPERADMIN);
}

/**
 * Vérifie si l'utilisateur est un vendeur
 */
export function isVendor(user: UserWithRole | null | undefined): boolean {
  return hasRole(user, ROLES.VENDEUR);
}

/**
 * Vérifie si l'utilisateur fait partie du staff (ADMIN, MODERATEUR, SUPPORT, COMPTABLE)
 */
export function isStaff(user: UserWithRole | null | undefined): boolean {
  return hasAnyRole(user, ROLE_GROUPS.STAFF_ROLES);
}

// ===========================
// VÉRIFICATION DES PERMISSIONS
// ===========================

/**
 * Obtient les permissions pour un rôle
 */
export function getRolePermissions(role: SystemRole): string[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Obtient toutes les permissions de l'utilisateur
 */
export function getUserPermissions(user: UserWithRole | null | undefined): string[] {
  if (!user) return [];

  const userRole = normalizeRole(user.role);
  if (!userRole) return [];

  // Permissions du rôle système
  const systemPermissions = getRolePermissions(userRole);

  // Permissions du rôle personnalisé (si présent)
  const customPermissions = user.customRole?.permissions?.map(p => p.key) || [];

  // Combiner et dédupliquer
  return [...new Set([...systemPermissions, ...customPermissions])];
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export function hasPermission(user: UserWithRole | null | undefined, permission: string): boolean {
  if (!user) return false;

  // Super admin a toutes les permissions
  if (isSuperAdmin(user)) return true;

  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permission);
}

/**
 * Vérifie si l'utilisateur a au moins une des permissions spécifiées
 */
export function hasAnyPermission(user: UserWithRole | null | undefined, permissions: string[]): boolean {
  if (!user || !permissions.length) return false;

  // Super admin a toutes les permissions
  if (isSuperAdmin(user)) return true;

  const userPermissions = getUserPermissions(user);
  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Vérifie si l'utilisateur a toutes les permissions spécifiées
 */
export function hasAllPermissions(user: UserWithRole | null | undefined, permissions: string[]): boolean {
  if (!user || !permissions.length) return false;

  // Super admin a toutes les permissions
  if (isSuperAdmin(user)) return true;

  const userPermissions = getUserPermissions(user);
  return permissions.every(permission => userPermissions.includes(permission));
}

// ===========================
// VÉRIFICATION D'ACCÈS AUX ROUTES
// ===========================

/**
 * Vérifie si l'utilisateur peut accéder à une route
 */
export function canAccessRoute(user: UserWithRole | null | undefined, path: string): boolean {
  if (!user) return false;

  const userRole = normalizeRole(user.role);
  if (!userRole) return false;

  // Super admin a accès à tout
  if (isSuperAdmin(user)) return true;

  const allowedRoutes = ROLE_ROUTES[userRole] || [];

  // Vérifier si la route correspond (avec support des wildcards)
  return allowedRoutes.some(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2);
      return path.startsWith(basePath);
    }
    return path === route || path.startsWith(route + '/');
  });
}

/**
 * Obtient la route par défaut pour un rôle
 */
export function getDefaultRoute(role?: SystemRole | null): string {
  if (!role) return '/';

  switch (role) {
    case ROLES.SUPERADMIN:
    case ROLES.ADMIN:
    case ROLES.MODERATEUR:
    case ROLES.SUPPORT:
    case ROLES.COMPTABLE:
      return '/admin/dashboard';
    case ROLES.VENDEUR:
      return '/vendeur/dashboard';
    default:
      return '/';
  }
}

/**
 * Obtient la route de redirection après connexion
 */
export function getLoginRedirect(user: UserWithRole | null | undefined, intendedPath?: string): string {
  if (!user) return '/';

  const userRole = normalizeRole(user.role);

  // Si une route était demandée et que l'utilisateur y a accès, y rediriger
  if (intendedPath && canAccessRoute(user, intendedPath)) {
    return intendedPath;
  }

  // Sinon, rediriger vers la route par défaut du rôle
  return getDefaultRoute(userRole);
}

// ===========================
// UTILITAIRES
// ===========================

/**
 * Obtient le label d'affichage d'un rôle
 */
export function getRoleLabel(role?: SystemRole | null): string {
  if (!role) return 'Utilisateur';

  const ROLE_LABELS: Record<SystemRole, string> = {
    [ROLES.SUPERADMIN]: 'Super Administrateur',
    [ROLES.ADMIN]: 'Administrateur',
    [ROLES.MODERATEUR]: 'Modérateur',
    [ROLES.SUPPORT]: 'Support Client',
    [ROLES.COMPTABLE]: 'Comptable',
    [ROLES.VENDEUR]: 'Vendeur',
  };

  return ROLE_LABELS[role] || role;
}

/**
 * Obtient les couleurs d'affichage d'un rôle (pour badges)
 */
export function getRoleColors(role?: SystemRole | null): { bg: string; text: string } {
  if (!role) return { bg: 'bg-gray-100', text: 'text-gray-800' };

  const ROLE_COLORS: Record<SystemRole, { bg: string; text: string }> = {
    [ROLES.SUPERADMIN]: { bg: 'bg-purple-100', text: 'text-purple-800' },
    [ROLES.ADMIN]: { bg: 'bg-blue-100', text: 'text-blue-800' },
    [ROLES.MODERATEUR]: { bg: 'bg-green-100', text: 'text-green-800' },
    [ROLES.SUPPORT]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    [ROLES.COMPTABLE]: { bg: 'bg-orange-100', text: 'text-orange-800' },
    [ROLES.VENDEUR]: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  };

  return ROLE_COLORS[role] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}

/**
 * Formate les permissions pour l'affichage
 */
export function formatPermissions(permissions: Permission[]): { module: string; permissions: Permission[] }[] {
  const grouped = permissions.reduce((acc, permission) => {
    const module = permission.module;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return Object.entries(grouped).map(([module, permissions]) => ({
    module,
    permissions,
  }));
}

/**
 * Vérifie si un utilisateur peut modifier un autre utilisateur
 */
export function canEditUser(currentUser: UserWithRole, targetUser: UserWithRole): boolean {
  // Super admin peut modifier tout le monde
  if (isSuperAdmin(currentUser)) return true;

  // Admin peut modifier tout le monde sauf les super admins
  if (isAdmin(currentUser) && !isSuperAdmin(targetUser)) return true;

  // Les utilisateurs ne peuvent modifier qu'eux-mêmes
  return currentUser.id === targetUser.id;
}

/**
 * Vérifie si un utilisateur peut supprimer un autre utilisateur
 */
export function canDeleteUser(currentUser: UserWithRole, targetUser: UserWithRole): boolean {
  // Personne ne peut se supprimer soi-même
  if (currentUser.id === targetUser.id) return false;

  // Super admin peut supprimer tout le monde
  if (isSuperAdmin(currentUser)) return true;

  // Admin peut supprimer tout le monde sauf les admins et super admins
  if (isAdmin(currentUser) && !isAdmin(targetUser)) return true;

  return false;
}

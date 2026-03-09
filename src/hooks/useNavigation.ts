import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import usePermissions from './usePermissions';
import { useSidebarCounts } from './useSidebarCounts';
import { navigationConfig, getNavigationForRole } from '../config/navigation';
import { NavGroup, NavItem } from '../types/navigation';

/**
 * Hook personnalisé pour gérer la navigation
 *
 * Ce hook filtre les éléments de navigation en fonction des permissions
 * de l'utilisateur connecté et injecte les counts dynamiques.
 */
export const useNavigation = () => {
  const { user, isAdmin, isSuperAdmin, isVendeur } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { counts, loading: countsLoading } = useSidebarCounts();

  /**
   * Vérifie si un élément de navigation doit être affiché
   */
  const shouldShowItem = (item: NavItem): boolean => {
    // Si pas de permission requise, toujours afficher
    if (!item.permission) return true;

    // SuperAdmin a accès à tout
    if (isSuperAdmin()) return true;

    // Vérifier la permission
    return hasPermission(item.permission);
  };

  /**
   * Vérifie si un groupe de navigation doit être affiché
   */
  const shouldShowGroup = (group: NavGroup): boolean => {
    // Vérifier les rôles si spécifiés
    if (group.roles && group.roles.length > 0) {
      const userRole = user?.role;
      if (!userRole || !group.roles.includes(userRole as any)) {
        return false;
      }
    }

    // SuperAdmin a accès à tout
    if (isSuperAdmin()) return true;

    // Si permission unique
    if (group.permission) {
      return hasPermission(group.permission);
    }

    // Si liste de permissions (au moins une doit être vraie)
    if (group.permissions && group.permissions.length > 0) {
      return hasAnyPermission(group.permissions);
    }

    // Sinon, vérifier si au moins un item est visible
    return group.items.some(item => shouldShowItem(item));
  };

  /**
   * Injecte le badge dynamique pour un item
   */
  const getItemBadge = (item: NavItem): string => {
    // Si badge statique
    if (typeof item.badge === 'string') {
      return item.badge;
    }

    // Si badge fonction
    if (typeof item.badge === 'function') {
      return item.badge();
    }

    // Si countKey pour badge dynamique
    if (item.countKey) {
      if (countsLoading) return '...';

      const count = counts[item.countKey];
      if (count > 0) {
        return count.toString();
      }
    }

    return '';
  };

  /**
   * Enrichit un item avec son badge dynamique
   */
  const enrichItem = (item: NavItem): NavItem => {
    return {
      ...item,
      badge: getItemBadge(item),
    };
  };

  /**
   * Filtre et enrichit les groupes de navigation
   */
  const filterAndEnrichGroups = (groups: NavGroup[]): NavGroup[] => {
    return groups
      .filter(shouldShowGroup)
      .map(group => ({
        ...group,
        items: group.items
          .filter(shouldShowItem)
          .map(enrichItem),
      }))
      .filter(group => group.items.length > 0); // Ne garder que les groupes avec au moins un item
  };

  /**
   * Navigation pour les admins
   */
  const adminNavigation = useMemo(() => {
    if (!isAdmin() && !isSuperAdmin()) return [];
    return filterAndEnrichGroups(navigationConfig.admin);
  }, [user, counts, countsLoading]);

  /**
   * Navigation pour les vendeurs
   */
  const vendorNavigation = useMemo(() => {
    if (!isVendeur()) return [];
    return filterAndEnrichGroups(navigationConfig.vendor);
  }, [user, counts, countsLoading]);

  /**
   * Navigation du footer (filtrée)
   */
  const footerNavigation = useMemo(() => {
    return navigationConfig.footer
      .filter(shouldShowItem)
      .map(enrichItem);
  }, [user, counts, countsLoading]);

  /**
   * Navigation actuelle en fonction du rôle
   */
  const currentNavigation = useMemo(() => {
    if (isVendeur()) return vendorNavigation;
    if (isAdmin() || isSuperAdmin()) return adminNavigation;
    return [];
  }, [adminNavigation, vendorNavigation, user]);

  return {
    adminNavigation,
    vendorNavigation,
    footerNavigation,
    currentNavigation,
    countsLoading,
  };
};

export default useNavigation;

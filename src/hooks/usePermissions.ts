import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import rolesService, { Permission } from '../services/rolesService';

/**
 * Hook pour gérer les permissions de l'utilisateur connecté
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setPermissions([]);
      return;
    }

    // Si l'utilisateur a un customRole avec permissions, les utiliser directement
    if (user.customRole && user.customRole.permissions) {
      const perms = user.customRole.permissions.map(p => ({
        id: p.id,
        key: p.slug, // slug est la clé de la permission
        name: p.name,
        module: p.module,
        description: p.description || undefined,
      }));
      setPermissions(perms);
      setLoading(false);
      setError(null);
    }
    // Sinon, charger depuis l'API (fallback pour compatibilité)
    else if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      loadPermissions();
    } else {
      setLoading(false);
      setPermissions([]);
    }
  }, [user]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const perms = await rolesService.getMyPermissions();
      setPermissions(perms);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement permissions:', err);
      setError(err.message || 'Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * @param permissionKey Clé de la permission (ex: "products.mockups.view")
   * @returns true si l'utilisateur a la permission
   */
  const hasPermission = (permissionKey: string): boolean => {
    // SUPERADMIN a toutes les permissions
    if (user?.role === 'SUPERADMIN') {
      return true;
    }

    return permissions.some(p => p.key === permissionKey);
  };

  /**
   * Vérifie si l'utilisateur a AU MOINS UNE des permissions listées
   * @param permissionKeys Liste de clés de permissions
   * @returns true si l'utilisateur a au moins une permission
   */
  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    // SUPERADMIN a toutes les permissions
    if (user?.role === 'SUPERADMIN') {
      return true;
    }

    return permissionKeys.some(key => hasPermission(key));
  };

  /**
   * Vérifie si l'utilisateur a TOUTES les permissions listées
   * @param permissionKeys Liste de clés de permissions
   * @returns true si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    // SUPERADMIN a toutes les permissions
    if (user?.role === 'SUPERADMIN') {
      return true;
    }

    return permissionKeys.every(key => hasPermission(key));
  };

  /**
   * Vérifie si l'utilisateur peut voir un élément
   * Utile pour afficher/cacher des éléments UI
   */
  const canView = (permissionKey: string): boolean => {
    return hasPermission(permissionKey);
  };

  /**
   * Vérifie si l'utilisateur peut modifier un élément
   */
  const canEdit = (permissionKey: string): boolean => {
    return hasPermission(permissionKey);
  };

  /**
   * Vérifie si l'utilisateur peut supprimer un élément
   */
  const canDelete = (permissionKey: string): boolean => {
    return hasPermission(permissionKey);
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canEdit,
    canDelete,
    reload: loadPermissions,
  };
};

export default usePermissions;

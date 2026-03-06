import { API_CONFIG } from '../config/api';

// Types
export interface Permission {
  id: number;
  key: string;
  name: string;
  description?: string;
  module: string;
  createdAt: string;
}

export interface CustomRole {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    permissions: number;
  };
  permissions?: {
    permission: Permission;
  }[];
  users?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }[];
}

export interface RolePermission {
  roleId: number;
  permissionId: number;
  permission: Permission;
}

export interface PermissionsGrouped {
  [module: string]: Permission[];
}

// Service de gestion des rôles et permissions
export const rolesService = {
  /**
   * Récupère toutes les permissions disponibles groupées par module
   */
  async getAllPermissions(): Promise<PermissionsGrouped> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/permissions/all`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des permissions');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Erreur getAllPermissions:', error);
      throw error;
    }
  },

  /**
   * Récupère tous les rôles personnalisés
   */
  async getAllRoles(): Promise<CustomRole[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/permissions/roles`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des rôles');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Erreur getAllRoles:', error);
      throw error;
    }
  },

  /**
   * Récupère un rôle avec ses permissions et utilisateurs
   */
  async getRoleById(roleId: number): Promise<CustomRole> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/permissions/roles/${roleId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération du rôle');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Erreur getRoleById:', error);
      throw error;
    }
  },

  /**
   * Récupère les permissions de l'utilisateur connecté
   */
  async getMyPermissions(): Promise<Permission[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/permissions/my-permissions`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des permissions');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Erreur getMyPermissions:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau rôle personnalisé
   */
  async createRole(data: {
    name: string;
    slug: string;
    description?: string;
    permissionIds?: number[];
  }): Promise<CustomRole> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/permissions/roles`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la création du rôle');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Erreur createRole:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour les permissions d'un rôle
   */
  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<CustomRole> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/permissions/roles/${roleId}/permissions`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ permissionIds }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la mise à jour des permissions');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Erreur updateRolePermissions:', error);
      throw error;
    }
  },

  /**
   * Supprimer un rôle personnalisé
   */
  async deleteRole(roleId: number): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/permissions/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la suppression du rôle');
      }
    } catch (error: any) {
      console.error('❌ Erreur deleteRole:', error);
      throw error;
    }
  },
};

export default rolesService;

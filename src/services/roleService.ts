/**
 * Service pour la gestion des rôles et permissions
 * Interface avec l'API backend
 */

import { API_BASE_URL } from '../config/api';
import {
  CustomRole,
  RolesResponse,
  RoleResponse,
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  SystemRole,
} from '../types/roles';

const API_URL = API_BASE_URL || 'http://localhost:3004';

// ===========================
// CRUD RÔLES PERSONNALISÉS
// ===========================

/**
 * Récupère tous les rôles personnalisés
 */
export async function getAllRoles(): Promise<CustomRole[]> {
  const response = await fetch(`${API_URL}/roles`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des rôles: ${response.statusText}`);
  }

  const data: RolesResponse = await response.json();
  return data.roles;
}

/**
 * Récupère un rôle par son ID
 */
export async function getRoleById(id: number): Promise<CustomRole> {
  const response = await fetch(`${API_URL}/roles/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération du rôle: ${response.statusText}`);
  }

  const data: RoleResponse = await response.json();
  return data.role;
}

/**
 * Crée un nouveau rôle personnalisé
 */
export async function createRole(roleData: CreateRoleDto): Promise<CustomRole> {
  const response = await fetch(`${API_URL}/roles`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roleData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de la création du rôle`);
  }

  const data: RoleResponse = await response.json();
  return data.role;
}

/**
 * Met à jour un rôle personnalisé
 */
export async function updateRole(roleData: UpdateRoleDto): Promise<CustomRole> {
  const { id, ...updateData } = roleData;

  const response = await fetch(`${API_URL}/roles/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de la mise à jour du rôle`);
  }

  const data: RoleResponse = await response.json();
  return data.role;
}

/**
 * Supprime un rôle personnalisé
 */
export async function deleteRole(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/roles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de la suppression du rôle`);
  }
}

// ===========================
// ASSIGNATION DE RÔLES
// ===========================

/**
 * Assigne un rôle à un utilisateur
 */
export async function assignRoleToUser(assignData: AssignRoleDto): Promise<void> {
  const response = await fetch(`${API_URL}/users/${assignData.userId}/role`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roleId: assignData.roleId,
      systemRole: assignData.systemRole,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de l'assignation du rôle`);
  }
}

/**
 * Change le rôle système d'un utilisateur
 */
export async function changeUserSystemRole(userId: number, role: SystemRole): Promise<void> {
  return assignRoleToUser({
    userId,
    systemRole: role,
  });
}

/**
 * Change le rôle personnalisé d'un utilisateur
 */
export async function changeUserCustomRole(userId: number, roleId: number): Promise<void> {
  return assignRoleToUser({
    userId,
    roleId,
  });
}

// ===========================
// PERMISSIONS
// ===========================

/**
 * Récupère toutes les permissions disponibles
 */
export async function getAllPermissions(): Promise<any[]> {
  const response = await fetch(`${API_URL}/permissions`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des permissions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.permissions || [];
}

/**
 * Assigne des permissions à un rôle
 */
export async function assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
  const response = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissionIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de l'assignation des permissions`);
  }
}

// ===========================
// EXPORT DU SERVICE
// ===========================

const roleService = {
  // CRUD
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,

  // Assignation
  assignRoleToUser,
  changeUserSystemRole,
  changeUserCustomRole,

  // Permissions
  getAllPermissions,
  assignPermissionsToRole,
  updateRolePermissions: assignPermissionsToRole, // Alias pour compatibilité
};

export default roleService;

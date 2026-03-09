/**
 * Types et interfaces pour la gestion des rôles et permissions
 */

// Rôles de base du système (enum Prisma)
export enum SystemRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MODERATEUR = 'MODERATEUR',
  SUPPORT = 'SUPPORT',
  COMPTABLE = 'COMPTABLE',
  VENDEUR = 'VENDEUR',
}

// Rôle personnalisé
export interface CustomRole {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

// Permission granulaire
export interface Permission {
  id: number;
  key: string;
  name: string;
  description?: string;
  module: string;
  createdAt: string;
}

// Association rôle-permission
export interface RolePermission {
  roleId: number;
  permissionId: number;
  createdAt: string;
}

// Utilisateur avec rôle
export interface UserWithRole {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: SystemRole;
  roleId?: number;
  customRole?: CustomRole;
  status: boolean;
  userStatus: string;
  photo_profil?: string;
  avatar?: string;
}

// Contexte de permissions pour vérification
export interface PermissionContext {
  user: UserWithRole;
  requiredPermissions?: string[];
  requiredRoles?: SystemRole[];
}

// Réponse API pour la liste des rôles
export interface RolesResponse {
  success: boolean;
  roles: CustomRole[];
  count: number;
}

// Réponse API pour un rôle
export interface RoleResponse {
  success: boolean;
  role: CustomRole;
}

// DTO pour créer/mettre à jour un rôle
export interface CreateRoleDto {
  name: string;
  slug: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {
  id: number;
}

// DTO pour assigner un rôle à un utilisateur
export interface AssignRoleDto {
  userId: number;
  roleId?: number;  // Pour rôle personnalisé
  systemRole?: SystemRole;  // Pour rôle système
}

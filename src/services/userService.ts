/**
 * Service centralisé pour la gestion des utilisateurs
 * Interface avec l'API backend pour toutes les opérations utilisateurs
 */

import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

// ===========================
// TYPES
// ===========================

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  profile_photo_url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: Role;
  roleId: number;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  roleId: number;
  phone?: string;
  status?: string;
  generatePassword?: boolean;
  sendCredentialsByEmail?: boolean;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleId?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UsersListResponse {
  success: boolean;
  data?: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  users?: User[];
  total?: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  status?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Récupère le token d'authentification
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Prépare les headers pour les requêtes API
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Gère les erreurs de requête
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Erreur ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Ignore JSON parse errors
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Vérifier que la réponse a bien un format valide
  if (!data || typeof data !== 'object') {
    throw new Error('Format de réponse invalide');
  }

  return data as T;
}

// ===========================
// CRUD UTILISATEURS
// ===========================

/**
 * Liste tous les utilisateurs admins/superadmins
 */
export async function listAdmins(filters: UserFilters = {}): Promise<UsersListResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.search) params.append('search', filters.search);
  if (filters.roleId) params.append('roleId', String(filters.roleId));
  if (filters.status) params.append('status', filters.status);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  const url = queryString
    ? `${API_URL}/admin/users/admins-only?${queryString}`
    : `${API_URL}/admin/users/admins-only`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });

  return handleResponse<UsersListResponse>(response);
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(userId: number): Promise<User> {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });

  const data = await handleResponse<{ success: boolean; user: User }>(response);
  return data.user;
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(payload: CreateUserPayload): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

/**
 * Met à jour un utilisateur
 */
export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ success: boolean; user: User }>(response);
  return data.user;
}

/**
 * Supprime un utilisateur
 */
export async function deleteUser(userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getHeaders(),
  });

  await handleResponse<{ success: boolean }>(response);
}

/**
 * Change le rôle d'un utilisateur
 */
export async function updateUserRole(userId: number, roleId: number): Promise<User> {
  return updateUser(userId, { roleId });
}

/**
 * Change le statut d'un utilisateur
 */
export async function updateUserStatus(
  userId: number,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
): Promise<User> {
  return updateUser(userId, { status });
}

// ===========================
// RÔLES DISPONIBLES
// ===========================

/**
 * Récupère les rôles disponibles pour assignation
 */
export async function getAvailableRoles(): Promise<Role[]> {
  const response = await fetch(`${API_URL}/admin/roles/available-for-users`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });

  const data = await handleResponse<{ success: boolean; data: Role[]; roles?: Role[] }>(response);
  return data.data || data.roles || [];
}

// ===========================
// INVITATIONS
// ===========================

/**
 * Envoie une invitation par email à un utilisateur
 */
export async function sendInvitation(userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/users/${userId}/invite`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
  });

  await handleResponse<{ success: boolean }>(response);
}

/**
 * Renvoie une invitation par email
 */
export async function resendInvitation(userId: number): Promise<void> {
  return sendInvitation(userId);
}

/**
 * Changer le mot de passe d'un utilisateur
 */
export async function changeUserPassword(
  userId: number,
  data: {
    newPassword: string;
    generateRandom?: boolean;
    sendEmail?: boolean;
    forceChange?: boolean;
  }
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await fetch(`${API_URL}/admin/users/${userId}/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

/**
 * Envoyer les identifiants par email
 */
export async function sendUserCredentials(userId: number): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await fetch(`${API_URL}/admin/users/${userId}/send-credentials`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
  });

  return handleResponse(response);
}

// ===========================
// STATISTIQUES
// ===========================

/**
 * Récupère les statistiques des utilisateurs
 */
export async function getUserStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byRole: Record<string, number>;
}> {
  const response = await fetch(`${API_URL}/admin/users/stats`, {
    method: 'GET',
    credentials: 'include',
    headers: getHeaders(),
  });

  return handleResponse(response);
}

// ===========================
// AUDIT LOG (si disponible)
// ===========================

/**
 * Récupère l'historique des modifications d'un utilisateur
 */
export async function getUserAuditLog(userId: number): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/audit-log`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders(),
    });

    const data = await handleResponse<{ success: boolean; logs: any[] }>(response);
    return data.logs || [];
  } catch (error) {
    // Si l'endpoint n'existe pas, retourner un tableau vide
    console.warn('Audit log not available:', error);
    return [];
  }
}

// ===========================
// EXPORT DU SERVICE
// ===========================

const userService = {
  // CRUD
  listAdmins,
  getUserById,
  createUser,
  updateUser,
  deleteUser,

  // Mise à jour spécifique
  updateUserRole,
  updateUserStatus,

  // Rôles
  getAvailableRoles,

  // Invitations
  sendInvitation,
  resendInvitation,

  // Mot de passe
  changeUserPassword,
  sendUserCredentials,

  // Statistiques
  getUserStats,
  getUserAuditLog,
};

export default userService;

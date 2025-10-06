import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/vendor-types`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface VendorType {
  id: number;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export interface CreateVendorTypeDto {
  label: string;
  description: string;
}

export interface UpdateVendorTypeDto {
  label?: string;
  description?: string;
}

export interface CreateVendorTypeResponse {
  message: string;
  vendorType: VendorType;
}

export interface UpdateVendorTypeResponse {
  message: string;
  vendorType: VendorType;
}

export interface DeleteVendorTypeResponse {
  message: string;
}

export const vendorTypeService = {
  /**
   * Récupérer tous les types de vendeurs
   */
  getAll: async (): Promise<VendorType[]> => {
    try {
      const response = await axios.get<VendorType[]>(API_BASE_URL, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des types de vendeurs:', error);
      throw error;
    }
  },

  /**
   * Récupérer un type de vendeur par ID
   */
  getById: async (id: number): Promise<VendorType> => {
    try {
      const response = await axios.get<VendorType>(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement du type:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau type de vendeur
   */
  create: async (data: CreateVendorTypeDto): Promise<CreateVendorTypeResponse> => {
    try {
      const response = await axios.post<CreateVendorTypeResponse>(
        API_BASE_URL,
        data,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (error.response?.status === 409) {
          throw new Error(message || 'Ce type de vendeur existe déjà');
        }
        if (error.response?.status === 400) {
          throw new Error(Array.isArray(message) ? message.join(', ') : message || 'Données invalides');
        }
      }
      console.error('Erreur lors de la création du type:', error);
      throw error;
    }
  },

  /**
   * Modifier un type de vendeur
   */
  update: async (
    id: number,
    data: UpdateVendorTypeDto
  ): Promise<UpdateVendorTypeResponse> => {
    try {
      const response = await axios.patch<UpdateVendorTypeResponse>(
        `${API_BASE_URL}/${id}`,
        data,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (error.response?.status === 404) {
          throw new Error('Type de vendeur introuvable');
        }
        if (error.response?.status === 409) {
          throw new Error(message || 'Ce nom de type existe déjà');
        }
      }
      console.error('Erreur lors de la modification du type:', error);
      throw error;
    }
  },

  /**
   * Supprimer un type de vendeur
   */
  delete: async (id: number): Promise<DeleteVendorTypeResponse> => {
    try {
      const response = await axios.delete<DeleteVendorTypeResponse>(
        `${API_BASE_URL}/${id}`,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (error.response?.status === 404) {
          throw new Error('Type de vendeur introuvable');
        }
        if (error.response?.status === 400) {
          throw new Error(message || 'Impossible de supprimer ce type');
        }
      }
      console.error('Erreur lors de la suppression du type:', error);
      throw error;
    }
  }
};

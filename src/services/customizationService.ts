import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface DesignElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  // Champs spécifiques au type
  [key: string]: any;
}

export interface SizeSelection {
  size: string;
  quantity: number;
}

export interface CustomizationData {
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements: DesignElement[];
  sizeSelections?: SizeSelection[];
  sessionId?: string;
  previewImageUrl?: string;
}

export interface Customization {
  id: number;
  userId: number | null;
  sessionId: string | null;
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements: DesignElement[];
  sizeSelections: SizeSelection[] | null;
  previewImageUrl: string | null;
  totalPrice: number;
  status: string;
  orderId: number | null;
  createdAt: string;
  updatedAt: string;
  product?: any;
}

class CustomizationService {
  /**
   * Sauvegarder une personnalisation
   */
  async saveCustomization(data: CustomizationData): Promise<Customization> {
    try {
      console.log('💾 [CustomizationService] Sauvegarde personnalisation:', data);

      const response = await axios.post(`${API_BASE}/customizations`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });

      console.log('✅ [CustomizationService] Personnalisation sauvegardée:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [CustomizationService] Erreur sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Récupérer une personnalisation par ID
   */
  async getCustomization(id: number): Promise<Customization> {
    try {
      const response = await axios.get(`${API_BASE}/customizations/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur récupération:', error);
      throw error;
    }
  }

  /**
   * Récupérer les personnalisations de l'utilisateur connecté
   */
  async getMyCustomizations(status?: string): Promise<Customization[]> {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_BASE}/customizations/user/me`, {
        params,
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur récupération:', error);
      throw error;
    }
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   */
  async getSessionCustomizations(sessionId: string, status?: string): Promise<Customization[]> {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_BASE}/customizations/session/${sessionId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur récupération session:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une personnalisation
   */
  async updateCustomization(id: number, data: Partial<CustomizationData>): Promise<Customization> {
    try {
      const response = await axios.put(`${API_BASE}/customizations/${id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur mise à jour:', error);
      throw error;
    }
  }

  /**
   * Supprimer une personnalisation
   */
  async deleteCustomization(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/customizations/${id}`, {
        headers: {
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur suppression:', error);
      throw error;
    }
  }

  /**
   * Générer un sessionId pour les guests
   */
  getOrCreateSessionId(): string {
    const storageKey = 'guest-session-id';
    let sessionId = localStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, sessionId);
      console.log('🆔 [CustomizationService] Nouveau sessionId créé:', sessionId);
    }

    return sessionId;
  }

  /**
   * Récupérer le token d'authentification
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export default new CustomizationService();

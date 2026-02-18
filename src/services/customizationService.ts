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

      // 🔧 CONTOURNEMENT : Vérifier si les designElements sont corrects
      const customization = response.data;
      if (customization.designElements && customization.designElements.length > 0 &&
          Array.isArray(customization.designElements[0]) && customization.designElements[0].length === 0) {
        console.warn('⚠️ [CustomizationService] Backend bug détecté: designElements vide malgré envoi de données');

        // 💾 Stocker les designElements dans localStorage comme backup
        const backupKey = `customization-backup-${customization.id}`;
        const backupData = {
          designElements: data.designElements,
          timestamp: Date.now(),
          productId: data.productId,
          sessionId: data.sessionId
        };
        localStorage.setItem(backupKey, JSON.stringify(backupData));

        console.log('💾 [CustomizationService] Backup des designElements dans localStorage:', backupKey);
      }

      return customization;
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
      let customization = response.data;

      // 🔧 CONTOURNEMENT : Vérifier et restaurer les designElements depuis le backup si nécessaire
      if (customization.designElements && customization.designElements.length > 0 &&
          Array.isArray(customization.designElements[0]) && customization.designElements[0].length === 0) {

        console.warn('⚠️ [CustomizationService] designElements vides détectés, tentative de restauration depuis backup');

        const backupKey = `customization-backup-${id}`;
        const backupDataStr = localStorage.getItem(backupKey);

        if (backupDataStr) {
          try {
            const backupData = JSON.parse(backupDataStr);
            console.log('✅ [CustomizationService] Restauration des designElements depuis backup:', {
              backupElementsCount: backupData.designElements?.length || 0,
              backupTimestamp: backupData.timestamp
            });

            // Restaurer les designElements depuis le backup
            customization = {
              ...customization,
              designElements: backupData.designElements
            };
          } catch (backupError) {
            console.error('❌ [CustomizationService] Erreur lecture backup:', backupError);
          }
        }
      }

      return customization;
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
   * Récupérer le draft d'un produit
   */
  async getProductDraft(productId: number): Promise<Customization | null> {
    try {
      const sessionId = this.getOrCreateSessionId();
      const token = this.getAuthToken();

      const params: Record<string, string> = {};
      if (sessionId) params.sessionId = sessionId;

      const response = await axios.get(`${API_BASE}/customizations/product/${productId}/draft`, {
        params,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('❌ [CustomizationService] Erreur récupération draft:', error);
      return null;
    }
  }

  /**
   * Rechercher des personnalisations
   */
  async searchCustomizations(params: {
    productId?: number;
    sessionId?: string;
    userId?: number;
    status?: string;
  }): Promise<Customization[]> {
    try {
      const response = await axios.get(`${API_BASE}/customizations/search`, {
        params,
        headers: {
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur recherche:', error);
      throw error;
    }
  }

  /**
   * Upload d'une image pour personnalisation
   */
  async uploadImage(file: File): Promise<{ url: string; publicId: string; width: number; height: number }> {
    try {
      console.log('📤 [CustomizationService] Upload image:', {
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        fileType: file.type
      });

      // Créer le FormData
      const formData = new FormData();
      formData.append('file', file);

      // Ajouter le sessionId si c'est un guest (pas de token)
      const token = this.getAuthToken();
      if (!token) {
        const sessionId = this.getOrCreateSessionId();
        formData.append('sessionId', sessionId);
        console.log('👤 [CustomizationService] Guest upload avec sessionId:', sessionId);
      }

      // ⚠️ IMPORTANT: Ne PAS spécifier Content-Type manuellement
      // Axios le gère automatiquement avec FormData et ajoute la boundary
      const response = await axios.post(`${API_BASE}/customizations/upload-image`, formData, {
        headers: {
          // Seulement le token si présent
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      console.log('✅ [CustomizationService] Image uploadée:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [CustomizationService] Erreur upload image:', error);

      // Extraire le message d'erreur du backend
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          'Erreur inconnue lors de l\'upload';

      console.error('📝 [CustomizationService] Détails erreur:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });

      // Créer une erreur avec un message clair
      const uploadError = new Error(errorMessage);
      (uploadError as any).status = error.response?.status;
      (uploadError as any).originalError = error;

      throw uploadError;
    }
  }

  /**
   * Upload d'une prévisualisation (base64)
   */
  async uploadPreview(imageData: string): Promise<{ url: string; publicId: string }> {
    try {
      const response = await axios.post(`${API_BASE}/customizations/upload-preview`, {
        imageData
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });

      console.log('✅ [CustomizationService] Preview uploadée:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [CustomizationService] Erreur upload preview:', error);
      throw error;
    }
  }

  /**
   * Migrer les personnalisations guest vers un utilisateur connecté
   */
  async migrateGuestData(): Promise<{ migrated: number; customizations: Customization[] }> {
    try {
      const sessionId = localStorage.getItem('guest-session-id');
      const token = this.getAuthToken();

      if (!sessionId || !token) {
        return { migrated: 0, customizations: [] };
      }

      const response = await axios.post(`${API_BASE}/customizations/migrate`, {
        sessionId
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('✅ [CustomizationService] Migration effectuée:', response.data);

      // Nettoyer la session guest après migration réussie
      localStorage.removeItem('guest-session-id');

      return response.data;
    } catch (error: any) {
      console.error('❌ [CustomizationService] Erreur migration:', error);
      throw error;
    }
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

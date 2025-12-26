// src/services/vendorOnboardingService.ts
import { hybridAuthService } from './hybridAuthService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface PhoneNumber {
  number: string;
  isPrimary: boolean;
}

export interface SocialMedia {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
  url: string;
}

export interface OnboardingData {
  phones: PhoneNumber[];
  socialMedia?: SocialMedia[];
}

export interface ProfileStatus {
  profileCompleted: boolean;
  details: {
    hasProfileImage: boolean;
    phoneCount: number;
    socialMediaCount: number;
    completedAt: string | null;
  };
}

export interface OnboardingInfo {
  profileImage: string | null;
  phones: Array<{
    id: number;
    number: string;
    isPrimary: boolean;
  }>;
  socialMedia: Array<{
    id: number;
    platform: string;
    url: string;
    username: string;
  }>;
}

class VendorOnboardingService {
  private baseUrl = `${API_BASE}/api/vendor`;

  /**
   * Compléter l'onboarding vendeur
   */
  async completeOnboarding(
    data: OnboardingData,
    profileImage: File | null
  ): Promise<{
    success: boolean;
    message: string;
    vendor?: any;
  }> {
    try {
      console.log('📤 Préparation des données pour l\'onboarding...');

      const formData = new FormData();

      // Ajouter les téléphones
      formData.append('phones', JSON.stringify(data.phones));
      console.log('📞 Téléphones:', data.phones);

      // Ajouter les réseaux sociaux si présents
      if (data.socialMedia && data.socialMedia.length > 0) {
        formData.append('socialMedia', JSON.stringify(data.socialMedia));
        console.log('🌐 Réseaux sociaux:', data.socialMedia);
      }

      // Ajouter la photo de profil
      if (profileImage) {
        formData.append('profileImage', profileImage);
        console.log('📸 Photo de profil:', profileImage.name, profileImage.size, 'bytes');
      }

      // Utiliser hybridAuthService pour l'authentification
      const headers = hybridAuthService.getAuthHeaders();
      // Ne pas définir Content-Type pour FormData (le navigateur le fait automatiquement avec boundary)
      delete headers['Content-Type'];

      console.log('🔑 Headers d\'authentification:', headers);

      const response = await fetch(
        `${this.baseUrl}/complete-onboarding`,
        {
          method: 'POST',
          body: formData,
          headers,
          credentials: 'include',
        }
      );

      console.log('📡 Réponse du serveur:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Erreur ${response.status}: ${response.statusText}`
        }));
        console.error('❌ Erreur du serveur:', errorData);
        throw errorData;
      }

      const result = await response.json();
      console.log('✅ Onboarding complété:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Erreur complétion onboarding:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut de complétion du profil
   */
  async getProfileStatus(): Promise<ProfileStatus> {
    try {
      const response = await hybridAuthService.makeAuthenticatedRequest(
        `${this.baseUrl}/profile-status`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erreur récupération statut profil:', error);
      throw error;
    }
  }

  /**
   * Récupérer les informations d'onboarding du vendeur
   */
  async getOnboardingInfo(): Promise<OnboardingInfo> {
    try {
      const response = await hybridAuthService.makeAuthenticatedRequest(
        `${this.baseUrl}/onboarding-info`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Erreur récupération info onboarding:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les numéros de téléphone
   */
  async updatePhones(phones: PhoneNumber[]): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await hybridAuthService.makeAuthenticatedRequest(
        `${this.baseUrl}/update-phones`,
        {
          method: 'PUT',
          body: JSON.stringify({ phones }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erreur mise à jour numéros:', error);
      throw error;
    }
  }
}

export default new VendorOnboardingService();

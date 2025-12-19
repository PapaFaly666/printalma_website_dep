import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

interface ProfileStatus {
  isFirstLogin: boolean;
  isProfileComplete: boolean;
  missingItems: string[];
  profile: {
    professional_title: string | null;
    vendor_bio: string | null;
    has_social_media: boolean;
  };
}

export const useVendorProfile = () => {
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le statut du profil vendeur
      const response = await apiClient.get('/auth/vendor/profile/status');

      setProfileStatus(response.data);
      console.log('📊 [useVendorProfile] Statut profil récupéré:', {
        isProfileComplete: response.data.isProfileComplete,
        isFirstLogin: response.data.isFirstLogin,
        missingItems: response.data.missingItems,
        profile: {
          professional_title: response.data.profile.professional_title,
          vendor_bio: response.data.profile.vendor_bio ? `${response.data.profile.vendor_bio.substring(0, 50)}...` : null,
          has_social_media: response.data.profile.has_social_media
        }
      });

      // Log spécifique pour le débogage
      if (!response.data.isProfileComplete) {
        console.warn('⚠️ [useVendorProfile] PROFIL INCOMPLET - La bannière doit s\'afficher');
        console.warn('📝 [useVendorProfile] Éléments manquants:', response.data.missingItems);
      } else {
        console.log('✅ [useVendorProfile] Profil complet - Pas de bannière');
      }
    } catch (err: any) {
      console.error('❌ [useVendorProfile] Erreur lors du chargement du profil:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement du profil';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const completeFirstLogin = async () => {
    try {
      console.log('✅ [useVendorProfile] Marquage première connexion comme complétée');
      await apiClient.post('/auth/vendor/first-login-complete');
      await fetchProfileStatus(); // Rafraîchir le statut
    } catch (err: any) {
      console.error('❌ [useVendorProfile] Erreur lors du marquage de la première connexion:', err);
      throw new Error(err.response?.data?.message || 'Erreur');
    }
  };

  const updateProfile = async (data: {
    vendor_bio?: string;
    professional_title?: string;
  }) => {
    try {
      console.log('✏️ [useVendorProfile] Mise à jour du profil:', data);
      await apiClient.put('/auth/vendor/profile/bio', data);
      await fetchProfileStatus(); // Rafraîchir le statut
      console.log('✅ [useVendorProfile] Profil mis à jour avec succès');
    } catch (err: any) {
      console.error('❌ [useVendorProfile] Erreur lors de la mise à jour du profil:', err);
      throw new Error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const updateSocialMedia = async (socialMediaData: any) => {
    try {
      console.log('🔗 [useVendorProfile] Mise à jour des réseaux sociaux:', socialMediaData);
      await apiClient.put('/auth/vendor/social-media', socialMediaData);
      await fetchProfileStatus(); // Rafraîchir le statut
      console.log('✅ [useVendorProfile] Réseaux sociaux mis à jour avec succès');
    } catch (err: any) {
      console.error('❌ [useVendorProfile] Erreur lors de la mise à jour des réseaux sociaux:', err);
      throw new Error(err.response?.data?.message || 'Erreur lors de la mise à jour des réseaux sociaux');
    }
  };

  return {
    profileStatus,
    loading,
    error,
    completeFirstLogin,
    updateProfile,
    updateSocialMedia,
    refetch: fetchProfileStatus,
  };
};
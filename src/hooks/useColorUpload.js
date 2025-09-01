import { useState, useCallback } from 'react';
import { colorManagementService } from '../services/colorManagementService';

export const useColorUpload = (productId) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpload, setLastUpload] = useState(null);

  const uploadColorImage = useCallback(async (colorVariation, imageFile) => {
    setUploading(true);
    setError(null);

    try {
      // Validation du fichier
      if (!imageFile) {
        throw new Error('Aucun fichier sélectionné');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        throw new Error('Format d\'image non supporté. Utilisez JPG, PNG ou WEBP.');
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error('L\'image est trop volumineuse. Taille maximum: 5MB.');
      }

      // Upload intelligent
      const result = await colorManagementService.uploadColorImage(productId, colorVariation, imageFile);
      
      setLastUpload(result);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [productId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    colorManagementService.clearCache(productId);
  }, [productId]);

  return {
    uploadColorImage,
    uploading,
    error,
    lastUpload,
    clearError,
    clearCache
  };
}; 
import { useState } from 'react';
import { API_CONFIG } from '../config/api';

interface UploadOptions {
  section: 'designs' | 'influencers' | 'merchandising';
  onUploadStart?: () => void;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Hook pour gérer l'upload d'images avec support SVG et progression
 */
export const useImageUpload = ({
  section,
  onUploadStart,
  onUploadSuccess,
  onUploadError
}: UploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string> => {
    // État initial
    setUploading(true);
    setProgress(0);
    onUploadStart?.();

    try {
      // Validation côté client
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Détecter si c'est un SVG
      const isSvg = file.name.toLowerCase().endsWith('.svg');
      console.log(`📤 Upload ${isSvg ? 'SVG' : 'image'}: ${file.name} (${formatFileSize(file.size)})`);

      // Créer le FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload avec progress via XMLHttpRequest
      const xhr = new XMLHttpRequest();

      // Upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
          console.log(`📊 Progression: ${percentComplete}%`);
        }
      });

      // Promesse pour l'upload
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success || response.data) {
              const url = response.data?.url || response.url;
              console.log('✅ Upload réussi:', url);
              onUploadSuccess?.(url);
              resolve(url);
            } else {
              reject(new Error(response.message || 'Erreur upload'));
            }
          } else if (xhr.status === 401) {
            reject(new Error('Non autorisé. Veuillez vous reconnecter.'));
          } else if (xhr.status === 413) {
            reject(new Error('Fichier trop volumineux (max 5MB)'));
          } else if (xhr.status === 415) {
            reject(new Error('Format non supporté'));
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || `Erreur ${xhr.status}`));
            } catch {
              reject(new Error(`Erreur ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erreur réseau lors de l\'upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload annulé'));
        });

        // Envoyer la requête avec authentification par cookies
        xhr.open('POST', `${API_CONFIG.BASE_URL}/admin/content/upload?section=${section}`);
        xhr.withCredentials = true; // Important pour les cookies de session
        xhr.send(formData);
      });

      const url = await uploadPromise;
      return url;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur upload:', errorMsg);
      onUploadError?.(errorMsg);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadImage,
    uploading,
    progress,
  };
};

/**
 * Validation du fichier avant upload
 */
function validateFile(file: File): ValidationResult {
  // Vérifier l'extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Format non supporté. Utilisez JPG, PNG, SVG ou WEBP (fichier: ${file.name})`
    };
  }

  // Vérifier la taille (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${formatFileSize(file.size)}). Max: 5MB`
    };
  }

  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Fichier vide'
    };
  }

  return { valid: true };
}

/**
 * Formater la taille du fichier pour l'affichage
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

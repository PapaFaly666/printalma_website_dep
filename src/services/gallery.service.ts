/**
 * Service API pour la gestion des galeries vendeur
 */

import axios from 'axios';
import {
  VendorGallery,
  VendorGalleryResponse,
  CreateGalleryRequest,
  UpdateGalleryRequest,
  GalleryStatus
} from '../types/gallery';
import { API_CONFIG } from '../config/api';

const GALLERY_API_URL = `${API_CONFIG.BASE_URL}/vendor/galleries`;
const PUBLIC_GALLERY_API_URL = `${API_CONFIG.BASE_URL}/public/galleries`;

class GalleryService {
  /**
   * Récupérer les galeries du vendeur connecté
   */
  async getVendorGalleries(
    page: number = 1,
    limit: number = 10
  ): Promise<{ galleries: VendorGallery[]; total: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await axios.get(`${GALLERY_API_URL}?${params.toString()}`, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération des galeries');
      }

      // Transformer les données pour normaliser imageUrl en url
      const galleries = response.data.data.galleries.map((gallery: any) => ({
        ...gallery,
        images: gallery.images.map((img: any) => ({
          ...img,
          url: img.imageUrl || img.url, // Normaliser imageUrl en url
          order: img.orderPosition || img.order // Normaliser orderPosition en order
        }))
      }));

      return {
        galleries,
        total: response.data.data.pagination?.total || galleries.length
      };
    } catch (error: any) {
      console.error('Erreur getVendorGalleries:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la récupération des galeries'
      );
    }
  }

  /**
   * Récupérer la galerie publique d'un vendeur par ID de vendeur
   */
  async getPublicVendorGallery(vendorId: number): Promise<VendorGallery | null> {
    try {
      const response = await axios.get(`${PUBLIC_GALLERY_API_URL}/vendor/${vendorId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération de la galerie publique');
      }

      // Si le vendeur n'a pas de galerie publiée
      if (!response.data.data.gallery) {
        return null;
      }

      // Transformer les données pour normaliser imageUrl en url
      const gallery = {
        ...response.data.data.gallery,
        images: response.data.data.gallery.images.map((img: any) => ({
          ...img,
          url: img.imageUrl || img.url, // Normaliser imageUrl en url
          order: img.orderPosition || img.order // Normaliser orderPosition en order
        }))
      };

      return gallery;
    } catch (error: any) {
      console.error('Erreur getPublicVendorGallery:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la récupération de la galerie publique'
      );
    }
  }

  /**
   * Créer ou mettre à jour la galerie du vendeur (une seule galerie par vendeur)
   */
  async createOrUpdateGallery(data: {
    title: string;
    description?: string;
    images: File[];
    captions?: string[];
  }): Promise<VendorGallery> {
    try {
      const formData = new FormData();

      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }

      // Ajouter les images
      data.images.forEach((image) => {
        formData.append('images', image);
      });

      // Ajouter les captions si fournies (optionnel selon la doc)
      // Envoyer comme un tableau JSON unique avec le nom de champ 'captions' (sans indices)
      if (data.captions && data.captions.length > 0) {
        // Créer le tableau d'objets captions
        const captionsArray = data.images.map((_, index) => ({
          caption: data.captions[index] || `Image ${index + 1}`
        }));

        // Envoyer comme une chaîne JSON unique
        formData.append('captions', JSON.stringify(captionsArray));

        console.log('Captions being sent as single JSON array:', JSON.stringify(captionsArray));
      } else {
        console.log('No captions provided - captions is optional');
      }

      // Afficher le contenu FormData pour vérification
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, typeof pair[1], pair[1]);
      }

      const response = await axios.post(`${GALLERY_API_URL}/my-gallery`, formData, {
        // Ne pas définir Content-Type pour multipart/form-data
        // Axios le fera automatiquement avec le bon boundary
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la création/mise à jour de la galerie');
      }

      return response.data.data.gallery;
    } catch (error: any) {
      console.error('Erreur createOrUpdateGallery:', error);
      console.error('Response data:', error.response?.data);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg || err).join(', ');
        throw new Error(errorMessages);
      }

      if (error.response?.data) {
        // Si c'est un tableau de messages d'erreur
        if (Array.isArray(error.response.data)) {
          throw new Error(error.response.data.join(', '));
        }
        // Si c'est un message d'erreur simple
        if (typeof error.response.data === 'string') {
          throw new Error(error.response.data);
        }
      }

      throw new Error(
        error.message || 'Erreur lors de la création/mise à jour de la galerie'
      );
    }
  }

  /**
   * Mettre à jour les informations de la galerie du vendeur (titre, description, statut)
   */
  async updateGalleryInfo(data: {
    title?: string;
    description?: string;
    status?: GalleryStatus;
    isPublished?: boolean;
  }): Promise<VendorGallery> {
    try {
      const response = await axios.put(`${GALLERY_API_URL}/my-gallery`, data, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour de la galerie');
      }

      // Gérer différentes structures de réponse possibles
      let gallery = response.data.data?.gallery || response.data.gallery || response.data;

      if (!gallery) {
        throw new Error('Réponse API invalide: galerie non trouvée');
      }

      // Transformer les données pour normaliser imageUrl en url
      if (gallery.images) {
        gallery = {
          ...gallery,
          images: gallery.images.map((img: any) => ({
            ...img,
            url: img.imageUrl || img.url, // Normaliser imageUrl en url
            order: img.orderPosition || img.order // Normaliser orderPosition en order
          }))
        };
      }

      return gallery;
    } catch (error: any) {
      console.error('Erreur updateGalleryInfo:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la mise à jour de la galerie'
      );
    }
  }

  /**
   * Supprimer la galerie du vendeur (soft delete)
   */
  async deleteGallery(): Promise<void> {
    try {
      const response = await axios.delete(`${GALLERY_API_URL}/my-gallery`, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la suppression de la galerie');
      }
    } catch (error: any) {
      console.error('Erreur deleteGallery:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la suppression de la galerie'
      );
    }
  }

  /**
   * Publier ou dépublier une galerie par ID
   */
  async togglePublishGallery(galleryId: number, isPublished: boolean): Promise<VendorGallery> {
    try {
      const response = await axios.patch(
        `${GALLERY_API_URL}/${galleryId}/publish`,
        { is_published: isPublished },
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la publication de la galerie');
      }

      // Gérer différentes structures de réponse possibles
      let gallery = response.data.data?.gallery || response.data.gallery || response.data;

      if (!gallery) {
        throw new Error('Réponse API invalide: galerie non trouvée');
      }

      // Transformer les données pour normaliser imageUrl en url
      if (gallery.images) {
        gallery = {
          ...gallery,
          images: gallery.images.map((img: any) => ({
            ...img,
            url: img.imageUrl || img.url, // Normaliser imageUrl en url
            order: img.orderPosition || img.order // Normaliser orderPosition en order
          }))
        };
      }

      return gallery;
    } catch (error: any) {
      console.error('Erreur togglePublishGallery:', error);
      console.error('Response data:', error.response?.data);

      throw new Error(
        error.response?.data?.message || 'Erreur lors de la publication de la galerie'
      );
    }
  }

  /**
   * Changer le statut de la galerie du vendeur (DRAFT, PUBLISHED, ARCHIVED)
   */
  async changeGalleryStatus(status: GalleryStatus): Promise<VendorGallery> {
    try {
      const response = await axios.put(
        `${GALLERY_API_URL}/my-gallery`,
        {
          status: status,
          is_published: status === GalleryStatus.PUBLISHED
        },
        {
          withCredentials: true
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la modification du statut');
      }

      // Gérer différentes structures de réponse possibles
      let gallery = response.data.data?.gallery || response.data.gallery || response.data;

      if (!gallery) {
        throw new Error('Réponse API invalide: galerie non trouvée');
      }

      // Transformer les données pour normaliser imageUrl en url
      if (gallery.images) {
        gallery = {
          ...gallery,
          images: gallery.images.map((img: any) => ({
            ...img,
            url: img.imageUrl || img.url, // Normaliser imageUrl en url
            order: img.orderPosition || img.order // Normaliser orderPosition en order
          }))
        };
      }

      return gallery;
    } catch (error: any) {
      console.error('Erreur changeGalleryStatus:', error);
      throw new Error(
        error.response?.data?.message || 'Erreur lors de la modification du statut'
      );
    }
  }

  /**
   * Valider les fichiers avant upload
   */
  validateImages(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const GALLERY_CONSTRAINTS = {
      IMAGES_COUNT: 5,
      MAX_IMAGE_SIZE: 5 * 1024 * 1024,
      ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    };

    if (files.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      errors.push(`Vous devez sélectionner exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`);
    }

    files.forEach((file, index) => {
      // Vérifier le type MIME
      if (!GALLERY_CONSTRAINTS.ALLOWED_FORMATS.includes(file.type)) {
        errors.push(`Image ${index + 1}: Format non supporté (${file.type})`);
      }

      // Vérifier la taille
      if (file.size > GALLERY_CONSTRAINTS.MAX_IMAGE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        errors.push(`Image ${index + 1}: Taille trop grande (${sizeMB}MB, max 5MB)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Optimiser une image avant upload (redimensionnement côté client)
   */
  async optimizeImage(file: File, maxWidth: number = 1200, maxHeight: number = 1200): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculer les nouvelles dimensions en gardant le ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erreur lors de la conversion en blob'));
                return;
              }

              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });

              resolve(optimizedFile);
            },
            'image/jpeg',
            0.85 // Qualité 85%
          );
        };

        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compresser plusieurs images en batch
   */
  async optimizeImages(files: File[]): Promise<File[]> {
    try {
      const optimizationPromises = files.map(file => this.optimizeImage(file));
      return await Promise.all(optimizationPromises);
    } catch (error) {
      console.error('Erreur lors de l\'optimisation des images:', error);
      throw error;
    }
  }
}

export const galleryService = new GalleryService();
export default galleryService;

import { API_CONFIG } from '../config/api';

// Types
export interface ContentItem {
  id: string;
  name: string;
  imageUrl: string;
  order?: number;
}

export interface HomeContent {
  designs: ContentItem[];
  influencers: ContentItem[];
  merchandising: ContentItem[];
}

// Configuration
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

// Service API
export const contentService = {
  /**
   * Récupère le contenu public (pour la page d'accueil)
   */
  async getPublicContent(): Promise<HomeContent> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/public/content`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement du contenu');
    }

    return await response.json();
  },

  /**
   * Récupère le contenu pour l'admin
   */
  async getAdminContent(): Promise<HomeContent> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/admin/content`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Non autorisé. Veuillez vous reconnecter.');
      }
      throw new Error('Erreur lors du chargement du contenu');
    }

    return await response.json();
  },

  /**
   * Sauvegarde le contenu (admin uniquement)
   */
  async saveContent(content: HomeContent): Promise<{ success: boolean; message: string }> {
    // Préparer les données (ne garder que id, name, imageUrl)
    const payload = {
      designs: content.designs.map(({ id, name, imageUrl }) => ({ id, name, imageUrl })),
      influencers: content.influencers.map(({ id, name, imageUrl }) => ({ id, name, imageUrl })),
      merchandising: content.merchandising.map(({ id, name, imageUrl }) => ({ id, name, imageUrl }))
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}/admin/content`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de la sauvegarde' }));
      throw new Error(error.message || 'Erreur lors de la sauvegarde');
    }

    return await response.json();
  },

  /**
   * Upload une image vers Cloudinary
   */
  async uploadImage(
    file: File,
    section: 'designs' | 'influencers' | 'merchandising'
  ): Promise<{ url: string; publicId: string }> {
    // Détection améliorée des SVG (certains navigateurs renvoient text/xml ou text/plain)
    const isSvg = file.name.toLowerCase().endsWith('.svg') ||
                  file.type === 'image/svg+xml' ||
                  file.type === 'text/xml' ||
                  file.type === 'text/plain';

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!isSvg && !allowedTypes.includes(file.type)) {
      throw new Error('Format non supporté. Utilisez JPG, PNG, SVG ou WEBP');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux (max 5MB)');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/admin/content/upload?section=${section}`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData
      }
    );

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('Fichier trop volumineux (max 5MB)');
      }
      if (response.status === 415) {
        throw new Error('Format de fichier non supporté');
      }
      if (response.status === 401) {
        throw new Error('Non autorisé. Veuillez vous reconnecter.');
      }
      const error = await response.json().catch(() => ({ message: 'Erreur lors de l\'upload' }));
      throw new Error(error.message || 'Erreur lors de l\'upload');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Initialise le contenu avec les 17 items par défaut
   * POST /admin/content/initialize
   */
  async initializeContent(): Promise<{ success: boolean; message: string; count: number }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/admin/content/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Le contenu est déjà initialisé');
      }
      if (response.status === 401) {
        throw new Error('Non autorisé. Veuillez vous reconnecter.');
      }
      const error = await response.json().catch(() => ({ message: 'Erreur lors de l\'initialisation' }));
      throw new Error(error.message || 'Erreur lors de l\'initialisation');
    }

    return await response.json();
  },

  /**
   * Valide le contenu avant sauvegarde
   */
  validateContent(content: HomeContent): string[] {
    const errors: string[] = [];

    // Vérifier les quantités
    if (content.designs.length !== 6) {
      errors.push('Designs: 6 items requis');
    }
    if (content.influencers.length !== 5) {
      errors.push('Influenceurs: 5 items requis');
    }
    if (content.merchandising.length !== 6) {
      errors.push('Merchandising: 6 items requis');
    }

    // Vérifier que tous les IDs sont présents
    const allItems = [
      ...content.designs,
      ...content.influencers,
      ...content.merchandising
    ];

    allItems.forEach((item, index) => {
      if (!item.id) {
        errors.push(`Item ${index + 1}: ID manquant`);
      }
      if (!item.name || item.name.trim() === '') {
        errors.push(`Item ${item.id || index + 1}: Le nom est requis`);
      }
      // Validation assouplie: URL vide autorisée, sinon doit commencer par http
      if (item.imageUrl && item.imageUrl.trim() !== '' && !item.imageUrl.startsWith('http')) {
        errors.push(`Item ${item.id || index + 1}: L'URL de l'image doit commencer par http ou https`);
      }
    });

    return errors;
  }
};

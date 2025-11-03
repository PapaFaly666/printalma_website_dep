import { API_CONFIG } from '../config/api';
import { Designer, CreateDesignerData, UpdateDesignerData } from '../types/designer.types';

export interface DesignersResponse {
  designers: Designer[];
  total: number;
}

// Données mockées pour le développement
const mockDesigners: Designer[] = [
  {
    id: 1,
    name: 'Pap Musa',
    displayName: 'Pap Musa',
    bio: 'Artiste spécialisé dans les motifs traditionnels africains',
    avatarUrl: '/x_pap_musa.svg',
    isActive: true,
    sortOrder: 1,
    featuredOrder: 1,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    creator: {
      id: 1,
      firstName: 'Papa Faly',
      lastName: 'Diagne'
    }
  },
  {
    id: 2,
    name: 'Ceeneer',
    displayName: 'Ceeneer',
    bio: 'Ibrahima Diop - Designer moderne et innovant',
    avatarUrl: '/x_ceeneer.svg',
    isActive: true,
    sortOrder: 2,
    featuredOrder: 2,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    creator: {
      id: 1,
      firstName: 'Papa Faly',
      lastName: 'Diagne'
    }
  },
  {
    id: 3,
    name: 'K & C',
    displayName: 'K & C',
    bio: 'Collectif de designers créatifs',
    avatarUrl: '/x_kethiakh.svg',
    isActive: true,
    sortOrder: 3,
    featuredOrder: 3,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    creator: {
      id: 1,
      firstName: 'Papa Faly',
      lastName: 'Diagne'
    }
  },
  {
    id: 4,
    name: 'Breadwinner',
    displayName: 'Breadwinner',
    bio: 'Expert en design minimaliste',
    avatarUrl: '/x_breadwinner.svg',
    isActive: true,
    sortOrder: 4,
    featuredOrder: 4,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    creator: {
      id: 1,
      firstName: 'Papa Faly',
      lastName: 'Diagne'
    }
  },
  {
    id: 5,
    name: 'Meissa Biguey',
    displayName: 'Meissa Biguey',
    bio: 'Artiste polyvalent dans tous les styles',
    avatarUrl: '/x_maisssa_biguey.svg',
    isActive: true,
    sortOrder: 5,
    featuredOrder: 5,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    creator: {
      id: 1,
      firstName: 'Papa Faly',
      lastName: 'Diagne'
    }
  },
  {
    id: 6,
    name: 'DAD',
    displayName: 'DAD',
    bio: 'Designer de street art',
    avatarUrl: '/x_dad.svg',
    isActive: true,
    sortOrder: 6,
    featuredOrder: 6,
    isFeatured: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    creator: {
      id: 1,
      firstName: 'Papa Faly',
      lastName: 'Diagne'
    }
  }
];

class DesignerService {
  private baseUrl = `${API_CONFIG.BASE_URL}/designers`;

  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Vérifie si le backend est disponible
  private async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Simule un délai réseau
  private async delay(ms: number = 800): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Récupérer tous les designers (admin)
  async getAllDesigners(): Promise<DesignersResponse> {
    try {
      // Tenter de contacter le backend
      const isAvailable = await this.isBackendAvailable();

      if (isAvailable) {
        const response = await fetch(`${this.baseUrl}/admin`, {
          headers: this.getAuthHeaders(),
          credentials: 'include'
        });

        if (!response.ok) {
          throw await this.parseError(response);
        }

        return response.json();
      } else {
        // Utiliser les données mockées si le backend n'est pas disponible
        console.warn('Backend non disponible, utilisation des données mockées');
        await this.delay();
        return {
          designers: mockDesigners,
          total: mockDesigners.length
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des designers:', error);
      // En cas d'erreur, utiliser les données mockées
      await this.delay();
      return {
        designers: mockDesigners,
        total: mockDesigners.length
      };
    }
  }

  // Créer un designer (admin)
  async createDesigner(data: CreateDesignerData): Promise<Designer> {
    try {
      const isAvailable = await this.isBackendAvailable();

      if (isAvailable) {
        const formData = new FormData();
        formData.append('name', data.name);

        if (data.displayName) formData.append('displayName', data.displayName);
        if (data.bio) formData.append('bio', data.bio);
        if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
        if (data.sortOrder !== undefined) formData.append('sortOrder', String(data.sortOrder));
        if (data.avatar) formData.append('avatar', data.avatar);

        const response = await fetch(`${this.baseUrl}/admin`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          throw await this.parseError(response);
        }

        return response.json();
      } else {
        // Simulation de création avec données mockées
        await this.delay();
        const newDesigner: Designer = {
          id: mockDesigners.length + 1,
          name: data.name,
          displayName: data.displayName || data.name,
          bio: data.bio,
          avatarUrl: data.avatar ? URL.createObjectURL(data.avatar) : '/placeholder-avatar.png',
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? mockDesigners.length + 1,
          featuredOrder: null,
          isFeatured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          creator: {
            id: 1,
            firstName: 'Papa Faly',
            lastName: 'Diagne'
          }
        };

        mockDesigners.push(newDesigner);
        return newDesigner;
      }
    } catch (error) {
      console.error('Erreur lors de la création du designer:', error);
      throw error;
    }
  }

  // Modifier un designer (admin)
  async updateDesigner(id: number, data: UpdateDesignerData): Promise<Designer> {
    try {
      const isAvailable = await this.isBackendAvailable();

      if (isAvailable) {
        const formData = new FormData();

        if (data.name) formData.append('name', data.name);
        if (data.displayName !== undefined) formData.append('displayName', data.displayName);
        if (data.bio !== undefined) formData.append('bio', data.bio);
        if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
        if (data.sortOrder !== undefined) formData.append('sortOrder', String(data.sortOrder));
        if (data.isFeatured !== undefined) formData.append('isFeatured', String(data.isFeatured));
        if (data.featuredOrder !== undefined) formData.append('featuredOrder', String(data.featuredOrder));
        if (data.avatar) formData.append('avatar', data.avatar);
        if (data.removeAvatar) formData.append('removeAvatar', 'true');

        const response = await fetch(`${this.baseUrl}/admin/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          throw await this.parseError(response);
        }

        return response.json();
      } else {
        // Simulation de modification
        await this.delay();
        const designerIndex = mockDesigners.findIndex(d => d.id === id);
        if (designerIndex === -1) {
          throw new Error('Designer non trouvé');
        }

        const updatedDesigner = { ...mockDesigners[designerIndex], ...data, updatedAt: new Date().toISOString() };
        mockDesigners[designerIndex] = updatedDesigner;
        return updatedDesigner;
      }
    } catch (error) {
      console.error('Erreur lors de la modification du designer:', error);
      throw error;
    }
  }

  // Supprimer un designer (admin)
  async deleteDesigner(id: number): Promise<void> {
    try {
      const isAvailable = await this.isBackendAvailable();

      if (isAvailable) {
        const response = await fetch(`${this.baseUrl}/admin/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
          credentials: 'include'
        });

        if (!response.ok) {
          throw await this.parseError(response);
        }
      } else {
        // Simulation de suppression
        await this.delay();
        const designerIndex = mockDesigners.findIndex(d => d.id === id);
        if (designerIndex === -1) {
          throw new Error('Designer non trouvé');
        }
        mockDesigners.splice(designerIndex, 1);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du designer:', error);
      throw error;
    }
  }

  // Récupérer les designers en vedette (public)
  async getFeaturedDesigners(): Promise<Designer[]> {
    try {
      const isAvailable = await this.isBackendAvailable();

      if (isAvailable) {
        const response = await fetch(`${this.baseUrl}/featured`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw await this.parseError(response);
        }

        return response.json();
      } else {
        // Utiliser les designers mockés qui sont en vedette
        await this.delay();
        return mockDesigners.filter(d => d.isFeatured).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des designers en vedette:', error);
      // En cas d'erreur, retourner les designers mockés en vedette
      await this.delay();
      return mockDesigners.filter(d => d.isFeatured).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
    }
  }

  // Mettre à jour les designers en vedette (admin)
  async updateFeaturedDesigners(designerIds: number[]): Promise<Designer[]> {
    try {
      // Validation côté client - Exactement 6 designers requis selon la doc
      if (designerIds.length !== 6) {
        throw new Error('Exactement 6 designers doivent être sélectionnés');
      }

      const isAvailable = await this.isBackendAvailable();

      if (isAvailable) {
        const response = await fetch(`${this.baseUrl}/featured/update`, {
          method: 'PUT',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            designerIds: designerIds.map(String) // Convertir en strings selon la doc
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw await this.parseError(response);
        }

        return response.json();
      } else {
        // Simulation de mise à jour
        await this.delay();

        // Réinitialiser tous les designers
        mockDesigners.forEach(designer => {
          designer.isFeatured = false;
          designer.featuredOrder = null;
        });

        // Mettre à jour les designers sélectionnés
        const updatedDesigners: Designer[] = [];
        designerIds.forEach((designerId, index) => {
          const designer = mockDesigners.find(d => d.id === designerId);
          if (designer) {
            designer.isFeatured = true;
            designer.featuredOrder = index + 1;
            updatedDesigners.push(designer);
          }
        });

        return updatedDesigners;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des designers en vedette:', error);
      throw error;
    }
  }

  private async parseError(response: Response): Promise<Error> {
    try {
      const data = await response.json();
      return new Error(data?.message || `HTTP ${response.status}`);
    } catch {
      return new Error(`HTTP ${response.status}`);
    }
  }
}

export const designerService = new DesignerService();
export default designerService;
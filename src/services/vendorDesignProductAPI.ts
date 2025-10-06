import {
  CreateVendorDesignProductDto,
  UpdateVendorDesignProductDto,
  VendorDesignProductResponse,
  DesignUploadResponse,
  VendorDesignProductStatus,
  ValidationErrors
} from '../types/vendorDesignProduct';

/**
 * Service API unifié pour VendorDesignProduct
 * Basé sur la nouvelle architecture backend avec fetch et credentials: 'include'
 */
export class VendorDesignProductAPI {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'https://printalma-back-dep.onrender.com', timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  // ✅ AJOUTÉ : Méthode pour récupérer le token d'authentification
  private getAuthToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('jwt_token') || null;
  }

  /**
   * Méthode utilitaire pour les requêtes avec fetch
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // ✅ CORRECTION : Utiliser soit les cookies soit le token JWT
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config: RequestInit = {
      credentials: token ? 'omit' : 'include', // Omit si on utilise le token JWT
      ...options,
      headers,
    };

    console.log('🚀 VendorDesignProduct API Request:', options.method || 'GET', url);
    if (options.body && typeof options.body === 'string') {
      console.log('📦 Request Data:', JSON.parse(options.body));
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ VendorDesignProduct API Error:', response.status, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ VendorDesignProduct API Response:', response.status, data);
      return data;
    } catch (error) {
      console.error('❌ VendorDesignProduct API Error:', error);
      throw error;
    }
  }

  /**
   * 1. Upload Design - POST /vendor/design-product/upload-design
   */
  async uploadDesign(file: File, token?: string): Promise<DesignUploadResponse> {
    const formData = new FormData();
    formData.append('design', file);

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token || this.getAuthToken()}`,
    };

    // ✅ CORRECTION : Utiliser le bon endpoint avec authentification
    return this.request<DesignUploadResponse>('/vendor/design-product/upload-design', {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  /**
   * 2. Créer Design-Produit - POST /vendor/design-product
   */
  async createDesignProduct(data: CreateVendorDesignProductDto, token?: string): Promise<VendorDesignProductResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || this.getAuthToken()}`,
    };

    return this.request<VendorDesignProductResponse>('/vendor/design-product', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * 3. Récupérer tous les designs-produits - GET /vendor/design-product
   */
  async getDesignProducts(token?: string, status?: VendorDesignProductStatus): Promise<VendorDesignProductResponse[]> {
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token || this.getAuthToken()}`,
    };

    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }

    const endpoint = `/vendor/design-product${params.toString() ? `?${params.toString()}` : ''}`;
    
    return this.request<VendorDesignProductResponse[]>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  /**
   * 4. Récupérer un design-produit par ID - GET /vendor/design-product/:id
   */
  async getDesignProduct(id: number, token?: string): Promise<VendorDesignProductResponse> {
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token || this.getAuthToken()}`,
    };

    try {
      return await this.request<VendorDesignProductResponse>(`/vendor/design-product/${id}`, {
        method: 'GET',
        headers,
      });
    } catch (error: any) {
      // Fallback si l'endpoint n'existe pas (404)
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.warn('⚠️ /vendor/design-product non disponible, fallback /vendor/designs');
        // Essayer de lister tous les designs et filtrer
        const list = await this.request<any[]>('/vendor/designs?status=all', {
          method: 'GET',
          headers,
        });
        
        const found = list.find(item => item.id === id);
        if (found) {
          return found as VendorDesignProductResponse;
        }
        throw new Error(`Design-produit ${id} non trouvé`);
      }
      throw error;
    }
  }

  /**
   * 5. Mettre à jour un design-produit - PUT /vendor/design-product/:id
   */
  async updateDesignProduct(id: number, data: UpdateVendorDesignProductDto, token?: string): Promise<VendorDesignProductResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<VendorDesignProductResponse>(`/vendor/design-product/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * 6. Supprimer un design-produit - DELETE /vendor/design-product/:id
   */
  async deleteDesignProduct(id: number, token?: string): Promise<{ message: string }> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<{ message: string }>(`/vendor/design-product/${id}`, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * 7. Mettre à jour le statut - PUT /vendor/design-product/:id/status
   */
  async updateDesignProductStatus(id: number, status: VendorDesignProductStatus, token?: string): Promise<VendorDesignProductResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<VendorDesignProductResponse>(`/vendor/design-product/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
  }

  /**
   * 8. Filtrer par statut - GET /vendor/design-product/status/:status
   */
  async getDesignProductsByStatus(status: VendorDesignProductStatus, token?: string): Promise<VendorDesignProductResponse[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<VendorDesignProductResponse[]>(`/vendor/design-product/status/${status}`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Workflow complet : Upload + Création
   */
  async createCompleteDesignProduct(
    file: File,
    productId: number,
    transformations: {
      positionX: number;
      positionY: number;
      scale: number;
      rotation: number;
      name?: string;
      description?: string;
    },
    token?: string,
    status: VendorDesignProductStatus = VendorDesignProductStatus.DRAFT
  ): Promise<VendorDesignProductResponse> {
    try {
      // 1. Upload du design
      const uploadResult = await this.uploadDesign(file, token);
      
      // 2. Créer le design-produit avec les transformations
      const designProduct = await this.createDesignProduct({
        productId,
        designUrl: uploadResult.designUrl,
        designPublicId: uploadResult.publicId,
        designFileName: uploadResult.originalName,
        ...transformations,
        status
      }, token);
      
      return designProduct;
    } catch (error) {
      console.error('❌ Erreur workflow complet:', error);
      throw error;
    }
  }
}

/**
 * Validation côté client des transformations
 */
export function validateTransformations(data: Partial<CreateVendorDesignProductDto | UpdateVendorDesignProductDto>): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (data.positionX !== undefined && (data.positionX < 0 || data.positionX > 1)) {
    errors.positionX = 'Position X doit être entre 0 et 1';
  }
  
  if (data.positionY !== undefined && (data.positionY < 0 || data.positionY > 1)) {
    errors.positionY = 'Position Y doit être entre 0 et 1';
  }
  
  if (data.scale !== undefined && (data.scale < 0.1 || data.scale > 2)) {
    errors.scale = 'Échelle doit être entre 0.1 et 2';
  }
  
  if (data.rotation !== undefined && (data.rotation < 0 || data.rotation > 360)) {
    errors.rotation = 'Rotation doit être entre 0 et 360 degrés';
  }
  
  return errors;
}

/**
 * Vérifier si les erreurs de validation sont vides
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Instance unique du service VendorDesignProductAPI
 * À utiliser dans tout le projet pour une configuration cohérente
 */
export const vendorDesignProductAPI = new VendorDesignProductAPI(
  import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com'
);

// Instance avec authentification token (pour les cas où c'est nécessaire)
export const createVendorDesignProductAPIWithToken = (token: string) => {
  const api = new VendorDesignProductAPI(
    import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com'
  );
  
  // Méthodes wrapper avec token automatique
  return {
    uploadDesign: (file: File) => api.uploadDesign(file, token),
    createDesignProduct: (data: CreateVendorDesignProductDto) => api.createDesignProduct(data, token),
    getDesignProducts: (status?: VendorDesignProductStatus) => api.getDesignProducts(token, status),
    getDesignProduct: (id: number) => api.getDesignProduct(id, token),
    updateDesignProduct: (id: number, data: UpdateVendorDesignProductDto) => api.updateDesignProduct(id, data, token),
    deleteDesignProduct: (id: number) => api.deleteDesignProduct(id, token),
    updateDesignProductStatus: (id: number, status: VendorDesignProductStatus) => api.updateDesignProductStatus(id, status, token),
    getDesignProductsByStatus: (status: VendorDesignProductStatus) => api.getDesignProductsByStatus(status, token),
    createCompleteDesignProduct: (
      file: File,
      productId: number,
      transformations: {
        positionX: number;
        positionY: number;
        scale: number;
        rotation: number;
        name?: string;
        description?: string;
      },
      status: VendorDesignProductStatus = VendorDesignProductStatus.DRAFT
    ) => api.createCompleteDesignProduct(file, productId, transformations, token, status)
  };
};

// Export par défaut pour une utilisation simple
export default vendorDesignProductAPI; 
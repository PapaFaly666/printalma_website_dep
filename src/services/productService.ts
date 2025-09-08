import { Product as SchemaProduct } from '../schemas/product.schema';
import { api } from './api';
import { prepareProductPayload } from '../utils/productNormalization';

// Extended Product interface for ModernProductList compatibility
export interface Product extends Omit<SchemaProduct, 'colors' | 'sizes'> {
  id: number;
  colorVariations?: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;
      view: string;
      delimitations?: Array<{
        id?: number;
        name?: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
      }>;
    }>;
  }>;
  sizes?: Array<{
    id: number;
    sizeName: string;
  }>;
}

// Types pour l'API backend selon la documentation
export interface CreateProductPayload {
  name: string;
  description?: string;
  price?: number;
  suggestedPrice?: number;
  stock?: number; // Optionnel avec valeur par défaut 0
  status?: string;
  categories: string[]; // Array de noms de catégories (pas d'IDs)
  sizes?: string[]; // Array de noms de tailles
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE'; // Genre du produit
  isReadyProduct?: boolean; // Indique si c'est un produit prêt (true) ou un mockup (false)
  colorVariations?: Array<{
    name: string;
    colorCode: string;
    images: Array<{
      fileId?: string;
      view: string;
      delimitations?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        name?: string;
      }>;
    }>;
  }>;
}

export interface ProductFile {
  fileId: string;
  file: File;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProductServiceResult {
  data: any;
  type: 'base' | 'vendor' | 'vendor-admin';
  source: string;
}

export interface DiagnosticResult {
  [key: string]: {
    status: number | string;
    ok?: boolean;
    statusText?: string;
    data?: any;
    url: string;
    error?: string;
  };
}

// Configuration API selon la documentation backend
const API_BASE = 'https://printalma-back-dep.onrender.com';

// Fonction utilitaire pour les appels API sécurisés
async function safeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include', // OBLIGATOIRE pour cookies HTTPS
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
      if (!response.ok) {
      throw new Error(data.message || `Erreur HTTP ${response.status}`);
      }
      
    return data;
    } catch (error) {
    console.error(`❌ [API Error] [${options.method || 'GET'} ${endpoint}]:`, error);
    showErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }

// Fonction pour afficher les erreurs à l'utilisateur
function showErrorMessage(message: string) {
  // Utiliser toast si disponible
  if (typeof window !== 'undefined' && (window as any).toast) {
    (window as any).toast.error(message);
  } else {
    console.error('🚨 Erreur API:', message);
  }
}

export class ProductService {
  // RÉCUPÉRER tous les produits (GET /api/products)
  static async getProducts(): Promise<ServiceResponse<Product[]>> {
    try {
      console.log('🔄 [ProductService] Récupération des produits...');
      const responseData = await safeApiCall('/products');

      if (Array.isArray(responseData)) {
        console.log(`✅ [ProductService] ${responseData.length} produits récupérés`);
        return {
          success: true,
          data: responseData.map(this.transformProduct)
        };
      } else if (responseData.success && responseData.data) {
        console.log(`✅ [ProductService] ${responseData.data.length} produits récupérés`);
        return {
          success: true,
          data: responseData.data.map(this.transformProduct)
        };
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error('❌ [ProductService] Erreur récupération produits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupère un produit en testant automatiquement tous les endpoints (NOUVELLE MÉTHODE)
   */
  static async getProductSmart(id: number): Promise<ProductServiceResult> {
    const endpoints = [
      {
        name: 'Produit de base',
        url: `${API_BASE}/products/${id}`,
        type: 'base' as const,
        requireAuth: false
      },
      {
        name: 'Produit vendeur',
        url: `${API_BASE}/vendor/products/${id}`,
        type: 'vendor' as const,
        requireAuth: true
      },
      {
        name: 'Admin vendeur',
        url: `${API_BASE}/vendor/admin/products/${id}`,
        type: 'vendor-admin' as const,
        requireAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const options: RequestInit = {};
        if (endpoint.requireAuth) {
          options.credentials = 'include';
        }

        console.log(`🔍 Test ${endpoint.name}: ${endpoint.url}`);
        const response = await fetch(endpoint.url, options);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ ${endpoint.name} trouvé!`, result);
          return {
            data: result.data || result,
            type: endpoint.type,
            source: endpoint.name
          };
        }
        
        console.warn(`⚠️ ${endpoint.name} (${endpoint.url}): ${response.status} ${response.statusText}`);
        
      } catch (error: any) {
        console.warn(`❌ ${endpoint.name} error:`, error.message);
      }
    }

    throw new Error(`Produit ${id} introuvable sur tous les endpoints`);
      }

  /**
   * Test de diagnostic complet
   */
  static async diagnoseProduct(id: number): Promise<DiagnosticResult> {
    const results: DiagnosticResult = {};
    
    const endpoints = [
      { name: 'Base Product', url: `${API_BASE}/products/${id}`, auth: false },
      { name: 'Vendor Product', url: `${API_BASE}/vendor/products/${id}`, auth: true },
      { name: 'Admin Vendor', url: `${API_BASE}/vendor/admin/products/${id}`, auth: true }
    ];

    for (const endpoint of endpoints) {
      try {
        const options: RequestInit = {};
        if (endpoint.auth) {
          options.credentials = 'include';
        }

        console.log(`🔍 Diagnostic ${endpoint.name}: ${endpoint.url}`);
        const response = await fetch(endpoint.url, options);
        
        results[endpoint.name] = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          data: response.ok ? await response.json() : null,
          url: endpoint.url
        };
        
      } catch (error: any) {
        results[endpoint.name] = {
          status: 'NETWORK_ERROR',
          error: error.message,
          url: endpoint.url
        };
      }
    }

    console.log('🔍 Diagnostic complet:', results);
    return results;
  }

  /**
   * Vérification du token JWT
   */
  static checkAuthentication(): {
    hasToken: boolean;
    tokenInfo?: any;
    isValid: boolean;
  } {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        return { hasToken: false, isValid: false };
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      return {
        hasToken: true,
        tokenInfo: {
          ...payload,
          expiresAt: new Date(payload.exp * 1000),
          isExpired
        },
        isValid: !isExpired
      };
    } catch (error) {
      return { hasToken: true, isValid: false };
    }
  }

  // CRÉER un produit (POST /products) - FORMAT EXACT SELON DOCUMENTATION BACKEND
  static async createProduct(productData: CreateProductPayload, imageFiles?: File[]): Promise<ServiceResponse<Product>> {
    try {
      console.log('🔄 [ProductService] Création du produit...');
      console.log('🔍 [DEBUG] Données reçues:', JSON.stringify(productData, null, 2));
      console.log('🔍 [DEBUG] Images reçues:', imageFiles?.length || 0);
      console.log('🔍 [DEBUG] Genre reçu:', productData.genre);
      console.log('🔍 [DEBUG] Genre sera envoyé:', productData.genre || 'UNISEXE');
      
      // Validation des données obligatoires
      if (!productData.name || productData.name.trim() === '') {
        throw new Error('Le nom du produit est requis');
      }
      
      if (!productData.categories || productData.categories.length === 0) {
        throw new Error('Au moins une catégorie est requise');
      }
      
      if (!imageFiles || imageFiles.length === 0) {
        throw new Error('Au moins une image est requise pour créer un produit');
      }
      
      // Construire la structure en passant par un payload nettoyé/normalisé
      const cleaned = prepareProductPayload(productData as any);
      const backendProductData = {
        name: (cleaned.name || '').trim(),
        description: cleaned.description || '',
        price: Number(cleaned.price) || 0,
        suggestedPrice: typeof cleaned.suggestedPrice === 'number' ? cleaned.suggestedPrice : undefined,
        stock: Number(cleaned.stock) || 0,
        status: cleaned.status || 'draft',
        categories: cleaned.categories,
        sizes: cleaned.sizes || [],
        genre: cleaned.genre || 'UNISEXE',
        isReadyProduct: cleaned.isReadyProduct ?? false,
        colorVariations: (cleaned.colorVariations || []).map((color: any, colorIndex: number) => ({
          name: color.name || `Couleur ${colorIndex + 1}`,
          colorCode: color.colorCode || '#000000',
          images: (color.images || []).map((image: any, imageIndex: number) => ({
            fileId: image.fileId || `image_${colorIndex}_${imageIndex}`,
            view: image.view || 'Front',
            delimitations: (image.delimitations || []).map((delim: any) => ({
              x: Number(delim.x) || 0,
              y: Number(delim.y) || 0,
              width: Number(delim.width) || 0,
              height: Number(delim.height) || 0,
              rotation: Number(delim.rotation) || 0,
              name: delim.name || undefined,
              coordinateType: 'PERCENTAGE'
            }))
          }))
        }))
      };
      
      console.log('🔍 [DEBUG] Structure backendProductData:', JSON.stringify(backendProductData, null, 2));
      console.log('🔍 [DEBUG] Genre dans backendProductData:', backendProductData.genre);
      
      // Créer FormData selon le format EXACT de la documentation
      const formData = new FormData();
      
      // CRITICAL: productData doit être un string JSON
      formData.append('productData', JSON.stringify(backendProductData));
      
      // CRITICAL: Fichiers doivent être nommés exactement "file_${fileId}"
      let globalImageCounter = 0;
      backendProductData.colorVariations.forEach((color) => {
        color.images.forEach((image) => {
          const fileId = image.fileId;
          const file = imageFiles?.[globalImageCounter];
          globalImageCounter += 1;
          if (file) {
            const fieldName = `file_${fileId}`;
            formData.append(fieldName, file);
            console.log(`📎 [DEBUG] Ajout fichier: ${fieldName} -> ${file.name}`);
          } else {
            console.warn(`⚠️ [WARN] Fichier manquant pour ${fileId}`);
          }
        });
      });
      
      console.log('🔍 [DEBUG] FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${typeof value === 'string' ? value.substring(0, 100) + '...' : value}`);
        }
      }
      
      // Appel API selon la documentation
      const response = await fetch(`${API_BASE}/products`, { method: 'POST', credentials: 'include', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Erreur HTTP ${response.status}`);
      
      if (data.success && data.data) {
        console.log('✅ [ProductService] Produit créé avec succès');
        return {
          success: true,
          data: this.transformProduct(data.data),
          message: 'Produit créé avec succès'
        };
      } else if (data.id) {
        console.log('✅ [ProductService] Produit créé avec succès (format direct)');
      return {
        success: true,
          data: this.transformProduct(data),
          message: 'Produit créé avec succès'
        };
      } else {
        throw new Error('Erreur lors de la création du produit');
      }
    } catch (error) {
      console.error('❌ [ProductService] Erreur création produit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // SUPPRIMER un produit (DELETE /api/products/:id)
  static async deleteProduct(id: number, mode: 'soft' | 'hard' = 'soft'): Promise<ServiceResponse<void>> {
    try {
      console.log(`🔄 [ProductService] Suppression ${mode} du produit ${id}...`);
      const endpoint = mode === 'hard' ? `/products/${id}/force` : `/products/${id}`;
      const response = await safeApiCall(endpoint, {
        method: 'DELETE'
      });
      
      if (response.success) {
        console.log(`✅ [ProductService] Produit ${id} supprimé (${mode})`);
        return {
          success: true,
          message: response.message || 'Produit supprimé avec succès'
        };
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error(`❌ [ProductService] Erreur suppression produit ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // METTRE À JOUR un produit (PUT /api/products/:id)
  static async updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<ServiceResponse<Product>> {
    try {
      console.log(`🔄 [ProductService] Mise à jour du produit ${id}...`);
      const response = await safeApiCall(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (response.success && response.data) {
        console.log(`✅ [ProductService] Produit ${id} mis à jour`);
        return {
          success: true,
          data: this.transformProduct(response.data),
          message: 'Produit mis à jour avec succès'
        };
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error(`❌ [ProductService] Erreur mise à jour produit ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // RESTAURER un produit (POST /api/products/:id/restore)
  static async restoreProduct(id: number): Promise<ServiceResponse<void>> {
    try {
      console.log(`🔄 [ProductService] Restauration du produit ${id}...`);
      const response = await safeApiCall(`/products/${id}/restore`, {
        method: 'POST'
      });
      
      if (response.success) {
        console.log(`✅ [ProductService] Produit ${id} restauré`);
        return {
          success: true,
          message: response.message || 'Produit restauré avec succès'
        };
      } else {
        throw new Error('Erreur lors de la restauration');
      }
    } catch (error) {
      console.error(`❌ [ProductService] Erreur restauration produit ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Formatage des prix en FCFA
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(price);
  }

  // Gestion des erreurs API selon la documentation
  static handleApiError(error: Error): string {
    const errorMessage = error.message;
    
    // Messages d'erreur spécifiques selon la documentation
    if (errorMessage.includes('400')) {
      return 'Données invalides. Vérifiez les informations saisies.';
    } else if (errorMessage.includes('401')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (errorMessage.includes('404')) {
      return 'Produit non trouvé.';
    } else if (errorMessage.includes('500')) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }
    
    return errorMessage || 'Une erreur est survenue';
  }

  // Transformation des données de l'API vers l'interface frontend
  private static transformProduct(apiProduct: any): Product {
    const category = apiProduct.categories?.[0];
    const allViews = apiProduct.colorVariations?.flatMap((cv: any) => cv.images || []) || [];
    const mainImageUrl = allViews[0]?.url || apiProduct.imageUrl;

    const result = {
      id: apiProduct.id,
      name: apiProduct.name,
      description: apiProduct.description || '',
      price: apiProduct.price || 0,
      stock: apiProduct.stock || 0,
      status: apiProduct.status || 'DRAFT',
      featured: apiProduct.featured || false,
      imageUrl: mainImageUrl,
      designId: apiProduct.designId,
      design: apiProduct.design,
      designImageUrl: apiProduct.designImageUrl,
      designName: apiProduct.designName,
      designDescription: apiProduct.designDescription,
      deletedAt: apiProduct.deletedAt,
      createdAt: apiProduct.createdAt,
      updatedAt: apiProduct.updatedAt,

      // Pour la compatibilité avec le schéma Zod
      categoryId: category?.id || 0,
      category: category,
      views: allViews,
      colors: apiProduct.colorVariations?.map((c: any) => ({ id: c.id, name: c.name, colorCode: c.colorCode })) || [],
      
      sizes: (apiProduct.sizes || []).map((s: any) => ({
        id: s.id,
        sizeName: s.sizeName,
        name: s.sizeName, // Pour Zod
      })),
      
      // Pour la nouvelle interface `Product`
      colorVariations: apiProduct.colorVariations?.map((cv: any) => ({
        id: cv.id,
        name: cv.name,
        colorCode: cv.colorCode,
        images: cv.images || []
      })) || []
    };

    return result as Product;
  }

  static async updateSellerProduct(id: number, data: any): Promise<ServiceResponse<Product>> {
    try {
      const response = await safeApiCall(`/vendor/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (response.success && response.data) {
        return { success: true, data: this.transformProduct(response.data) };
      }
      throw new Error('Erreur lors de la mise à jour vendeur');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  // Nouvelle méthode pour uploader immédiatement les images de couleurs
  static async uploadColorImage(productId: number, colorId: number, file: File): Promise<ServiceResponse<{ url: string; fileId: string; image: any }>> {
    try {
      console.log('🔄 [ProductService] Upload immédiat image couleur...');
      console.log('🔍 [DEBUG] Fichier:', file.name, 'Taille:', file.size, 'Type:', file.type);
      console.log('🔍 [DEBUG] ProductId:', productId, 'ColorId:', colorId);
      
      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Appel API pour upload immédiat selon la documentation
      const response = await fetch(`${API_BASE}/products/upload-color-image/${productId}/${colorId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP ${response.status}`);
      }
      
      if (data.success && data.image) {
        console.log('✅ [ProductService] Image couleur uploadée immédiatement');
        return {
          success: true,
          data: {
            url: data.image.url,
            fileId: `color_${colorId}_${Date.now()}`,
            image: data.image
          },
          message: 'Image couleur uploadée avec succès'
        };
      } else {
        throw new Error(data.message || 'Erreur lors de l\'upload de l\'image');
      }
      
    } catch (error) {
      console.error('❌ [ProductService] Erreur upload image couleur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image'
      };
    }
  }
} 
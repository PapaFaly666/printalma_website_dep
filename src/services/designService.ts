import { 
  DesignUploadResponse, 
  DesignDeleteResponse, 
  DesignStats, 
  BlankProductsResponse,
  DesignUploadOptions,
  ProductFormData 
} from '../types/product';
import { designCategoryService } from './designCategoryService';

// Types pour la création de produits avec designs
interface ProductCreationData {
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'DRAFT' | 'PUBLISHED';
  categories: string[];
  sizes: string[];
  colorVariations: {
    name: string;
    colorCode: string;
    images: {
      view: string;
      fileId: string;
    }[];
  }[];
}

interface DesignFileInfo {
  colorName: string;
  view: string;
  file: File;
  name: string;
}

// ===================== NEW GENERIC DESIGN ENDPOINTS =====================

// --- Types basiques pour la gestion des designs (à placer idéalement dans src/types/design.ts) ---
export interface Design {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  isDraft?: boolean;
  isPending?: boolean;
  isValidated?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  usageCount?: number;
  earnings?: number;
  views?: number;
  likes?: number;
}

export type DesignList = Design[];

export interface DesignFilters {
  page?: number;
  limit?: number;
  category?: 'logo' | 'pattern' | 'illustration' | 'typography' | 'abstract';
  status?: 'published' | 'pending' | 'draft' | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'views' | 'likes' | 'earnings';
  sortOrder?: 'asc' | 'desc';
}

export interface DesignPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface DesignStatsOverview {
  total: number;
  published: number;
  pending: number;
  draft: number;
  totalEarnings: number;
  totalViews: number;
  totalLikes: number;
}

export interface DesignListResponse {
  designs: Design[];
  pagination: DesignPagination;
  stats: DesignStatsOverview;
}

class DesignService {
  private apiUrl: string;
  private readonly useMockBackend: boolean;

  // 🆕 Mapping des catégories selon pub.md
  private readonly CATEGORY_MAPPING = {
    'Mangas': 5,
    'ILLUSTRATION': 1,
    'LOGO': 2,
    'PATTERN': 3,
    'TYPOGRAPHY': 4,
    'ABSTRACT': 6
  };

  // 🆕 Fonction helper pour mapper nom de catégorie vers ID
  private getCategoryId(categoryName: string): number {
    const id = this.CATEGORY_MAPPING[categoryName as keyof typeof this.CATEGORY_MAPPING];
    if (!id) {
      console.warn(`⚠️ Catégorie "${categoryName}" inconnue, utilisation de ID=1`);
      return 1; // Fallback vers première catégorie
    }
    console.log(`🏷️ ${categoryName} → ID ${id}`);
    return id;
  };

  /** Convertir categoryId en nom de catégorie */
  private async getCategoryNameById(categoryId: number): Promise<string> {
    try {
      const categories = await designCategoryService.getActiveCategories();
      const category = categories.find(cat => cat.id === categoryId);
      return category ? category.name : 'Other';
    } catch (error) {
      console.warn('Impossible de récupérer le nom de la catégorie, utilisation par défaut:', error);
      return 'Other';
    }
  }

  // 🆕 Base des endpoints design côté vendeur
  // Selon VendorPublishController (@Controller('vendor'))
  // Tous les appels du front (création, listing, update, delete) doivent cibler /vendor/designs
  private vendorDesignBase: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
    // Active le mode mock si la variable d'environnement est fixée ou si l'API n'est pas disponible
    this.useMockBackend = import.meta.env.VITE_USE_MOCKS === 'true';

    // 🆕 Base des endpoints design côté vendeur
    // Selon VendorPublishController (@Controller('vendor'))
    // Tous les appels du front (création, listing, update, delete) doivent cibler /vendor/designs
    this.vendorDesignBase = `${this.apiUrl}/vendor/designs`;
  }

  // Supprimé - Utilise uniquement l'authentification par cookies

  private getAuthHeaders(extra: Record<string,string> = {}): Record<string, string> {
    console.log('🍪 Utilisation de l\'authentification par cookies');
    return { ...extra };
  }

  /**
   * 🎨 NOUVELLE MÉTHODE : Créer un produit avec designs (Approche séparée recommandée)
   */
  async createProductWithDesigns(
    productData: ProductCreationData,
    productImages: File[],
    designFiles: DesignFileInfo[]
  ): Promise<ProductFormData> {
    try {
      console.log('🔄 Étape 1: Création du produit de base...');
      
      // Étape 1: Créer le produit de base
      const product = await this.createBaseProduct(productData, productImages);
      console.log('✅ Produit créé avec ID:', product.id);

      // Étape 2: Mapper les designs aux images créées
      console.log('🔄 Étape 2: Mappage des designs...');
      const mappedDesigns = this.mapDesignsToImages(designFiles, product);
      console.log(`📎 ${mappedDesigns.length} designs à uploader`);

      // Étape 3: Uploader les designs
      if (mappedDesigns.length > 0) {
        console.log('🔄 Étape 3: Upload des designs...');
        await this.uploadDesignsToProduct(product, mappedDesigns);
        console.log('✅ Tous les designs uploadés');
      }

      // Étape 4: Récupérer le produit final avec designs
      console.log('🔄 Étape 4: Récupération du produit final...');
      const finalProduct = await this.getProductById(product.id!);
      
      console.log('🎉 Produit avec designs créé avec succès!');
      return finalProduct;

    } catch (error: any) {
      console.error('❌ Erreur création produit avec designs:', error);
      throw new Error(`Erreur création produit: ${error.message}`);
    }
  }

  /**
   * Créer le produit de base sans designs
   */
  private async createBaseProduct(
    productData: ProductCreationData,
    productImages: File[]
  ): Promise<ProductFormData> {
    const formData = new FormData();
    
    // Ajouter les données du produit
    formData.append('productData', JSON.stringify({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      status: productData.status,
      categories: productData.categories,
      sizes: productData.sizes,
      colorVariations: productData.colorVariations
    }));

    // Ajouter les images de base (sans design)
    productImages.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    try {
      const response = await fetch(`${this.apiUrl}/products`, {
        method: 'POST',
        body: formData,
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
      
    } catch (error: any) {
      console.error('Erreur création produit de base:', error);
      throw error;
    }
  }

  /**
   * Mapper les designs aux images créées
   */
  private mapDesignsToImages(
    designFiles: DesignFileInfo[],
    product: ProductFormData
  ): Array<{
    colorId: string;
    imageId: string;
    file: File;
    name: string;
  }> {
    const mappedDesigns: Array<{
      colorId: string;
      imageId: string;
      file: File;
      name: string;
    }> = [];

    designFiles.forEach(designFile => {
      // Trouver la couleur correspondante
      const colorVariation = product.colorVariations.find(
        color => color.name === designFile.colorName
      );

      if (colorVariation) {
        // Trouver l'image correspondante
        const image = colorVariation.images.find(
          img => img.view === designFile.view
        );

        if (image) {
          mappedDesigns.push({
            colorId: colorVariation.id,
            imageId: image.id,
            file: designFile.file,
            name: designFile.name
          });
        } else {
          console.warn(`⚠️ Image non trouvée pour ${designFile.colorName} - ${designFile.view}`);
        }
      } else {
        console.warn(`⚠️ Couleur non trouvée: ${designFile.colorName}`);
      }
    });

    return mappedDesigns;
  }

  /**
   * Uploader tous les designs sur le produit
   */
  private async uploadDesignsToProduct(
    product: ProductFormData,
    mappedDesigns: Array<{
      colorId: string;
      imageId: string;
      file: File;
      name: string;
    }>
  ): Promise<DesignUploadResponse[]> {
    const uploadPromises = mappedDesigns.map(designInfo => 
      this.uploadDesign(
        product.id!,
        designInfo.colorId,
        designInfo.imageId,
        designInfo.file,
        {
          name: designInfo.name,
          replaceExisting: true
        }
      )
    );

    try {
      // Uploader tous les designs en parallèle
      const results = await Promise.all(uploadPromises);
      console.log('Tous les designs uploadés:', results.length);
      return results;
    } catch (error) {
      console.error('Erreur upload designs:', error);
      throw error;
    }
  }

  /**
   * Récupérer un produit par son ID
   */
  private async getProductById(productId: number | string): Promise<ProductFormData> {
    try {
      const response = await fetch(`${this.apiUrl}/products/${productId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération produit:', error);
      throw error;
    }
  }

  /**
   * Valider les données du produit côté client
   */
  validateProductData(data: ProductCreationData): string[] {
    const errors: string[] = [];
    
    if (!data.name?.trim()) errors.push('Nom du produit requis');
    if (!data.description?.trim()) errors.push('Description requise');
    if (!data.price || data.price <= 0) errors.push('Prix invalide');
    if (!data.stock || data.stock < 0) errors.push('Stock invalide');
    if (!data.colorVariations?.length) errors.push('Au moins une couleur requise');
    if (!data.categories?.length) errors.push('Au moins une catégorie requise');
    if (!data.sizes?.length) errors.push('Au moins une taille requise');
    
    return errors;
  }

  /**
   * Valider les fichiers de design
   */
  validateDesignFiles(designFiles: DesignFileInfo[]): string[] {
    const errors: string[] = [];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    designFiles.forEach((designFile, index) => {
      if (!allowedTypes.includes(designFile.file.type)) {
        errors.push(`Design ${index + 1}: Format non supporté (${designFile.file.type})`);
      }
      
      if (designFile.file.size > maxSize) {
        errors.push(`Design ${index + 1}: Fichier trop volumineux (${(designFile.file.size / 1024 / 1024).toFixed(1)}MB > 10MB)`);
      }
      
      if (!designFile.name?.trim()) {
        errors.push(`Design ${index + 1}: Nom requis`);
      }
    });

    return errors;
  }

  /**
   * Upload un design sur une image spécifique
   * TEMPORAIRE: Simule l'upload en attendant l'implémentation backend
   */
  async uploadDesign(
    productId: number | string,
    colorId: number | string,
    imageId: number | string,
    designFile: File,
    options: DesignUploadOptions = {}
  ): Promise<DesignUploadResponse> {
    // Validation côté client
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(designFile.type)) {
      throw new Error('Format de fichier non supporté. Utilisez PNG, JPG ou SVG.');
    }

    if (designFile.size > maxSize) {
      throw new Error('Fichier trop volumineux (max 10MB).');
    }

    const formData = new FormData();
    formData.append('design', designFile);
    
    // Options facultatives
    if (options.name) formData.append('name', options.name);
    if (options.replaceExisting !== undefined) {
      formData.append('replaceExisting', options.replaceExisting.toString());
    }

    try {
      // Essayer d'abord l'endpoint réel
      const response = await fetch(
        `${this.apiUrl}/api/products/${productId}/colors/${colorId}/images/${imageId}/design`,
        {
          method: 'POST',
          body: formData,
          headers: this.getAuthHeaders()
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result;
      }

      // Si l'endpoint n'existe pas (404), simuler l'upload
      if (response.status === 404) {
        console.warn('⚠️ Endpoint de design non implémenté sur le backend, simulation de l\'upload...');
        
        // Simuler un délai d'upload
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Simuler une réponse d'upload réussie
        const mockResponse: DesignUploadResponse = {
          success: true,
          designUrl: `https://res.cloudinary.com/dsxab4qnu/image/upload/v${Date.now()}/designs/${designFile.name}`,
          designFileName: designFile.name,
          message: `Design "${designFile.name}" uploadé avec succès (simulation)`
        };
        
        return mockResponse;
      }

      // Autres erreurs
      const result = await response.json();
      throw new Error(this.handleApiError(result, response));
      
    } catch (error: any) {
      // Si c'est une erreur de réseau (backend non accessible)
      if (error.message?.includes('fetch')) {
        console.warn('⚠️ Backend non accessible, simulation de l\'upload...');
        
        // Simuler un délai d'upload
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const mockResponse: DesignUploadResponse = {
          success: true,
          designUrl: `https://res.cloudinary.com/dsxab4qnu/image/upload/v${Date.now()}/designs/${designFile.name}`,
          designFileName: designFile.name,
          message: `Design "${designFile.name}" uploadé avec succès (simulation)`
        };
        
        return mockResponse;
      }
      
      console.error('Erreur upload design:', error);
      throw error;
    }
  }

  /**
   * Supprime un design d'une image
   * TEMPORAIRE: Simule la suppression en attendant l'implémentation backend
   */
  async deleteDesignFromImage(
    productId: number | string,
    colorId: number | string,
    imageId: number | string
  ): Promise<DesignDeleteResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/products/${productId}/colors/${colorId}/images/${imageId}/design`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result;
      }

      // Si l'endpoint n'existe pas, simuler la suppression
      if (response.status === 404) {
        console.warn('⚠️ Endpoint de suppression design non implémenté, simulation...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          success: true,
          message: 'Design supprimé avec succès (simulation)'
        };
      }

      const result = await response.json();
      throw new Error(this.handleApiError(result, response));
      
    } catch (error: any) {
      if (error.message?.includes('fetch')) {
        console.warn('⚠️ Backend non accessible, simulation de la suppression...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          success: true,
          message: 'Design supprimé avec succès (simulation)'
        };
      }
      
      console.error('Erreur suppression design:', error);
      throw error;
    }
  }

  /**
   * Récupère les produits vierges (sans design)
   * TEMPORAIRE: Utilise l'endpoint /products existant et filtre côté client
   */
  async getBlankProducts(filters: {
    status?: 'all' | 'published' | 'draft';
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<BlankProductsResponse> {
    try {
      // Utiliser l'endpoint existant /products
      const response = await fetch(
        `${this.apiUrl}/products`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allProducts = await response.json();
      
      // Filtrer côté client pour obtenir les produits vierges
      let blankProducts = allProducts.filter((product: any) => {
        // Un produit est vierge s'il n'a aucun design sur ses images
        const hasDesign = product.colorVariations?.some((color: any) => 
          color.images?.some((image: any) => image.designUrl)
        );
        return !hasDesign;
      });

      // Appliquer les filtres
      if (filters.status && filters.status !== 'all') {
        const statusFilter = filters.status === 'published' ? 'PUBLISHED' : 'DRAFT';
        blankProducts = blankProducts.filter((product: any) => product.status === statusFilter);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        blankProducts = blankProducts.filter((product: any) => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        );
      }

      // Pagination côté client
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;
      const paginatedProducts = blankProducts.slice(offset, offset + limit);

      return {
        success: true,
        data: paginatedProducts,
        pagination: {
          total: blankProducts.length,
          limit,
          offset,
          hasNext: offset + limit < blankProducts.length
        }
      };
      
    } catch (error) {
      console.error('Erreur récupération produits vierges:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des designs
   * TEMPORAIRE: Calcule les stats à partir de l'endpoint /products existant
   */
  async getDesignStats(): Promise<DesignStats> {
    try {
      const response = await fetch(
        `${this.apiUrl}/products`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      
      // Calculer les statistiques côté client
      let totalDesigns = 0;
      let productsWithDesign = 0;

      products.forEach((product: any) => {
        let productHasDesign = false;
        let productDesignCount = 0;

        product.colorVariations?.forEach((color: any) => {
          color.images?.forEach((image: any) => {
            if (image.designUrl) {
              productHasDesign = true;
              productDesignCount++;
              totalDesigns++;
            }
          });
        });

        if (productHasDesign) {
          productsWithDesign++;
        }
      });

      const totalProducts = products.length;
      const blankProducts = totalProducts - productsWithDesign;
      const designPercentage = totalProducts > 0 ? (productsWithDesign / totalProducts) * 100 : 0;
      const averageDesignsPerProduct = totalProducts > 0 ? totalDesigns / totalProducts : 0;

      return {
        totalProducts,
        productsWithDesign,
        blankProducts,
        designPercentage,
        totalDesigns,
        averageDesignsPerProduct
      };
      
    } catch (error) {
      console.error('Erreur récupération stats design:', error);
      throw error;
    }
  }

  /**
   * Gère les erreurs API selon les codes de statut
   */
  private handleApiError(result: any, response: Response): string {
    switch (response.status) {
      case 400:
        return result.message || 'Fichier invalide ou format non supporté';
      case 404:
        return 'Produit ou image non trouvé';
      case 413:
        return 'Fichier trop volumineux (max 10MB)';
      case 500:
        return 'Erreur serveur lors du traitement du design';
      default:
        return result.message || 'Une erreur inattendue s\'est produite';
    }
  }

  /**
   * Précharge les images de design pour une meilleure UX
   */
  preloadDesignImages(products: any[]): void {
    products.forEach(product => {
      if (product.colorVariations) {
        product.colorVariations.forEach((color: any) => {
          if (color.images) {
            color.images.forEach((image: any) => {
              if (image.designUrl) {
                const img = new Image();
                img.src = image.designUrl;
              }
            });
          }
        });
      }
    });
  }

  /**
   * Valide un fichier de design côté client
   */
  validateDesignFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Format non supporté. Utilisez PNG, JPG ou SVG.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Fichier trop volumineux (max 10MB).'
      };
    }

    return { valid: true };
  }

  /**
   * Récupérer la liste des designs du vendeur
   */
  async getDesigns(filters: DesignFilters = {}): Promise<DesignListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.page) params.append('offset', String(((filters.page - 1) * (filters.limit || 10))));
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const endpoint = `${this.apiUrl}/api/designs${params.toString() ? `?${params.toString()}` : ''}`;

      const headers = this.getAuthHeaders();

      const res = await fetch(endpoint, {
        credentials: 'include',
        headers
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const raw = await res.json();
      const payload = raw.data || raw;

      const items: any[] = payload.items || payload.designs || [];

      const designs: Design[] = items.map((d: any) => ({
        id: d.id ?? d.designId ?? d._id,
        name: d.name || d.vendorName || 'Design',
        description: d.description,
        price: d.price ?? 0,
        imageUrl: d.imageUrl || d.designUrl,
        thumbnailUrl: d.thumbnailUrl || d.designUrl || d.imageUrl,
        category: d.category || 'logo',
        tags: d.tags || [],
        isPublished: d.status === 'PUBLISHED' || d.isPublished,
        isDraft: d.status === 'DRAFT' || d.isDraft,
        isPending: d.status === 'PENDING' || d.isPending,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));

      // --- Filtrage côté client supplémentaire (category, search, tri) ---
      let filteredDesigns = designs;

      if (filters.category) {
        filteredDesigns = filteredDesigns.filter(d => d.category === filters.category);
      }

      if (filters.search) {
        const term = filters.search.toLowerCase();
        filteredDesigns = filteredDesigns.filter(d => d.name.toLowerCase().includes(term) || (d.description?.toLowerCase().includes(term)));
      }

      // Tri simple (createdAt ou price)
      if (filters.sortBy) {
        const dir = filters.sortOrder === 'desc' ? -1 : 1;
        filteredDesigns.sort((a, b) => {
          const av = filters.sortBy === 'price' ? a.price : new Date(a.createdAt || 0).getTime();
          const bv = filters.sortBy === 'price' ? b.price : new Date(b.createdAt || 0).getTime();
          return av > bv ? dir : -dir;
        });
      }

      // Pagination client si backend ne l'a pas faite
      const page = filters.page || 1;
      const limit = filters.limit || filteredDesigns.length || 10;
      const startIdx = (page - 1) * limit;
      const paginated = filteredDesigns.slice(startIdx, startIdx + limit);

      const response: DesignListResponse = {
        designs: paginated,
        pagination: payload.pagination || {
          currentPage: page,
          totalPages: Math.ceil(filteredDesigns.length / limit),
          totalItems: filteredDesigns.length,
          itemsPerPage: limit,
        },
        stats: payload.stats || {
          total: filteredDesigns.length,
          published: filteredDesigns.filter(d => d.isPublished).length,
          pending: filteredDesigns.filter(d => d.isPending).length,
          draft: filteredDesigns.filter(d => d.isDraft).length,
          totalEarnings: 0,
          totalViews: 0,
          totalLikes: 0,
        },
      };

      console.log('✅ Designs récupérés via /api/designs');
      return response;
 
    } catch (error: any) {
      console.error('❌ Erreur récupération designs via /api/designs:', error);
      // Fallback legacy
      return this.getDesignsLegacy(filters);
    }
  }
  
  // Méthode legacy pour compatibilité
  private async getDesignsLegacy(filters: DesignFilters = {}): Promise<DesignListResponse> {
    const qs = new URLSearchParams(filters as any).toString();
    const candidateUrls = [
      `${this.apiUrl}/vendor/designs${qs ? `?${qs}` : ''}`,
      `${this.apiUrl}/api/designs/vendor/by-status?status=ALL${qs ? `&${qs}` : ''}`
    ];

    const headers = this.getAuthHeaders();

    let res: Response | null = null;
    for (const url of candidateUrls) {
      try {
        res = await fetch(url, {
          credentials: 'include',
          headers
        });
        if (res.ok) {
          break; // on sort si succès
        }
        if (res.status !== 404) {
          // Autre erreur → inutile de tester l'URL suivante
          break;
        }
      } catch {
        // Ignore puis essaie l'URL suivante
      }
    }

    if (!res || !res.ok) {
      throw new Error(`Erreur ${(res && res.status) || 'réseau'}`);
    }

    const data = await res.json();

    // Attendu : { success, data: { designs, pagination, stats } }
    const payload = data.data ?? data;

    const response: DesignListResponse = {
      designs: payload.designs ?? [],
      pagination: payload.pagination ?? {
        currentPage: filters.page ?? 1,
        totalPages: 1,
        totalItems: (payload.designs ?? []).length,
        itemsPerPage: filters.limit ?? (payload.designs ?? []).length
      },
      stats: payload.stats ?? {
        total: (payload.designs ?? []).length,
        published: 0,
        pending: 0,
        draft: 0,
        totalEarnings: 0,
        totalViews: 0,
        totalLikes: 0
      }
    };

    return response;
  }

  /**
   * Convertit un fichier image en Data URL (data:image/png;base64,...) attendu par l'API.
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /** Créer un design - essaie /api/designs puis fallback vers /vendor/designs */
  async createDesign(payload: {
    file: File;
    name: string;
    description?: string;
    price: number;
    categoryId?: number;
    category?: string; // Support des deux formats pour compatibilité
    tags?: string;
  }): Promise<Design> {
    try {
      console.log('🎨 === DÉBUT CRÉATION DESIGN ===');
      console.log('🎨 Création du design avec prix:', payload.price);
      console.log('🍪 Utilisation de l\'authentification par cookies');
      console.log('📋 Payload initial:', {
        hasFile: !!payload.file,
        name: payload.name,
        price: payload.price,
        categoryId: payload.categoryId,
        category: payload.category,
        typeCategoryId: typeof payload.categoryId,
        typeCategory: typeof payload.category
      });

      // 🏷️ RÉSOLUTION CATEGORYID: Convertir category string → categoryId si nécessaire
      let finalCategoryId: number;
      if (payload.categoryId) {
        finalCategoryId = payload.categoryId;
        console.log(`✅ Utilisation categoryId fourni: ${finalCategoryId}`);
      } else if (payload.category) {
        finalCategoryId = this.getCategoryId(payload.category);
        console.log(`🔄 Conversion category "${payload.category}" → categoryId ${finalCategoryId}`);
      } else {
        console.error('❌ Ni categoryId ni category fournis!');
        throw new Error('categoryId ou category requis');
      }

      const finalPayload = {
        ...payload,
        categoryId: finalCategoryId
      };

      console.log('📋 Payload final:', {
        name: finalPayload.name,
        price: finalPayload.price,
        categoryId: finalPayload.categoryId,
        typeCategoryId: typeof finalPayload.categoryId,
        isValidCategoryId: finalPayload.categoryId > 0 && Number.isInteger(finalPayload.categoryId)
      });

      // ✅ VALIDATION
      this.validateDesignData(finalPayload);

      // 🚀 TENTATIVE 1: Essayer /api/designs (selon designaide.md)
      try {
        return await this.createDesignViaApiDesigns(finalPayload);
      } catch (apiError: any) {
        console.warn('⚠️ Échec /api/designs:', apiError.message);
        console.log('🔄 Fallback vers /vendor/designs...');
      }

      // 🔄 FALLBACK: Utiliser /vendor/designs
      return await this.createDesignViaVendorDesigns(finalPayload);

    } catch (error: any) {
      console.error('❌ Erreur création design (toutes méthodes échouées):', error);
      throw error;
    }
  }

  /** Méthode 1: Créer via /api/designs avec FormData */
  private async createDesignViaApiDesigns(payload: {
    file: File;
    name: string;
    description?: string;
    price: number;
    categoryId: number;
    tags?: string;
  }): Promise<Design> {
    console.log('🔬 Tentative création via /api/designs avec FormData...');

    // ✅ VALIDATION CRITIQUE du categoryId avant envoi
    if (!payload.categoryId || payload.categoryId <= 0 || !Number.isInteger(payload.categoryId)) {
      const error = `❌ categoryId invalide: ${payload.categoryId} (type: ${typeof payload.categoryId})`;
      console.error(error);
      throw new Error(`CategoryId doit être un nombre entier > 0. Reçu: ${payload.categoryId}`);
    }

    const formData = new FormData();
    formData.append('file', payload.file);  // ✅ CORRECTION: Champ renommé pour correspondre au backend
    formData.append('name', payload.name);
    formData.append('description', payload.description || '');
    formData.append('price', payload.price.toString()); // 💰 PRIX EN STRING
    formData.append('categoryId', payload.categoryId.toString()); // ✅ UTILISER L'ID DE CATÉGORIE NUMÉRIQUE

    if (payload.tags) {
      formData.append('tags', payload.tags);
    }

    console.log('📝 FormData préparée avec validation:');
    console.log('  - file:', payload.file.name);
    console.log('  - name:', payload.name);
    console.log('  - price:', payload.price);
    console.log('  - categoryId:', payload.categoryId, '(type:', typeof payload.categoryId, ')');
    console.log('  - categoryId valid:', payload.categoryId > 0 && Number.isInteger(payload.categoryId));
    console.log('  - tags:', payload.tags || 'aucun');

    const res = await fetch(`${this.apiUrl}/api/designs`, {
      method: 'POST',
      credentials: 'include',
      body: formData  // Pas de Content-Type header avec FormData
    });

    console.log('📡 Réponse /api/designs:', res.status, res.statusText);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('❌ Erreur /api/designs:', errText);
      throw new Error(`API designs error: ${res.status} - ${errText}`);
    }

    const json = await res.json();
    console.log('📦 Réponse /api/designs:', json);

    const data = json.data || json;
    const design: Design = {
      id: data.designId || data.id,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      imageUrl: data.designUrl || data.imageUrl,
      thumbnailUrl: data.designUrl || data.imageUrl,
      category: await this.getCategoryNameById(payload.categoryId), // Convertir ID en nom
      tags: payload.tags ? payload.tags.split(',').map(t => t.trim()) : [],
      isPublished: true,
      isDraft: false,
      isPending: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      earnings: 0,
      views: 0,
      likes: 0
    };

    console.log('✅ Design créé avec succès via /api/designs !');
    console.log('💰 Prix du design:', design.price);
    return design;
  }

  /** Méthode 2: Créer via /vendor/designs avec JSON */
  private async createDesignViaVendorDesigns(payload: {
    file: File;
    name: string;
    description?: string;
    price: number;
    categoryId: number;
    tags?: string;
  }): Promise<Design> {
    console.log('🔬 Tentative création via /vendor/designs avec JSON...');

    // 📤 LOGS DEBUG PRIX (selon designprice.md)
    console.log('📤 Données envoyées au backend:', {
      name: payload.name,
      price: payload.price,
      category: payload.categoryId,
      typePrice: typeof payload.price,
      isValidPrice: payload.price >= 100 && payload.price <= 1000000
    });

    // Convertir le fichier en base64
    const imageBase64 = await this.fileToDataUrl(payload.file);

    // Convertir categoryId en nom de catégorie
    const categoryName = await this.getCategoryNameById(payload.categoryId);
    console.log(`🏷️ Conversion categoryId ${payload.categoryId} -> "${categoryName}"`);

    const designPayload = {
      name: payload.name,
      description: payload.description,
      price: payload.price, // 🔧 PRIX INCLUS
      category: categoryName, // ✅ UTILISER LE NOM DE CATÉGORIE
      imageBase64,
      tags: payload.tags ? payload.tags.split(',').map(t => t.trim()) : [],
    };

    // 📤 LOGS DÉTAILLÉS PAYLOAD (selon designprice.md)
    console.log('📤 Payload complet envoyé:', {
      name: designPayload.name,
      price: designPayload.price,
      priceType: typeof designPayload.price,
      category: designPayload.category,
      hasImageBase64: !!designPayload.imageBase64,
      imageBase64Size: designPayload.imageBase64.length,
      tags: designPayload.tags
    });

    const res = await fetch(this.vendorDesignBase, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(designPayload),
    });

    console.log('📡 Réponse /vendor/designs:', res.status, res.statusText);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('❌ Erreur /vendor/designs:', errJson);
      throw new Error(errJson.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    console.log('📥 Réponse backend:', json);
    const data = json.data || json;

    const design: Design = {
      id: data.designId || data.id,
      name: payload.name,
      description: payload.description,
      price: payload.price, // Forcer le prix côté frontend
      imageUrl: data.designUrl,
      thumbnailUrl: data.designUrl,
      category: await this.getCategoryNameById(payload.categoryId), // Convertir ID en nom
      tags: payload.tags ? payload.tags.split(',').map(t => t.trim()) : [],
      isPublished: true,
      isDraft: false,
      isPending: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      earnings: 0,
      views: 0,
      likes: 0
    };

    console.log('✅ Design créé via /vendor/designs !');
    console.log('💰 Prix préservé côté frontend:', design.price);

    // 🔍 VÉRIFICATION EN BASE (selon designprice.md)
    if (data.designId) {
      try {
        const verification = await fetch(`${this.apiUrl}/api/designs/${data.designId}`, {
          headers: { ...this.getAuthHeaders() },
          credentials: 'include'
        });

        if (verification.ok) {
          const designEnBase = await verification.json();
          console.log('🔍 Design en base:', {
            id: designEnBase.id || designEnBase.designId,
            price: designEnBase.price,
            prixOk: designEnBase.price === payload.price,
            prixEnvoye: payload.price,
            prixSauve: designEnBase.price
          });

          if (designEnBase.price !== payload.price) {
            console.error('❌ FAIL: Prix incorrect en base:', {
              envoyé: payload.price,
              sauvé: designEnBase.price
            });
          } else {
            console.log('🎉 SUCCESS: Prix correctement sauvé en base !');
          }
        }
      } catch (verifyError) {
        console.warn('⚠️ Impossible de vérifier le prix en base:', verifyError);
      }
    }

    console.log('⚠️ Attention: Le backend peut avoir mis le prix à 0 en base');
    return design;
  }

  // ✅ VALIDATION selon designprice.md + designaide.md
  private validateDesignData(payload: {
    file: File;
    name: string;
    description?: string;
    price: number;
    categoryId: number;
    tags?: string;
  }): void {
    const errors: string[] = [];

    // Validation du fichier
    if (!payload.file) {
      errors.push('Fichier image requis');
    } else {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(payload.file.type)) {
        errors.push('Format de fichier non supporté');
      }

      if (payload.file.size > 10 * 1024 * 1024) { // 10MB
        errors.push('Fichier trop volumineux (max 10MB)');
      }
    }

    // Validation du nom
    if (!payload.name || payload.name.trim().length < 3) {
      errors.push('Nom du design requis (min 3 caractères)');
    }

    if (payload.name.trim().length > 255) {
      errors.push('Nom du design trop long (max 255 caractères)');
    }

    // 💰 VALIDATION PRIX CRITIQUE (selon designprice.md)
    if (!payload.price || payload.price <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }

    if (payload.price < 100) {
      errors.push('Prix minimum : 100 FCFA');
    }

    if (payload.price > 1000000) {
      errors.push('Prix maximum : 1,000,000 FCFA');
    }

    // Validation des formats de prix supportés
    if (typeof payload.price !== 'number' || isNaN(payload.price)) {
      errors.push('Le prix doit être un nombre valide');
    }

    // Validation catégorie
    if (!payload.categoryId || typeof payload.categoryId !== 'number' || payload.categoryId <= 0) {
      errors.push('ID de catégorie invalide');
    }

    // Validation description
    if (payload.description && payload.description.length > 1000) {
      errors.push('Description trop longue (max 1000 caractères)');
    }

    // 📤 LOG VALIDATION PRIX (selon designprice.md)
    console.log('💰 Validation prix design:', {
      prixEnvoyé: payload.price,
      typePrice: typeof payload.price,
      isValid: payload.price >= 100 && payload.price <= 1000000
    });

    if (errors.length > 0) {
      console.error('❌ Erreurs validation:', errors);
      throw new Error(errors.join(', '));
    }
  }


  /** Modifier un design via la nouvelle API VendorDesignProduct */
  async updateDesign(id: number | string, updates: Partial<Omit<Design, 'id'>>): Promise<Design> {
    try {
      // Utiliser la nouvelle API VendorDesignProduct
      const { vendorDesignProductAPI } = await import('./vendorDesignProductAPI');
      const { VendorDesignProductStatus } = await import('../types/vendorDesignProduct');
      
      // Mapper les updates vers le format VendorDesignProduct
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      
      // Mapper le statut si présent
      if (updates.isPublished !== undefined) {
        updateData.status = updates.isPublished ? VendorDesignProductStatus.PUBLISHED : VendorDesignProductStatus.DRAFT;
      } else if (updates.isDraft !== undefined) {
        updateData.status = updates.isDraft ? VendorDesignProductStatus.DRAFT : VendorDesignProductStatus.PUBLISHED;
      } else if (updates.isPending !== undefined) {
        updateData.status = updates.isPending ? VendorDesignProductStatus.PENDING_VALIDATION : VendorDesignProductStatus.DRAFT;
      }
      
      // Mettre à jour le design-produit
      const designProduct = await vendorDesignProductAPI.updateDesignProduct(Number(id), updateData);
      
      // Convertir la réponse vers le format Design
      const design: Design = {
        id: designProduct.id,
        name: designProduct.name || 'Design sans nom',
        description: designProduct.description,
        price: 0, // Prix non disponible dans VendorDesignProduct
        imageUrl: designProduct.designUrl,
        thumbnailUrl: designProduct.designUrl,
        category: 'logo', // Catégorie par défaut
        tags: [],
        isPublished: designProduct.status === VendorDesignProductStatus.PUBLISHED,
        isDraft: designProduct.status === VendorDesignProductStatus.DRAFT,
        isPending: designProduct.status === VendorDesignProductStatus.PENDING_VALIDATION,
        createdAt: designProduct.createdAt,
        updatedAt: designProduct.updatedAt,
        usageCount: 0,
        earnings: 0,
        views: 0,
        likes: 0
      };
      
      console.log('✅ Design mis à jour via nouvelle API VendorDesignProduct');
      return design;
      
    } catch (error: any) {
      console.error('❌ Erreur mise à jour design via VendorDesignProduct:', error);
      
      // Fallback vers l'ancienne méthode en cas d'erreur
      return this.updateDesignLegacy(id, updates);
    }
  }
  
  // Méthode legacy pour updateDesign
  private async updateDesignLegacy(id: number | string, updates: Partial<Omit<Design, 'id'>>): Promise<Design> {
    const res = await fetch(`${this.vendorDesignBase}/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const json = await res.json();
    return json.data as Design;
  }

  /** Publier / dépublier via la nouvelle API VendorDesignProduct */
  async togglePublish(id: number | string, isPublished: boolean): Promise<Design> {
    try {
      // Utiliser la nouvelle API VendorDesignProduct
      const { vendorDesignProductAPI } = await import('./vendorDesignProductAPI');
      const { VendorDesignProductStatus } = await import('../types/vendorDesignProduct');
      
      // Déterminer le nouveau statut
      const newStatus = isPublished ? VendorDesignProductStatus.PUBLISHED : VendorDesignProductStatus.DRAFT;
      
      // Mettre à jour le statut
      const designProduct = await vendorDesignProductAPI.updateDesignProductStatus(Number(id), newStatus);
      
      // Convertir la réponse vers le format Design
      const design: Design = {
        id: designProduct.id,
        name: designProduct.name || 'Design sans nom',
        description: designProduct.description,
        price: 0, // Prix non disponible dans VendorDesignProduct
        imageUrl: designProduct.designUrl,
        thumbnailUrl: designProduct.designUrl,
        category: 'logo', // Catégorie par défaut
        tags: [],
        isPublished: designProduct.status === VendorDesignProductStatus.PUBLISHED,
        isDraft: designProduct.status === VendorDesignProductStatus.DRAFT,
        isPending: designProduct.status === VendorDesignProductStatus.PENDING_VALIDATION,
        createdAt: designProduct.createdAt,
        updatedAt: designProduct.updatedAt,
        usageCount: 0,
        earnings: 0,
        views: 0,
        likes: 0
      };
      
      console.log('✅ Statut de publication mis à jour via nouvelle API VendorDesignProduct');
      return design;
      
    } catch (error: any) {
      console.error('❌ Erreur changement publication via VendorDesignProduct:', error);
      
      // Fallback vers l'ancienne méthode en cas d'erreur
      return this.togglePublishLegacy(id, isPublished);
    }
  }
  
  // Méthode legacy pour togglePublish
  private async togglePublishLegacy(id: number | string, isPublished: boolean): Promise<Design> {
    const res = await fetch(`${this.vendorDesignBase}/${id}/publish`, {
      method: 'PATCH',
      credentials: 'include',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ isPublished })
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const json = await res.json();
    return json.data as Design;
  }

  /** Supprimer design et tous ses produits associés */
  async deleteDesign(id: number | string): Promise<{ 
    success: boolean; 
    deletedProductsCount: number;
    message: string;
  }> {
    try {
      // Dans cette architecture, nous allons d'abord essayer l'approche VendorDesignProduct
      const { vendorDesignProductAPI } = await import('./vendorDesignProductAPI');
      
      let deletedProductsCount = 0;
      
      try {
        // 1. Chercher et supprimer tous les VendorDesignProducts qui utilisent la même designUrl
        // C'est notre approche pour trouver les "produits associés" au design
        const allDesignProducts = await vendorDesignProductAPI.getDesignProducts();
        
        // Trouver d'abord le design principal pour obtenir son designUrl
        const mainDesignProduct = allDesignProducts.find(dp => dp.id === Number(id));
        
        if (mainDesignProduct) {
          // Trouver tous les autres produits qui utilisent le même design (même designUrl)
          const associatedProducts = allDesignProducts.filter(dp => 
            dp.designUrl === mainDesignProduct.designUrl && dp.id !== Number(id)
          );
          
          // Supprimer tous les produits associés (même designUrl)
          for (const product of associatedProducts) {
            await vendorDesignProductAPI.deleteDesignProduct(product.id);
            deletedProductsCount++;
          }
          
          console.log(`✅ ${deletedProductsCount} produit(s) associé(s) supprimé(s)`);
        }
      } catch (productsError: any) {
        console.warn('⚠️ Erreur lors de la suppression des produits associés:', productsError);
        // Continue quand même pour supprimer le design principal
      }
      
      // 2. Supprimer le design principal
      await vendorDesignProductAPI.deleteDesignProduct(Number(id));
      
      console.log('✅ Design supprimé via nouvelle API VendorDesignProduct');
      
      return {
        success: true,
        deletedProductsCount,
        message: deletedProductsCount > 0 
          ? `Design et ${deletedProductsCount} produit(s) associé(s) supprimé(s)`
          : 'Design supprimé avec succès'
      };
      
    } catch (error: any) {
      console.error('❌ Erreur suppression design via VendorDesignProduct:', error);
      
      // Fallback vers l'ancienne méthode en cas d'erreur
      try {
        await this.deleteDesignLegacy(id);
        return {
          success: true,
          deletedProductsCount: 0,
          message: 'Design supprimé avec succès (méthode legacy)'
        };
      } catch (legacyError: any) {
        console.error('❌ Échec complet de la suppression:', legacyError);
        throw new Error('Impossible de supprimer le design');
      }
    }
  }
  
  // Méthode legacy pour deleteDesign
  private async deleteDesignLegacy(id: number | string): Promise<void> {
    const res = await fetch(`${this.vendorDesignBase}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
  }

  // ========================================================================
  // NOUVELLES MÉTHODES DE VALIDATION SELON LA DOCUMENTATION
  // ========================================================================

  /**
   * Récupérer les designs en attente de validation (Admin uniquement)
   */
  async getPendingDesigns(filters: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'submittedAt' | 'createdAt' | 'price';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    designs: (Design & {
      vendor: { id: number; firstName: string; lastName: string; email: string; };
      submittedForValidationAt: string;
      associatedProducts: number;
    })[];
    pagination: DesignPagination;
    totalPending: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      // Nouveau endpoint v2 : /api/designs/admin/pending
      const candidateUrls = [
        `${this.apiUrl}/api/designs/admin/pending?${queryParams}`,
        `${this.apiUrl}/designs/admin/pending?${queryParams}` // rétro-compatibilité
      ];

      let res: Response | null = null;
      for (const url of candidateUrls) {
        res = await fetch(url, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
        if (res.ok || res.status !== 404) break;
      }

      if (res && res.ok) {
        const response = await res.json();
        const data = response.data || response;

        return {
          designs: data.designs || [],
          pagination: data.pagination || {
            currentPage: filters.page || 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: filters.limit || 10
          },
          totalPending: data.totalPending || (data.designs || []).length
        };
      }

      // Si l'endpoint n'existe pas, retourner des données mockées
      if (res && res.status === 404) {
        console.warn('⚠️ Endpoint designs/admin/pending non implémenté, retour de données mockées');
        return this.getMockPendingDesigns(filters);
      }

      if (res) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Erreur ${res.status}`);
      }
      throw new Error('Erreur inconnue');
    } catch (error: any) {
      console.error('❌ Erreur récupération designs en attente:', error);
      
      // Si erreur de réseau, retourner des données mockées
      if (error.message?.includes('fetch') || error.message?.includes('GET')) {
        console.warn('⚠️ Backend non accessible, retour de données mockées');
        return this.getMockPendingDesigns(filters);
      }
      
      throw new Error(`Erreur récupération designs: ${error.message}`);
    }
  }

  /**
   * Données mockées pour le développement
   */
  private getMockPendingDesigns(filters: any) {
    const mockDesigns = [
      {
        id: 1,
        name: 'Logo Corporate',
        description: 'Design professionnel pour entreprise',
        price: 25,
        category: 'logo',
        imageUrl: 'https://via.placeholder.com/300x300/4F46E5/white?text=Logo+1',
        thumbnailUrl: 'https://via.placeholder.com/150x150/4F46E5/white?text=Logo+1',
        submittedForValidationAt: new Date().toISOString(),
        associatedProducts: 3,
        vendor: {
          id: 1,
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com'
        }
      },
      {
        id: 2,
        name: 'Pattern Floral',
        description: 'Motif floral élégant',
        price: 20,
        category: 'pattern',
        imageUrl: 'https://via.placeholder.com/300x300/10B981/white?text=Pattern+1',
        thumbnailUrl: 'https://via.placeholder.com/150x150/10B981/white?text=Pattern+1',
        submittedForValidationAt: new Date(Date.now() - 86400000).toISOString(),
        associatedProducts: 1,
        vendor: {
          id: 2,
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@email.com'
        }
      }
    ];

    return {
      designs: mockDesigns,
      pagination: {
        currentPage: filters.page || 1,
        totalPages: 1,
        totalItems: mockDesigns.length,
        itemsPerPage: filters.limit || 10
      },
      totalPending: mockDesigns.length
    };
  }

  /**
   * Obtenir les statistiques de validation pour les admins – V2
   * Désormais calculées localement à partir de /api/designs/admin/all
   */
  async getValidationStats(): Promise<{
    totalDesigns: number;
    pendingValidation: number;
    validated: number;
    rejected: number;
    draft: number;
    avgValidationTime: number; // en heures – non disponible côté API, fixé à 0
    todaySubmissions: number;  // idem, calcul simplifié
  }> {
    if (this.useMockBackend) {
      return this.getMockValidationStats();
    }

    try {
      const all = await this.getAllDesigns({ status: 'ALL', page: 1, limit: 500 });
      const designs = all.designs;
      const today = new Date().toDateString();

      const stats = {
        totalDesigns: designs.length,
        pendingValidation: designs.filter(d => d.validationStatus === 'PENDING').length,
        validated: designs.filter(d => d.validationStatus === 'VALIDATED').length,
        rejected: designs.filter(d => d.validationStatus === 'REJECTED').length,
        draft: designs.filter(d => (d as any).isDraft).length,
        avgValidationTime: 0,
        todaySubmissions: designs.filter(d => (d.submittedForValidationAt && new Date(d.submittedForValidationAt).toDateString() === today)).length,
      };
      return stats;
    } catch (e) {
      console.warn('⚠️ Impossible de calculer les stats à partir de getAllDesigns, retour mock');
      return this.getMockValidationStats();
    }
  }

  /**
   * Stats mockées pour le développement
   */
  private getMockValidationStats() {
    return {
      totalDesigns: 25,
      pendingValidation: 5,
      validated: 18,
      rejected: 2,
      draft: 0,
      avgValidationTime: 4.5,
      todaySubmissions: 3
    };
  }

  /**
   * Soumettre un design pour validation admin
   * Met automatiquement tous les VendorProducts associés en statut PENDING
   */
  async submitForValidation(designId: number | string): Promise<{
    success: boolean;
    message: string;
    design: Design;
    affectedProducts: number;
  }> {
    try {
      const res = await fetch(`${this.apiUrl}/designs/${designId}/submit-for-validation`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          submitForValidation: true,
          submittedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        const response = await res.json();
        
        return {
          success: response.success || true,
          message: response.message || 'Design soumis pour validation avec succès',
          design: response.data?.design || response.design,
          affectedProducts: response.data?.affectedProducts || 0
        };
      }

      // Si l'endpoint n'existe pas, simuler la soumission
      if (res.status === 404) {
        console.warn('⚠️ Endpoint submit-for-validation non implémenté, simulation...');
        
        return {
          success: true,
          message: 'Design soumis pour validation avec succès (simulation)',
          design: { id: designId, name: 'Design simulé' } as Design,
          affectedProducts: 0
        };
      }

      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Erreur ${res.status}`);
    } catch (error: any) {
      console.error('❌ Erreur soumission design pour validation:', error);
      
      // En cas d'erreur réseau → simulation pour l'environnement de dev hors ligne
      if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        console.warn('⚠️ Backend inaccessible, simulation de validation…');
        return {
          success: true,
          message: 'Design soumis pour validation avec succès (simulation)',
          design: { id: designId, name: 'Design simulé' } as Design,
          affectedProducts: 0
        };
      }
      
      throw new Error(`Erreur soumission design: ${error.message}`);
    }
  }

  /**
   * Valider ou rejeter un design (Admin uniquement)
   * Met automatiquement tous les VendorProducts associés en statut VALIDATED ou DRAFT
   */
  async validateDesign(designId: number | string, validation: {
    action?: 'VALIDATE' | 'REJECT';
    isValid?: boolean; // OBSOLETE – conservé pour rétro-compatibilité interne
    rejectionReason?: string;
  }): Promise<{
    success: boolean;
    message: string;
    design: Design;
    affectedProducts?: number;
    newStatus: 'PUBLISHED' | 'DRAFT';
  }> {
    // Déterminer l'action finale à envoyer au backend en restant tolérant vis-à-vis de l'ancien appel
    const finalAction: 'VALIDATE' | 'REJECT' = validation.action
      ? validation.action
      : validation.isValid
        ? 'VALIDATE'
        : 'REJECT';

    const payload: Record<string, any> = { action: finalAction };
    if (finalAction === 'REJECT' && validation.rejectionReason) {
      payload.rejectionReason = validation.rejectionReason;
    }

    try {
      const candidateUrls = [
        `${this.apiUrl}/api/designs/${designId}/validate`,
        `${this.apiUrl}/designs/${designId}/validate`
      ];

      let res: Response | null = null;
      for (const url of candidateUrls) {
        res = await fetch(url, {
          method: 'PUT',
        credentials: 'include',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

        if (res.ok || res.status !== 404) break;
      }

      if (!res) throw new Error('Erreur réseau');

      if (!res.ok) {
        // Si 404 : simulation (toutes les URLs ont été testées et ont retourné 404)
        if (res.status === 404) {
          console.warn('⚠️ Endpoint validate non trouvé. Simulation…');
          return {
            success: true,
            message: finalAction === 'VALIDATE' ? 'Design validé (simulation)' : 'Design rejeté (simulation)',
            design: { id: designId, name: 'Design simulé' } as Design,
            affectedProducts: 0,
            newStatus: finalAction === 'VALIDATE' ? 'PUBLISHED' : 'DRAFT',
          };
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Erreur ${res.status}`);
      }

        const response = await res.json();
        /**
         * Structure de réponse attendue côté backend :
         * {
         *   success: true,
         *   message: '…',
         *   data: { design: { … }, affectedProducts: number }
         * }
         */
        const data = response.data || response;
        return {
          success: response.success ?? true,
          message: response.message || (finalAction === 'VALIDATE' ? 'Design validé' : 'Design rejeté'),
          design: data.design || data,
          affectedProducts: data.affectedProducts,
          newStatus: finalAction === 'VALIDATE' ? 'PUBLISHED' : 'DRAFT',
        };
    } catch (error: any) {
      console.error('❌ Erreur validation design:', error);
      
      // (Les cas HTTP non-OK ont été gérés avant le catch.)
      
      throw new Error(`Erreur validation design: ${error.message}`);
    }
  }

  /**
   * Obtenir le statut de validation d'un design spécifique via la nouvelle API VendorDesignProduct
   * Retourne toujours un objet contenant au minimum isValidated et isPending
   */
  async getDesignValidationStatus(designId: number | string): Promise<{
    id?: number | string;
    name?: string;
    isValidated: boolean;
    rejectionReason?: string;
    isPending: boolean;
    isDraft: boolean;
    validatedAt?: string;
  }> {
    // Sécurité – ID requis
    if (designId === undefined || designId === null) {
      return { isValidated: false, isPending: true, isDraft: true };
    }

    // ================= MOCK BACKEND =================
    if (this.useMockBackend) {
      try {
        // On réutilise la liste existante pour trouver le design
        const { designs } = await this.getDesigns({ status: 'all', limit: 500 });
        const found = designs.find(d => String(d.id) === String(designId));
        if (found) {
          return {
            id: found.id,
            name: found.name,
            isValidated: (found as any).isValidated !== undefined ? !!(found as any).isValidated : ((found as any).status?.toUpperCase?.() === 'VALIDATED'),
            rejectionReason: (found as any).rejectionReason,
            isPending: (found as any).isPending !== undefined ? !!(found as any).isPending : !((found as any).isValidated ?? false),
            isDraft: !!(found as any).isDraft,
            validatedAt: (found as any).validatedAt
          };
        }
      } catch {
        // ignore
      }
      // Fallback générique en mock
      return { id: designId, isValidated: false, isPending: true, isDraft: false };
    }

    // ⚠️ GET /vendor/designs/:id n'est pas disponible côté backend V2 – on saute cette tentative

    // ================= FALLBACK VIA LISTING DESIGNS =================
    try {
      const res = await fetch(`${this.vendorDesignBase}?status=all&limit=100`, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });

      if (res.ok) {
        const response = await res.json();
        const designs = response.data?.designs || response.designs || [];
        const foundDesign = designs.find((d: any) => String(d.id) === String(designId));
        
        if (foundDesign) {
          return {
            id: foundDesign.id,
            name: foundDesign.name,
            isValidated: !!foundDesign.isValidated || !!foundDesign.isPublished,
            rejectionReason: foundDesign.rejectionReason,
            isPending: !!foundDesign.isPending,
            isDraft: !!foundDesign.isDraft || !foundDesign.isPublished,
            validatedAt: foundDesign.validatedAt || foundDesign.updatedAt
          };
        }
      }
    } catch {
      /* ignore and continue to next fallback */
    }

    // ================= NOUVELLE API VendorDesignProduct (legacy fallback) =================
    try {
      const { vendorDesignProductAPI } = await import('./vendorDesignProductAPI');
      const { VendorDesignProductStatus } = await import('../types/vendorDesignProduct');
      
      const designProduct = await vendorDesignProductAPI.getDesignProduct(Number(designId));
      
      const isValidated = designProduct.status === VendorDesignProductStatus.VALIDATED;
      const isPending = designProduct.status === VendorDesignProductStatus.PENDING_VALIDATION;
      const isDraft = designProduct.status === VendorDesignProductStatus.DRAFT;
      const isRejected = designProduct.status === VendorDesignProductStatus.REJECTED;
      
      return {
        id: designProduct.id,
        name: designProduct.name,
        isValidated,
        rejectionReason: isRejected ? 'Design rejeté par l\'administrateur' : undefined,
        isPending,
        isDraft,
        validatedAt: isValidated ? designProduct.updatedAt : undefined
      };
    } catch {
      // Fallback final legacy
      return this.getDesignValidationStatusLegacy(designId);
    }
  }
  
  // Méthode legacy pour compatibilité
  private async getDesignValidationStatusLegacy(designId: number | string): Promise<{
    id?: number | string;
    name?: string;
    isValidated: boolean;
    rejectionReason?: string;
    isPending: boolean;
    isDraft: boolean;
    validatedAt?: string;
  }> {
    // ================= REAL BACKEND LEGACY =================
    // Plusieurs conventions d'URL possibles : on les teste en cascade
    const candidateUrls = [
      `${this.apiUrl}/api/designs/${designId}/validation-status`,
      `${this.apiUrl}/api/designs/${designId}`,
      `${this.vendorDesignBase}/${designId}/validation-status`,
      `${this.vendorDesignBase}/${designId}`,
      `${this.apiUrl}/designs/${designId}/validation-status`,
      `${this.apiUrl}/designs/${designId}`,
      `${this.apiUrl}/designs/validation/${designId}`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          credentials: 'include',
          headers: this.getAuthHeaders()
        });

        if (res.status === 404) {
          // Essaie l'URL suivante
          continue;
        }

        if (res.ok) {
          const raw = await res.json();
          const data = raw?.data || raw;
          const validatedFlag = data.isValidated !== undefined ? !!data.isValidated : (typeof data.status === 'string' && data.status.toUpperCase() === 'VALIDATED');

          return {
            id: data.id ?? designId,
            name: data.name,
            isValidated: validatedFlag,
            rejectionReason: data.rejectionReason,
            isPending: data.isPending !== undefined ? !!data.isPending : !validatedFlag,
            isDraft: !!data.isDraft,
            validatedAt: data.validatedAt
          };
        }
      } catch (err) {
        console.warn('⚠️ getDesignValidationStatus tentative échouée:', err);
        // Essayer l'URL suivante
      }
    }

    // Fallback si aucune info disponible ou en cas d'erreur
    return {
      id: designId,
      isValidated: false,
      isPending: true,
      isDraft: false
    };
  }

  /**
   * 🆕 NOUVEAU: Récupérer TOUS les designs pour l'interface admin (Décembre 2024)
   * Endpoint recommandé selon la documentation
   */
  async getAllDesigns(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ALL';
    sortBy?: 'createdAt' | 'price' | 'vendor';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    designs: (Design & {
      vendor: { id: number; firstName: string; lastName: string; email: string; };
      validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
      submittedForValidationAt?: string;
      validatedAt?: string;
      rejectionReason?: string;
      validatorName?: string;
      associatedProducts: number;
    })[];
    pagination: DesignPagination;
    stats: {
      total: number;
      pending: number;
      validated: number;
      rejected: number;
    };
  }> {
      const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
      if (filters.search) queryParams.append('search', filters.search);
    if (filters.status) queryParams.append('status', filters.status);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const candidateUrls = [
      `${this.apiUrl}/api/designs/admin/all?${queryParams}`,
      `${this.apiUrl}/api/designs/admin?${queryParams}`
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
        credentials: 'include',
        headers: this.getAuthHeaders()
      });

        if (res.status === 404) {
          continue;
        }

      if (res.ok) {
        const response = await res.json();
        const data = response.data || response;
        return {
          designs: data.designs || [],
          pagination: data.pagination || {
            currentPage: filters.page || 1,
            totalPages: 1,
              totalItems: (data.designs || []).length,
              itemsPerPage: filters.limit || (data.designs || []).length
          },
            stats: {
            total: (data.designs || []).length,
              pending: (data.designs || []).filter((d: any) => d.validationStatus === 'PENDING').length,
              validated: (data.designs || []).filter((d: any) => d.validationStatus === 'VALIDATED').length,
              rejected: (data.designs || []).filter((d: any) => d.validationStatus === 'REJECTED').length,
            }
          };
        }

        const err = await res.json().catch(() => ({}));
        console.warn(`⚠️ ${url} →`, err.message || res.status);
        break;
      } catch {
        // Essayer l'URL suivante
      }
    }

    console.warn('⚠️ api/designs/admin non dispo, retour mock');
        return this.getMockAllDesigns(filters);
  }

  /**
   * Données mockées pour getAllDesigns (développement)
   */
  private getMockAllDesigns(filters: any) {
    const mockDesigns = [
      {
        id: 1,
        name: 'Logo Corporate',
        description: 'Design professionnel pour entreprise',
        price: 25,
        category: 'logo',
        imageUrl: 'https://via.placeholder.com/300x300/4F46E5/white?text=Logo+1',
        thumbnailUrl: 'https://via.placeholder.com/150x150/4F46E5/white?text=Logo+1',
        createdAt: new Date().toISOString(),
        validationStatus: 'PENDING' as const,
        submittedForValidationAt: new Date().toISOString(),
        associatedProducts: 3,
        vendor: {
          id: 1,
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com'
        }
      },
      {
        id: 2,
        name: 'Pattern Floral',
        description: 'Motif floral élégant',
        price: 20,
        category: 'pattern',
        imageUrl: 'https://via.placeholder.com/300x300/10B981/white?text=Pattern+1',
        thumbnailUrl: 'https://via.placeholder.com/150x150/10B981/white?text=Pattern+1',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        validationStatus: 'VALIDATED' as const,
        submittedForValidationAt: new Date(Date.now() - 86400000).toISOString(),
        validatedAt: new Date(Date.now() - 43200000).toISOString(),
        validatorName: 'Admin Dupont',
        associatedProducts: 1,
        vendor: {
          id: 2,
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@email.com'
        }
      },
      {
        id: 3,
        name: 'Design Rejeté',
        description: 'Design avec problème de qualité',
        price: 15,
        category: 'illustration',
        imageUrl: 'https://via.placeholder.com/300x300/EF4444/white?text=Rejected',
        thumbnailUrl: 'https://via.placeholder.com/150x150/EF4444/white?text=Rejected',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        validationStatus: 'REJECTED' as const,
        submittedForValidationAt: new Date(Date.now() - 172800000).toISOString(),
        validatedAt: new Date(Date.now() - 129600000).toISOString(),
        rejectionReason: 'Qualité d\'image insuffisante et droits d\'auteur douteux',
        validatorName: 'Admin Martin',
        associatedProducts: 0,
        vendor: {
          id: 3,
          firstName: 'Pierre',
          lastName: 'Durand',
          email: 'pierre.durand@email.com'
        }
      }
    ];

    // Filtrer par statut si nécessaire
    let filteredDesigns = mockDesigns;
    if (filters.status && filters.status !== 'ALL') {
      filteredDesigns = mockDesigns.filter(design => design.validationStatus === filters.status);
    }

    // Filtrer par recherche si nécessaire
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDesigns = filteredDesigns.filter(design => 
        design.name.toLowerCase().includes(searchLower) ||
        design.vendor.firstName.toLowerCase().includes(searchLower) ||
        design.vendor.lastName.toLowerCase().includes(searchLower) ||
        design.vendor.email.toLowerCase().includes(searchLower)
      );
    }

    return {
      designs: filteredDesigns,
      pagination: {
        currentPage: filters.page || 1,
        totalPages: 1,
        totalItems: filteredDesigns.length,
        itemsPerPage: filters.limit || 20
      },
      stats: {
        total: mockDesigns.length,
        pending: mockDesigns.filter(d => d.validationStatus === 'PENDING').length,
        validated: mockDesigns.filter(d => d.validationStatus === 'VALIDATED').length,
        rejected: mockDesigns.filter(d => d.validationStatus === 'REJECTED').length
      }
    };
  }

  // ========================================================================
}

export const designService = new DesignService();
export default designService; 
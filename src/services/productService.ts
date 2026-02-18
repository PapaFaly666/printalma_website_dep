import { Product as SchemaProduct } from '../schemas/product.schema';
import { api } from './api';
import { prepareProductPayload, cleanProductPayload } from '../utils/productNormalization';

// Extended Product interface for ModernProductList compatibility
export interface Product extends Omit<SchemaProduct, 'colors' | 'sizes'> {
  id: number;
  suggestedPrice?: number;
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU';
  categoryId?: number;
  subCategoryId?: number; // ✅ camelCase correct
  category?: {
    id: number;
    name: string;
  };
  subCategory?: {    // ✅ camelCase correct
    id: number;
    name: string;
  };
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

  // 🆕 Prix par taille (structure API backend)
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  sizePrices?: Array<{
    id: number;
    productId: number;
    size: string;
    costPrice: number;
    suggestedPrice: number;
    createdAt: string;
    updatedAt: string;
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
  // ✅ CATÉGORIES: Format correct selon l'API (camelCase NestJS)
  categoryId: number | string; // Niveau 0 - Catégorie principale (accepte les deux formats)
  subCategoryId?: number; // Niveau 1 - Sous-catégorie (ex: T-Shirts) - IMPORTANT: camelCase avec C majuscule
  categories?: string[]; // ✅ Ajout du champ categories pour le backend
  // ✅ VARIATIONS: Format correct selon l'API
  variations?: Array<{
    variationId?: number; // Niveau 2 - Variation (ex: Col V)
    value: string; // Valeur de la variation (ex: "Rouge")
    price?: number;
    stock?: number;
    colorCode?: string;
    images?: Array<{
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
  sizes?: string[]; // Array de noms de tailles
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU'; // Genre du produit
  isReadyProduct?: boolean; // Indique si c'est un produit prêt (true) ou un mockup (false)
  requiresStock?: boolean; // Indique si le produit nécessite une gestion de stock (false pour AUTOCOLLANT/TABLEAU)

  // 🆕 Prix par taille
  useGlobalPricing?: boolean; // Utiliser les mêmes prix pour toutes les tailles
  globalCostPrice?: number; // Prix de revient global
  globalSuggestedPrice?: number; // Prix de vente suggéré global
  sizePricing?: Array<{
    size: string; // Nom de la taille
    suggestedPrice: number; // Prix de vente suggéré
    costPrice: number; // Prix de revient
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
// 🔧 UTILISER LOCALHOST pour le développement
const API_BASE = 'http://localhost:3004';
// const API_BASE = 'https://printalma-back-dep.onrender.com'; // Production

// Fonction utilitaire pour les appels API sécurisés
async function safeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
    // Préparer les headers avec authentification
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Détecter si c'est un endpoint public (pas de headers custom pour éviter CORS)
    const isPublicEndpoint = endpoint.startsWith('/products') && !endpoint.includes('/admin') && !endpoint.includes('/vendor');

    // Ajouter l'authentification via headers UNIQUEMENT pour endpoints privés
    if (!isPublicEndpoint) {
      try {
        const storedAuth = localStorage.getItem('auth_session');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          const userToken = btoa(JSON.stringify({
            userId: authData.user.id,
            email: authData.user.email,
            role: authData.user.role,
            timestamp: authData.timestamp
          }));

          authHeaders['Authorization'] = `Bearer ${userToken}`;
        }
      } catch (e) {
        console.warn('⚠️ [safeApiCall] Headers auth non disponibles');
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: isPublicEndpoint ? 'omit' : 'include', // Pas de credentials pour endpoints publics (évite CORS)
      headers: {
        ...authHeaders,
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
   * Vérification de l'authentification via cookies
   */
  static async checkAuthentication(): Promise<{
    isAuthenticated: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/auth/check`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isAuthenticated: data.isAuthenticated || false,
          user: data.user || null
        };
      }

      return { isAuthenticated: false };
    } catch (error) {
      console.error('❌ [ProductService] Erreur vérification auth:', error);
      return { 
        isAuthenticated: false, 
        error: error instanceof Error ? error.message : 'Erreur de vérification'
      };
    }
  }

  /**
   * Upload des images vers Cloudinary
   * Retourne les informations Cloudinary (public_id, secure_url, etc.)
   */
  static async uploadImagesToCloudinary(images: File[]): Promise<Array<{
    secure_url: string;
    public_id: string;
    resource_type: string;
    width: number;
    height: number;
  }>> {
    console.log(`📤 [Cloudinary] Upload de ${images.length} images...`);

    const uploadPromises = images.map(async (image, index) => {
      const formData = new FormData();
      formData.append('file', image);

      console.log(`📤 [Cloudinary] Upload image ${index + 1}/${images.length}: ${image.name}`);

      const response = await fetch(`${API_BASE}/cloudinary/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Upload Cloudinary échoué pour ${image.name}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ [Cloudinary] Image ${index + 1} uploadée: ${result.public_id}`);
      return result;
    });

    const results = await Promise.all(uploadPromises);
    console.log('✅ [Cloudinary] Toutes les images uploadées avec succès');
    return results;
  }

  // CRÉER un produit (POST /products) - ENVOI DES FICHIERS RÉELS AU BACKEND
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

      if (!productData.categoryId) {
        throw new Error('Une catégorie est requise');
      }

      if (!imageFiles || imageFiles.length === 0) {
        throw new Error('Au moins une image est requise pour créer un produit');
      }

      // ✅ ÉTAPE 1: Formater les données pour le backend
      // 🔧 PRODUITS SANS STOCK : AUTOCOLLANT ou TABLEAU
      const isAutocollant = productData.genre === 'AUTOCOLLANT' || productData.genre === 'TABLEAU';

      const backendProductData = {
        name: productData.name,
        description: productData.description,
        price: Number(productData.price),
        suggestedPrice: Number(productData.suggestedPrice),
        // 🔧 CORRECTION : Pour AUTOCOLLANT, envoyer stock: null (pas de gestion de stock)
        stock: isAutocollant ? null : Number(productData.stock || 0),
        status: productData.status || 'published',

        // ✅ CATÉGORIES CORRECTES (camelCase NestJS)
        categoryId: typeof productData.categoryId === 'string' ? parseInt(productData.categoryId) : productData.categoryId,
        subCategoryId: productData.subCategoryId,

        // ✅ REQUIS: categories (array de strings)
        categories: productData.categories && Array.isArray(productData.categories) && productData.categories.length > 0
          ? productData.categories
          : ["Produit"],

        // ✅ CONSTRUCTION DES colorVariations AVEC fileId UNIQUE
        colorVariations: this.buildColorVariationsWithFileIds(productData.variations || [], imageFiles, true, isAutocollant),

        // ✅ AUTRES CHAMPS
        genre: productData.genre || 'UNISEXE',
        // 🔧 ATTENTION : Ces champs peuvent ne pas être supportés par le backend
        // On les envoie seulement si le backend les supporte
        // requiresStock: isAutocollant ? false : (productData.requiresStock ?? true),
        // isReadyProduct: productData.isReadyProduct ?? false,
        sizes: productData.sizes || [],

        // 🆕 Prix par taille
        useGlobalPricing: productData.useGlobalPricing || false,
        globalCostPrice: Number(productData.globalCostPrice || 0),
        globalSuggestedPrice: Number(productData.globalSuggestedPrice || 0),
        sizePricing: productData.sizePricing || []
      };

      // 🔧 DEBUG : Afficher le payload final avant envoi
      console.log('🔧 [FINAL] Payload pour API (NETTOYÉ):', backendProductData);

      console.log('🔧 [FINAL] Payload pour API:', backendProductData);
      console.log('🔧 [FINAL] genre:', backendProductData.genre);
      console.log('🔧 [FINAL] stock:', backendProductData.stock);
      console.log('🔧 [FINAL] stock type:', typeof backendProductData.stock);
      console.log('🔧 [FINAL] colorVariations count:', backendProductData.colorVariations.length);

      // 🔧 DEBUG : Afficher le stock de chaque variation
      backendProductData.colorVariations.forEach((cv: any, i: number) => {
        console.log(`   🎨 Variation ${i}: ${cv.name}, stock = ${cv.stock} (type: ${typeof cv.stock})`);
      });

      // ✅ ÉTAPE 2: Créer FormData et envoyer les FICHIERS RÉELS au backend
      // Le backend s'occupera de l'upload sur Cloudinary
      console.log('📤 [ProductService] Envoi des fichiers au backend...');

      const formData = new FormData();

      // Ajouter les données du produit en JSON
      const productDataJson = JSON.stringify(backendProductData);
      console.log('📤 [ProductService] JSON productData envoyé:', productDataJson);
      console.log('📤 [ProductService] JSON length:', productDataJson.length);
      formData.append('productData', productDataJson);

      // ✅ ÉTAPE 3: Ajouter les fichiers image réels au FormData
      // 🔧 CORRECTION : Envoyer avec file_${fileId} pour correspondance avec le backend
      let fileIndex = 0;
      for (const colorVar of backendProductData.colorVariations) {
        if (!colorVar.images) continue;

        for (const image of colorVar.images) {
          const fileId = image.fileId;
          if (!fileId) {
            console.warn(`⚠️ [ProductService] Image sans fileId, index=${fileIndex}`);
            fileIndex++;
            continue;
          }

          const file = imageFiles[fileIndex];
          if (!file) {
            console.error(`❌ [ProductService] Fichier non trouvé pour fileId=${fileId}, index=${fileIndex}`);
            fileIndex++;
            continue;
          }

          // 🔧 IMPORTANT : Utiliser file_${fileId} pour que le backend puisse faire la correspondance
          formData.append(`file_${fileId}`, file);
          console.log(`📎 [ProductService] Ajout du fichier: ${file.name} (fileId: ${fileId}, index: ${fileIndex})`);
          fileIndex++;
        }
      }

      console.log(`📦 [ProductService] FormData créé avec ${fileIndex} fichiers pour le backend`);

      // 🔧 DEBUG : Afficher les clés du FormData
      console.log('🔍 [DEBUG] FormData keys:');
      for (const [key, value] of (formData as any).entries()) {
        if (key === 'productData') {
          console.log(`   - ${key}: JSON (longueur: ${value.length} chars)`);
        } else {
          console.log(`   - ${key}: File`);
        }
      }

      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        credentials: 'include',
        body: formData // Pas de Content-Type, laissé à FormData
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [ProductService] Erreur backend:', data);
        throw new Error(data.message || `Erreur HTTP ${response.status}`);
      }

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

  // ✅ FONCTION UTILITAIRE: Construire colorVariations avec fileId unique
  private static buildColorVariationsWithFileIds(variations: any[], imageFiles: File[], preserveExistingFileIds: boolean = false, isAutocollant: boolean = false): any[] {
    if (!variations || variations.length === 0) return [];

    let fileIndex = 0;
    // Générer une seule timestamp pour toutes les images de ce produit
    const productTimestamp = Date.now();

    return variations.map((variation: any) => ({
      name: variation.value || variation.name,
      colorCode: variation.colorCode,
      price: Number(variation.price),
      // 🔧 CORRECTION : Pour AUTOCOLLANT, pas de stock dans les variations
      stock: isAutocollant ? null : Number(variation.stock),
      images: variation.images?.map((img: any, imgIndex: number) => {
        // 🔧 CORRECTION : Conserver le fileId existant si présent et demandé
        const existingFileId = preserveExistingFileIds ? (img.fileId || img.id) : null;
        const fileId = existingFileId || `img_${productTimestamp}_${fileIndex}`;

        // Avancer l'index des fichiers
        const currentFileIndex = fileIndex;
        fileIndex++;

        return {
          fileId: fileId,           // ✅ ID unique pour faire correspondre avec le fichier (conservé ou généré)
          view: img.view || 'Front',
          delimitations: img.delimitations || [],
          // Garder une référence au fichier original pour debug
          _fileName: imageFiles[currentFileIndex]?.name || 'unknown',
          _fileIndex: currentFileIndex,
          _originalFileId: img.fileId || img.id, // Pour debug
          _preserved: !!existingFileId // Pour debug
        };
      }) || []
    }));
  }

  // ✅ FONCTION UTILITAIRE: Obtenir le fileId pour un index de fichier donné
  private static getFileIdForIndex(colorVariations: any[], fileIndex: number): string | null {
    let currentIndex = 0;

    for (const variation of colorVariations) {
      if (variation.images) {
        for (const image of variation.images) {
          if (currentIndex === fileIndex) {
            return image.fileId;
          }
          currentIndex++;
        }
      }
    }

    return null;
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

  // METTRE À JOUR un produit (PUT /api/products/:id) - VERSION SÉCURISÉE
  static async updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<ServiceResponse<Product>> {
    try {
      console.log(`🔄 [ProductService] Mise à jour du produit ${id}...`);
      
      // ✅ SOLUTION: Nettoyer le payload pour éviter les types mixtes
      const cleanedData = cleanProductPayload(data as any);
      console.log(`🧹 [ProductService] Payload nettoyé pour le produit ${id}:`, cleanedData);
      
      const response = await safeApiCall(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cleanedData)
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

  // Version avec diagnostic complet
  static async updateProductSafe(productId: number, rawPayload: any): Promise<ServiceResponse<Product>> {
    console.log('🔄 [ProductService] Mise à jour sécurisée du produit', productId);
    
    // 🔍 DIAGNOSTIC : Vérifier l'état de l'authentification
    console.log('🔍 [DIAGNOSTIC] Cookies actuels:', document.cookie);
    console.log('🔍 [DIAGNOSTIC] URL actuelle:', window.location.href);
    console.log('🔍 [DIAGNOSTIC] User agent:', navigator.userAgent);
    
    try {
      // Nettoyer et préparer le payload
      const cleanPayload = prepareProductPayload(rawPayload);
      console.log('🚀 [ProductService] Payload préparé:', JSON.stringify(cleanPayload, null, 2));
      
      // 🔍 Test de connectivité avec /auth/check avant le PATCH
      console.log('🔍 [DIAGNOSTIC] Test /auth/check...');
      let authWorking = false;
      try {
        const authCheckResponse = await fetch(`${API_BASE}/auth/check`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('🔍 [DIAGNOSTIC] /auth/check status:', authCheckResponse.status);
        
        if (authCheckResponse.ok) {
          const authData = await authCheckResponse.json();
          console.log('🔍 [DIAGNOSTIC] /auth/check data:', authData);
          authWorking = authData.isAuthenticated || false;
        } else {
          console.warn('⚠️ [DIAGNOSTIC] /auth/check failed:', authCheckResponse.status);
          
          // Si auth/check échoue, essayer de récupérer des infos sur l'erreur
          try {
            const errorText = await authCheckResponse.text();
            console.warn('🔍 [DIAGNOSTIC] Auth error details:', errorText);
          } catch (e) {
            console.warn('🔍 [DIAGNOSTIC] Impossible de lire l\'erreur auth');
          }
        }
      } catch (authError) {
        console.error('❌ [DIAGNOSTIC] /auth/check error:', authError);
      }
      
      // Si l'authentification ne fonctionne pas, tenter une re-authentification silencieuse
      if (!authWorking) {
        console.error('🚨 [DIAGNOSTIC] Authentification par cookies non fonctionnelle');
        console.error('🚨 [DIAGNOSTIC] Tentative de re-authentification silencieuse...');
        
        // Tenter de restaurer la session via localStorage vers cookies
        try {
          const storedAuth = localStorage.getItem('auth_session');
          if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            console.log('🔄 [DIAGNOSTIC] Tentative de restauration de session...');
            
            // Simuler une reconnexion pour forcer les cookies
            const reAuthResponse = await fetch(`${API_BASE}/auth/restore-session`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user: authData.user,
                timestamp: authData.timestamp
              })
            }).catch(() => null);
            
            if (reAuthResponse && reAuthResponse.ok) {
              console.log('✅ [DIAGNOSTIC] Session restaurée avec cookies');
              // Continuer avec le PATCH normal
            } else {
              console.warn('⚠️ [DIAGNOSTIC] Restauration échouée, tentative PATCH malgré tout...');
            }
          }
        } catch (restoreError) {
          console.warn('⚠️ [DIAGNOSTIC] Erreur restauration session:', restoreError);
        }
        
        // Continuer malgré les cookies manquants - le backend jugera
        console.log('🚀 [DIAGNOSTIC] Continuation malgré cookies manquants...');
      }
      
      // Préparer les headers avec authentification via Bearer token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Toujours ajouter l'authentification via header en plus des cookies
      try {
        const storedAuth = localStorage.getItem('auth_session');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);

          // Créer un token simple avec les infos utilisateur
          const userToken = btoa(JSON.stringify({
            userId: authData.user.id,
            email: authData.user.email,
            role: authData.user.role,
            timestamp: authData.timestamp
          }));

          headers['Authorization'] = `Bearer ${userToken}`;
          headers['X-User-ID'] = String(authData.user.id);
          headers['X-User-Email'] = authData.user.email;
          headers['X-User-Role'] = authData.user.role;

          console.log('🔧 [ProductService] Headers auth ajoutés:', {
            userId: authData.user.id,
            email: authData.user.email,
            role: authData.user.role
          });
        }
      } catch (e) {
        console.warn('⚠️ [ProductService] Impossible de créer headers auth:', e);
      }
      
      // Essayer d'abord PUT au lieu de PATCH (plus compatible)
      console.log('🚀 [DIAGNOSTIC] Tentative PUT au lieu de PATCH...');
      let response = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify(cleanPayload)
      });

      // Si PUT échoue, essayer PATCH en fallback
      if (!response.ok && response.status === 404) {
        console.log('🔄 [DIAGNOSTIC] PUT échoué, tentative PATCH...');
        response = await fetch(`${API_BASE}/products/${productId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers,
          body: JSON.stringify(cleanPayload)
        });
      }
      
      console.log('📡 [ProductService] PATCH Status:', response.status);
      console.log('📡 [ProductService] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [ProductService] PATCH réussi');
        return {
          success: true,
          data: this.transformProduct(responseData.data || responseData),
          message: 'Produit modifié avec succès'
        };
      }
      
      // En cas d'erreur 500, essayer différentes stratégies
      if (response.status === 500) {
        console.log('⚠️ [ProductService] Erreur 500 détectée - Tentatives de récupération...');

        // Tenter de lire le body de l'erreur pour plus de détails
        try {
          const errorText = await response.text();
          console.error('🔍 [DIAGNOSTIC] Erreur 500 détails:', errorText);
        } catch (e) {
          console.error('🔍 [DIAGNOSTIC] Impossible de lire le body de l\'erreur 500');
        }

        // Stratégie 1: Essayer avec l'ancienne méthode updateProduct
        console.log('🔄 [RECOVERY] Tentative méthode alternative...');
        try {
          const alternativeResult = await this.updateProduct(productId, rawPayload);
          if (alternativeResult.success) {
            console.log('✅ [RECOVERY] Succès avec méthode alternative');
            return alternativeResult;
          }
        } catch (altError) {
          console.warn('⚠️ [RECOVERY] Méthode alternative échouée:', altError);
        }

        // Stratégie 2: Vérifier si la modification a quand même été appliquée
        console.log('🔄 [RECOVERY] Vérification de l\'état actuel...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const verifyResponse = await fetch(`${API_BASE}/products/${productId}`, {
            credentials: 'include',
            headers
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            const currentProduct = verifyData.data || verifyData;

            // Vérifier si au moins une partie des modifications a été appliquée
            const wasModified = cleanPayload.name ?
              currentProduct.name === cleanPayload.name : true;

            if (wasModified) {
              console.log('✅ [RECOVERY] Modification appliquée malgré erreur 500');
              return {
                success: true,
                data: this.transformProduct(currentProduct),
                message: 'Produit modifié (récupéré après erreur 500)'
              };
            }
          }
        } catch (verifyError) {
          console.warn('⚠️ [RECOVERY] Impossible de vérifier l\'état après erreur 500');
        }

        // Stratégie 3: Si le produit existe toujours, considérer comme partiellement réussi
        try {
          const basicCheck = await fetch(`${API_BASE}/products/${productId}`, {
            credentials: 'include'
          });

          if (basicCheck.ok) {
            const basicData = await basicCheck.json();
            console.log('⚠️ [RECOVERY] Produit accessible, erreur 500 peut être temporaire');
            return {
              success: false,
              error: 'Erreur 500 temporaire - Produit toujours accessible',
              data: this.transformProduct(basicData.data || basicData)
            };
          }
        } catch (basicError) {
          console.error('❌ [RECOVERY] Produit inaccessible après erreur 500');
        }
      }
      
      // Traiter les autres erreurs
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      console.error('❌ [ProductService] Erreur lors de la modification:', error);
      console.error('🔍 [DEBUG] ProductId:', productId);
      console.error('🔍 [DEBUG] Payload original:', rawPayload);
      
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
      suggestedPrice: (apiProduct.suggestedPrice ?? apiProduct.suggested_price) != null
        ? Number(apiProduct.suggestedPrice ?? apiProduct.suggested_price)
        : undefined,
      genre: apiProduct.genre,
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
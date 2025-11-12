import axios from 'axios';
import { normalizeProductFromApi } from '../utils/productNormalization';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use((res) => {
  const url = res.config?.url || '';
  if (url.startsWith('/products')) {
    if (Array.isArray(res.data?.data)) {
      res.data.data = res.data.data.map(normalizeProductFromApi);
    } else if (res.data && typeof res.data === 'object') {
      res.data = normalizeProductFromApi(res.data);
    }
  }
  return res;
});

api.interceptors.response.use((res) => res, (err) => {
  if (err?.response?.status === 401) {
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

// src/api/apiService.ts
import type { AxiosResponse } from 'axios';
import { ProductSchema, Product } from '../schemas/product.schema';
import { CategorySchema, Category } from '../schemas/category.schema';

const API_URL = 'https://printalma-back-dep.onrender.com';

// Fonctions pour les produits
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response: AxiosResponse<any> = await axios.get(`${API_URL}/products`);
    
    // Gérer le format de réponse avec success/data ou direct
    const rawProducts = response.data.data || response.data;
    
    if (Array.isArray(rawProducts)) {
      return rawProducts.map(transformApiProductToSchema).map(product => ProductSchema.parse(product));
    } else {
      console.error('Response data is not an array:', rawProducts);
      return [];
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Récupérer les produits marqués comme supprimés
export const fetchDeletedProducts = async (): Promise<Product[]> => {
  try {
    // L'API ne semble pas supporter l'endpoint /products/deleted comme indiqué dans la documentation
    // Nous allons donc utiliser uniquement le stockage local pour gérer les produits supprimés
    
    // Récupération du cache local
    const storedData = localStorage.getItem('printalma_deleted_products');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as Product[];
        console.log("Produits supprimés chargés depuis le cache local:", parsedData.length);
        return parsedData;
      } catch (parseError) {
        console.error('Erreur lors du parsing des données du cache:', parseError);
      }
    } else {
      console.log("Aucun produit supprimé trouvé dans le cache local");
    }
    
    // Si pas de cache ou erreur, retourner un tableau vide
    return [];
  } catch (error) {
    console.error('Error fetching deleted products:', error);
    throw error;
  }
};

export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const response: AxiosResponse<Product> = await axios.post(`${API_URL}/products`, productData);
    return ProductSchema.parse(response.data);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id: number, productData: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const response: AxiosResponse<Product> = await axios.put(`${API_URL}/products/${id}`, productData);
    return ProductSchema.parse(response.data);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Soft Delete - Marque un produit comme supprimé
export const softDeleteProduct = async (id: number): Promise<{ message: string; deletedProductId: number; deletedAt: string }> => {
  try {
    const response: AxiosResponse<{ message: string; deletedProductId: number; deletedAt: string }> = 
      await axios.delete(`${API_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error soft deleting product:', error);
    throw error;
  }
};

// Restore - Restaure un produit précédemment supprimé
export const restoreProduct = async (id: number): Promise<{ message: string; product: Product }> => {
  try {
    const response: AxiosResponse<{ message: string; product: Product }> = 
      await axios.patch(`${API_URL}/products/${id}/restore`);
    return {
      message: response.data.message,
      product: ProductSchema.parse(response.data.product)
    };
  } catch (error) {
    console.error('Error restoring product:', error);
    throw error;
  }
};

// Hard Delete - Suppression définitive d'un produit
export const hardDeleteProduct = async (id: number): Promise<{ message: string; deletedProductId: number }> => {
  try {
    const response: AxiosResponse<{ message: string; deletedProductId: number }> = 
      await axios.delete(`${API_URL}/products/${id}/force`);
    return response.data;
  } catch (error) {
    console.error('Error hard deleting product:', error);
    throw error;
  }
};

export const fetchProductById = async (id: number | string): Promise<Product> => {
  try {
    const response: AxiosResponse<any> = await axios.get(`${API_URL}/products/${id}`);
    const rawProduct = response.data.data || response.data;
    const transformedProduct = transformApiProductToSchema(rawProduct);
    return ProductSchema.parse(transformedProduct);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const fallback = await axios.get(`${API_URL}/vendor/admin/products/${id}`, { withCredentials: true });
        const rawProduct = fallback.data.data || fallback.data;
        return ProductSchema.parse(transformApiProductToSchema(rawProduct));
      } catch (err) {
        // Essayer avec préfixe /api
        try {
          const fallback2 = await axios.get(`${API_URL}/api/vendor/admin/products/${id}`, { withCredentials: true });
          const rawProduct = fallback2.data.data || fallback2.data;
          return ProductSchema.parse(transformApiProductToSchema(rawProduct));
        } catch (err2) {
          console.error(`Fallbacks for product ${id} failed`, err, err2);
          
          // NOUVEAU: Utiliser le service intelligent en dernier recours
          try {
            const { ProductService } = await import('./productService');
            console.log(`🔍 Tentative avec le service intelligent pour le produit ${id}...`);
            const smartResult = await ProductService.getProductSmart(Number(id));
            console.log(`✅ Produit ${id} trouvé via ${smartResult.source}!`);
            
            // Transformer en format Product selon notre schéma
            const transformedProduct = transformApiProductToSchema(smartResult.data);
            return ProductSchema.parse(transformedProduct);
          } catch (smartError) {
            console.error(`❌ Service intelligent failed for product ${id}:`, smartError);
            
            // Lancer une erreur avec plus d'informations
            throw new Error(
              `Produit ${id} introuvable sur tous les endpoints disponibles. ` +
              `Vérifiez l'ID du produit ou utilisez le composant de diagnostic.`
            );
          }
        }
      }
    }
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
};

// Fonction de transformation pour convertir le format API vers le format Zod
function transformApiProductToSchema(apiProduct: any): any {
  // Supporter plusieurs formats de catégorie
  const category = apiProduct.categories?.[0] ||
                   apiProduct.category ||
                   apiProduct.subCategory ||
                   null;

  // Transformer les images en views selon le schéma Zod avec délimitations
  const allViews = apiProduct.colorVariations?.flatMap((cv: any) =>
    (cv.images || []).map((image: any) => ({
      id: image.id,
      viewType: mapViewToEnum(image.view), // Convertir view vers viewType enum
      imageUrl: image.url,
      imagePublicId: image.publicId,
      description: image.description,
      delimitations: (image.delimitations || []).map((delim: any) => ({
        id: delim.id,
        x: delim.x,
        y: delim.y,
        width: delim.width,
        height: delim.height,
        rotation: delim.rotation || 0,
        name: delim.name || null,
        coordinateType: delim.coordinateType || 'PERCENTAGE',
        productImageId: delim.productImageId || image.id,
        createdAt: delim.createdAt,
        updatedAt: delim.updatedAt
      }))
    }))
  ) || [];

  const mainImageUrl = allViews[0]?.imageUrl || apiProduct.imageUrl;

  return {
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

    // Transformation pour Zod
    categoryId: category?.id || (apiProduct.categoryId || apiProduct.subCategoryId || 0),
    category: category || {
      id: apiProduct.categoryId || apiProduct.subCategoryId || 0,
      name: category?.name || 'Non catégorisé',
      slug: category?.slug || 'non-categorise'
    },
    views: allViews,
    colors: apiProduct.colorVariations?.map((c: any) => ({
      id: c.id,
      name: c.name,
      hexCode: c.colorCode,
      imageUrl: c.images?.[0]?.url || "",
      imagePublicId: c.images?.[0]?.publicId
    })) || [],

    sizes: (apiProduct.sizes || []).map((s: any) => ({
      id: s.id,
      name: s.sizeName || s.name, // Supporter les deux formats
      sizeName: s.sizeName || s.name
    }))
  };
}

// Fonction utilitaire pour mapper les views vers l'enum Zod
function mapViewToEnum(view: string): 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'DETAIL' | 'OTHER' {
  const normalizedView = (view || '').toUpperCase();
  
  switch (normalizedView) {
    case 'FRONT':
      return 'FRONT';
    case 'BACK':
      return 'BACK';
    case 'LEFT':
      return 'LEFT';
    case 'RIGHT':
      return 'RIGHT';
    case 'TOP':
      return 'TOP';
    case 'BOTTOM':
      return 'BOTTOM';
    case 'DETAIL':
      return 'DETAIL';
    default:
      return 'OTHER';
  }
}

// Fonctions pour les catégories
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response: AxiosResponse<any[]> = await axios.get(`${API_URL}/categories`);
    
    console.log('🔍 [fetchCategories] Données brutes reçues:', response.data);
    console.log('🔍 [fetchCategories] Structure des catégories:', response.data.map((item, index) => ({
      index,
      id: item?.id,
      name: item?.name,
      parentId: item?.parentId,
      level: item?.level,
      hasParentId: !!item?.parentId
    })));
    
    // Filtrer et nettoyer les catégories manuellement
    const validCategories: Category[] = [];
    const rawData = response.data;
    
    if (Array.isArray(rawData)) {
      rawData.forEach((item, index) => {
        // Validation manuelle plus permissive
        if (item && typeof item === 'object' && item.id && item.name && item.name.trim().length > 0) {
          const cleanCategory: Category = {
            id: Number(item.id),
            name: String(item.name).trim(),
            description: item.description ? String(item.description).trim() : null,
            parentId: item.parentId ? Number(item.parentId) : null,
            order: item.order || 0,
            level: item.level || 0
          };
          validCategories.push(cleanCategory);
        } else {
          console.warn(`⚠️ [fetchCategories] Catégorie invalide à l'index ${index}, ignorée:`, item);
        }
      });
    }
    
    console.log(`✅ [fetchCategories] ${validCategories.length} catégories valides chargées (sur ${rawData.length} total)`);
    
    // Si aucune catégorie valide trouvée, créer une catégorie par défaut
    if (validCategories.length === 0) {
      console.warn('⚠️ [fetchCategories] Aucune catégorie valide trouvée, création d\'une catégorie par défaut');
      validCategories.push({
        id: 1,
        name: 'Catégorie par défaut',
        description: 'Catégorie créée automatiquement',
        order: 0,
        level: 0
      });
    }
    
    return validCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // En cas d'erreur, retourner une catégorie par défaut
    console.warn('⚠️ [fetchCategories] Erreur réseau, retour d\'une catégorie par défaut');
    return [{
      id: 1,
      name: 'Catégorie par défaut',
      description: 'Catégorie créée en cas d\'erreur réseau',
      order: 0,
      level: 0
    }];
  }
};

export const createCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
  try {
    const response: AxiosResponse<Category> = await axios.post(`${API_URL}/categories`, categoryData);
    return CategorySchema.parse(response.data);
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id: number, categoryData: Omit<Category, 'id'>): Promise<Category> => {
  try {
    const response: AxiosResponse<Category> = await axios.put(`${API_URL}/categories/${id}`, categoryData);
    return CategorySchema.parse(response.data);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: number): Promise<void> => {
  try {
    const response: AxiosResponse<void> = await axios.delete(`${API_URL}/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const fetchCategoryById = async (id: number): Promise<Category> => {
  try {
    const response: AxiosResponse<Category> = await axios.get(`${API_URL}/categories/${id}`);
    return CategorySchema.parse(response.data);
  } catch (error) {
    console.error(`Error fetching category with id ${id}:`, error);
    throw error;
  }
};
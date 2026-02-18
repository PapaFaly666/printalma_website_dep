// Service pour la recherche avec autocomplétion
import { VendorServiceInstance, Vendor } from './vendorService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

export interface SearchResult {
  id: number | string;
  name: string;
  type: 'product' | 'design' | 'article' | 'vendor';
  imageUrl?: string;
  price?: number;
  category?: string;
  subCategory?: string;
  url: string;
  vendorType?: 'ARTISTE' | 'DESIGNER' | 'INFLUENCEUR' | 'OTHER';
  shopName?: string;
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total: number;
  };
}

interface SearchSuggestionParams {
  query: string;
  limit?: number;
}

class SearchService {
  private baseUrl = API_BASE_URL;
  private cache = new Map<string, SearchResult[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  /**
   * Nettoyer le cache expiré
   */
  private cleanExpiredCache() {
    const now = Date.now();
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  /**
   * Récupérer les suggestions de recherche avec autocomplétion
   */
  async getSearchSuggestions(params: SearchSuggestionParams): Promise<SearchResult[]> {
    const { query, limit = 8 } = params;

    // Vérifier le cache
    const cacheKey = `${query}-${limit}`;
    const cached = this.cache.get(cacheKey);
    const cachedTime = this.cacheTimestamps.get(cacheKey);

    if (cached && cachedTime && Date.now() - cachedTime < this.cacheTimeout) {
      return cached;
    }

    // Nettoyer le cache expiré
    this.cleanExpiredCache();

    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      // Appel à l'API de recherche
      const response = await fetch(
        `${this.baseUrl}/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Si l'API n'existe pas encore, retourner des résultats vides
        return [];
      }

      const result: SearchResponse = await response.json();

      if (result.success && result.data?.results) {
        // Mettre en cache
        this.cache.set(cacheKey, result.data.results);
        this.cacheTimestamps.set(cacheKey, Date.now());
        return result.data.results;
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  /**
   * Rechercher des produits (fallback si API non disponible)
   */
  async searchProducts(query: string): Promise<SearchResult[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      console.log('🔍 [searchService] Recherche de produits pour:', query);
      const response = await fetch(
        `${this.baseUrl}/api/products/search?q=${encodeURIComponent(query)}&limit=6`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 [searchService] Réponse produits - Status:', response.status, response.ok);

      if (!response.ok) {
        console.warn('⚠️ [searchService] API produits non disponible ou erreur');
        return [];
      }

      const result = await response.json();
      console.log('📦 [searchService] Résultat produits:', result);

      if (result.success && result.data?.products) {
        const mapped = result.data.products.map((product: any) => ({
          id: product.id,
          name: product.name,
          type: 'product' as const,
          imageUrl: product.images?.[0]?.url || product.imageUrl,
          price: product.price,
          category: product.category,
          subCategory: product.subCategory,
          url: `/product/${product.id}`,
        }));
        console.log('✅ [searchService] Produits trouvés:', mapped.length);
        return mapped;
      }

      return [];
    } catch (error) {
      console.error('❌ [searchService] Erreur lors de la recherche de produits:', error);
      return [];
    }
  }

  /**
   * Rechercher des designs (fallback si API non disponible)
   */
  async searchDesigns(query: string): Promise<SearchResult[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/designs/search?q=${encodeURIComponent(query)}&limit=4`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const result = await response.json();

      if (result.success && result.data?.designs) {
        return result.data.designs.map((design: any) => ({
          id: design.id,
          name: design.name,
          type: 'design' as const,
          imageUrl: design.imageUrl || design.thumbnailUrl,
          price: design.price,
          category: design.category,
          url: `/design/${design.id}`,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche de designs:', error);
      return [];
    }
  }

  /**
   * Rechercher des vendeurs
   */
  async searchVendors(query: string): Promise<SearchResult[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      console.log('🔍 [searchService] Recherche de vendeurs pour:', query);
      const allVendors = await VendorServiceInstance.getAllVendors();

      // Filtrer les vendeurs par nom, prénom ou nom de boutique
      const filteredVendors = allVendors.filter((vendor: Vendor) => {
        const searchLower = query.toLowerCase();
        const firstName = vendor.firstName?.toLowerCase() || '';
        const lastName = vendor.lastName?.toLowerCase() || '';
        const shopName = vendor.shop_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();

        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          fullName.includes(searchLower) ||
          shopName.includes(searchLower)
        );
      });

      console.log('✅ [searchService] Vendeurs trouvés:', filteredVendors.length);

      // Limiter à 4 résultats
      return filteredVendors.slice(0, 4).map((vendor: Vendor) => ({
        id: vendor.id,
        name: `${vendor.firstName} ${vendor.lastName}`.trim(),
        type: 'vendor' as const,
        imageUrl: vendor.profile_photo_url || vendor.photo_profil || undefined,
        category: this.getVendorTypeLabel(vendor.vendeur_type),
        shopName: vendor.shop_name || undefined,
        vendorType: vendor.vendeur_type,
        url: `/profile/${vendor.vendeur_type.toLowerCase()}/${vendor.id}`,
      }));
    } catch (error) {
      console.error('❌ [searchService] Erreur lors de la recherche de vendeurs:', error);
      return [];
    }
  }

  /**
   * Obtenir le label du type de vendeur
   */
  private getVendorTypeLabel(type: 'ARTISTE' | 'DESIGNER' | 'INFLUENCEUR' | 'OTHER'): string {
    const labels = {
      'ARTISTE': 'Artiste',
      'DESIGNER': 'Designer',
      'INFLUENCEUR': 'Influenceur',
      'OTHER': 'Créateur'
    };
    return labels[type] || 'Vendeur';
  }

  /**
   * Recherche combinée (produits + designs + vendeurs)
   */
  async combinedSearch(query: string): Promise<SearchResult[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const [products, designs, vendors] = await Promise.all([
        this.searchProducts(query),
        this.searchDesigns(query),
        this.searchVendors(query),
      ]);

      // Combiner les résultats avec priorité: produits, vendeurs, designs
      const combined = [...products, ...vendors, ...designs];
      return combined.slice(0, 10);
    } catch (error) {
      console.error('Erreur lors de la recherche combinée:', error);
      return [];
    }
  }

  /**
   * Obtenir les recherches récentes depuis localStorage
   */
  getRecentSearches(): string[] {
    try {
      const recent = localStorage.getItem('recentSearches');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sauvegarder une recherche dans l'historique
   */
  saveRecentSearch(query: string) {
    try {
      const recent = this.getRecentSearches();
      // Supprimer la query si elle existe déjà
      const filtered = recent.filter(q => q !== query);
      // Ajouter au début
      const updated = [query, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recherche:', error);
    }
  }

  /**
   * Effacer l'historique de recherche
   */
  clearRecentSearches() {
    try {
      localStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
    }
  }
}

export const searchService = new SearchService();
export default searchService;

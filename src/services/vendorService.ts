import { api } from './api';

export interface Vendor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shop_name?: string | null;
  vendeur_type: 'ARTISTE' | 'DESIGNER' | 'INFLUENCEUR' | 'OTHER';
  photo_profil?: string | null;
  profile_photo_url?: string | null;
  phone?: string | null;
  country?: string | null;
  address?: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorResponse {
  success: boolean;
  data: Vendor[];
  total: number;
}

class VendorService {
  private cache: Map<string, { data: Vendor[]; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: Vendor[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): Vendor[] | null {
    const cached = this.cache.get(key);
    if (!cached || !this.isCacheValid(key)) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  async getAllVendors(): Promise<Vendor[]> {
    const cacheKey = 'all_vendors';
    const cached = this.getCache(cacheKey);

    if (cached) {
      console.log('🎯 [VendorService] Using cached vendors data');
      return cached;
    }

    try {
      console.log('🔍 [VendorService] Fetching vendors from API...');
      const response = await api.get<VendorResponse>('/public/users/vendors');

      if (response.data.success && Array.isArray(response.data.data)) {
        const vendors = response.data.data;
        this.setCache(cacheKey, vendors);
        console.log(`✅ [VendorService] Loaded ${vendors.length} vendors`);
        return vendors;
      } else {
        console.error('❌ [VendorService] Invalid response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ [VendorService] Error fetching vendors:', error);
      return [];
    }
  }

  async getVendorsByType(type: 'ARTISTE' | 'DESIGNER' | 'INFLUENCEUR'): Promise<Vendor[]> {
    const cacheKey = `vendors_${type}`;
    const cached = this.getCache(cacheKey);

    if (cached) {
      console.log(`🎯 [VendorService] Using cached ${type} vendors data`);
      return cached;
    }

    try {
      console.log(`🔍 [VendorService] Fetching ${type} vendors...`);

      // Récupérer tous les vendeurs puis filtrer par type
      const allVendors = await this.getAllVendors();
      const filteredVendors = allVendors.filter(vendor => vendor.vendeur_type === type);

      this.setCache(cacheKey, filteredVendors);
      console.log(`✅ [VendorService] Found ${filteredVendors.length} ${type} vendors`);

      return filteredVendors;
    } catch (error) {
      console.error(`❌ [VendorService] Error fetching ${type} vendors:`, error);
      return [];
    }
  }

  async getArtists(): Promise<Vendor[]> {
    return this.getVendorsByType('ARTISTE');
  }

  async getDesigners(): Promise<Vendor[]> {
    return this.getVendorsByType('DESIGNER');
  }

  async getInfluencers(): Promise<Vendor[]> {
    return this.getVendorsByType('INFLUENCEUR');
  }

  // Transforme un Vendor en format compatible avec les interfaces existantes
  transformVendorToCard(vendor: Vendor): {
    id: number;
    firstName: string;
    shopName: string | null;
    name: string;
    role: string;
    rating: number;
    imageUrl: string;
    shopUrl?: string;
  } {
    // Créer le nom complet
    const fullName = `${vendor.firstName} ${vendor.lastName}`.trim();

    // Déterminer le rôle selon le type
    const roleMap = {
      'ARTISTE': 'Artiste / Musicien',
      'DESIGNER': 'Designer Créatif',
      'INFLUENCEUR': 'Influenceur Digital',
      'OTHER': 'Créateur'
    };

    let role = roleMap[vendor.vendeur_type] || 'Créateur';

    // Pour les influenceurs, utiliser le nom de la boutique s'il existe, sinon le rôle par défaut
    if (vendor.vendeur_type === 'INFLUENCEUR' && vendor.shop_name) {
      role = vendor.shop_name;
    }

    // Utiliser la photo de profil ou une image par défaut selon le type
    let imageUrl = '/default-avatar.svg';
    if (vendor.profile_photo_url) {
      imageUrl = vendor.profile_photo_url;
    } else if (vendor.photo_profil) {
      imageUrl = vendor.photo_profil;
    } else {
      // Images par défaut selon le type
      const defaultImages = {
        'ARTISTE': '/x_artiste.svg',
        'DESIGNER': '/x_designer.svg',
        'INFLUENCEUR': '/x_influencer.svg',
        'OTHER': '/default-avatar.svg'
      };
      imageUrl = defaultImages[vendor.vendeur_type] || '/default-avatar.svg';
    }

    return {
      id: vendor.id,
      firstName: vendor.firstName,
      shopName: vendor.shop_name,
      name: vendor.firstName, // Garder firstName pour la compatibilité
      role: role,
      rating: 4.5 + Math.random() * 0.5, // Rating aléatoire entre 4.5 et 5.0
      imageUrl: imageUrl,
      shopUrl: `/profile/${vendor.vendeur_type.toLowerCase()}/${vendor.id}`
    };
  }

  // Méthode utilitaire pour vider le cache
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ [VendorService] Cache cleared');
  }
}

export const VendorServiceInstance = new VendorService();
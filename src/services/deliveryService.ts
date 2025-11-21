// Service de gestion des zones de livraison
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';
import AuthManager from '../utils/authUtils';

// ========================================
// TYPES & INTERFACES (Réponses de l'API)
// ========================================

// Types retournés par l'API (price en string car c'est un Decimal)
export interface City {
  id: string;
  name: string;
  category: string;
  zoneType: 'dakar-ville' | 'banlieue';
  status: 'active' | 'inactive';
  price: string; // API renvoie un Decimal en string (ex: "1500.00")
  isFree: boolean;
  deliveryTimeMin?: number | null;
  deliveryTimeMax?: number | null;
  deliveryTimeUnit?: 'heures' | 'jours' | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Region {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  price: string; // API renvoie un Decimal en string (ex: "3000.00")
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit: string;
  mainCities?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InternationalZone {
  id: string;
  name: string;
  countries: string[];
  status: 'active' | 'inactive';
  price: string; // API renvoie un Decimal en string (ex: "15000.00")
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transporteur {
  id: string;
  name: string;
  logoUrl?: string | null;
  deliveryZones: string[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface ZoneTarif {
  id: string;
  zoneId: string;
  zoneName: string;
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: string; // API renvoie un Decimal en string
  prixStandardInternational: string; // API renvoie un Decimal en string
  delaiLivraisonMin: number;
  delaiLivraisonMax: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCityPayload {
  name: string;
  category: string;
  status: 'active' | 'inactive';
  price: number;
  isFree: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: 'heures' | 'jours';
  zoneType: 'dakar-ville' | 'banlieue';
}

export interface UpdateCityPayload extends Partial<CreateCityPayload> {
  id: string;
}

export interface CreateRegionPayload {
  name: string;
  status: 'active' | 'inactive';
  price: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit: 'heures' | 'jours';
  mainCities: string;
}

export interface UpdateRegionPayload extends Partial<CreateRegionPayload> {
  id: string;
}

export interface CreateInternationalZonePayload {
  name: string;
  countries: string[];
  status: 'active' | 'inactive';
  price: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}

export interface UpdateInternationalZonePayload extends Partial<CreateInternationalZonePayload> {
  id: string;
}

export interface CreateTransporteurPayload {
  name: string;
  logoUrl: string;
  deliveryZones: string[];
  status: 'active' | 'inactive';
}

export interface UpdateTransporteurPayload extends Partial<CreateTransporteurPayload> {
  id: string;
}

export interface CreateZoneTarifPayload {
  zoneId: string;
  zoneName: string;
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: number;
  prixStandardInternational: number;
  delaiLivraisonMin: number;
  delaiLivraisonMax: number;
  status: 'active' | 'inactive';
}

export interface UpdateZoneTarifPayload extends Partial<CreateZoneTarifPayload> {
  id: string;
}

// ========================================
// DELIVERY SERVICE CLASS
// ========================================

class DeliveryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = AuthManager.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // ========================================
  // CITIES (DAKAR VILLE & BANLIEUE)
  // ========================================

  /**
   * Récupère toutes les villes (Dakar ville + banlieue)
   */
  async getCities(zoneType?: 'dakar-ville' | 'banlieue'): Promise<City[]> {
    const query = zoneType ? `?zoneType=${zoneType}` : '';
    return this.makeRequest<City[]>(`/delivery/cities${query}`);
  }

  /**
   * Récupère une ville par son ID
   */
  async getCityById(id: string): Promise<City> {
    return this.makeRequest<City>(`/delivery/cities/${id}`);
  }

  /**
   * Crée une nouvelle ville
   */
  async createCity(payload: CreateCityPayload): Promise<City> {
    return this.makeRequest<City>('/delivery/cities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Met à jour une ville
   */
  async updateCity(id: string, payload: Partial<CreateCityPayload>): Promise<City> {
    return this.makeRequest<City>(`/delivery/cities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Supprime une ville
   */
  async deleteCity(id: string): Promise<void> {
    return this.makeRequest<void>(`/delivery/cities/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Change le statut d'une ville (active/inactive)
   */
  async toggleCityStatus(id: string): Promise<City> {
    return this.makeRequest<City>(`/delivery/cities/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // ========================================
  // REGIONS (13 régions du Sénégal)
  // ========================================

  /**
   * Récupère toutes les régions
   */
  async getRegions(): Promise<Region[]> {
    return this.makeRequest<Region[]>('/delivery/regions');
  }

  /**
   * Récupère une région par son ID
   */
  async getRegionById(id: string): Promise<Region> {
    return this.makeRequest<Region>(`/delivery/regions/${id}`);
  }

  /**
   * Crée une nouvelle région
   */
  async createRegion(payload: CreateRegionPayload): Promise<Region> {
    return this.makeRequest<Region>('/delivery/regions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Met à jour une région
   */
  async updateRegion(id: string, payload: Partial<CreateRegionPayload>): Promise<Region> {
    return this.makeRequest<Region>(`/delivery/regions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Supprime une région
   */
  async deleteRegion(id: string): Promise<void> {
    return this.makeRequest<void>(`/delivery/regions/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Change le statut d'une région (active/inactive)
   */
  async toggleRegionStatus(id: string): Promise<Region> {
    return this.makeRequest<Region>(`/delivery/regions/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // ========================================
  // INTERNATIONAL ZONES
  // ========================================

  /**
   * Récupère toutes les zones internationales
   */
  async getInternationalZones(): Promise<InternationalZone[]> {
    return this.makeRequest<InternationalZone[]>('/delivery/international-zones');
  }

  /**
   * Récupère une zone internationale par son ID
   */
  async getInternationalZoneById(id: string): Promise<InternationalZone> {
    return this.makeRequest<InternationalZone>(`/delivery/international-zones/${id}`);
  }

  /**
   * Crée une nouvelle zone internationale
   */
  async createInternationalZone(payload: CreateInternationalZonePayload): Promise<InternationalZone> {
    return this.makeRequest<InternationalZone>('/delivery/international-zones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Met à jour une zone internationale
   */
  async updateInternationalZone(
    id: string,
    payload: Partial<CreateInternationalZonePayload>
  ): Promise<InternationalZone> {
    return this.makeRequest<InternationalZone>(`/delivery/international-zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Supprime une zone internationale
   */
  async deleteInternationalZone(id: string): Promise<void> {
    return this.makeRequest<void>(`/delivery/international-zones/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Change le statut d'une zone internationale (active/inactive)
   */
  async toggleInternationalZoneStatus(id: string): Promise<InternationalZone> {
    return this.makeRequest<InternationalZone>(`/delivery/international-zones/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // ========================================
  // TRANSPORTEURS
  // ========================================

  /**
   * Récupère tous les transporteurs
   */
  async getTransporteurs(): Promise<Transporteur[]> {
    return this.makeRequest<Transporteur[]>('/delivery/transporteurs');
  }

  /**
   * Récupère un transporteur par son ID
   */
  async getTransporteurById(id: string): Promise<Transporteur> {
    return this.makeRequest<Transporteur>(`/delivery/transporteurs/${id}`);
  }

  /**
   * Crée un nouveau transporteur
   */
  async createTransporteur(payload: CreateTransporteurPayload): Promise<Transporteur> {
    return this.makeRequest<Transporteur>('/delivery/transporteurs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Met à jour un transporteur
   */
  async updateTransporteur(
    id: string,
    payload: Partial<CreateTransporteurPayload>
  ): Promise<Transporteur> {
    return this.makeRequest<Transporteur>(`/delivery/transporteurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Supprime un transporteur
   */
  async deleteTransporteur(id: string): Promise<void> {
    return this.makeRequest<void>(`/delivery/transporteurs/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Change le statut d'un transporteur (active/inactive)
   */
  async toggleTransporteurStatus(id: string): Promise<Transporteur> {
    return this.makeRequest<Transporteur>(`/delivery/transporteurs/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // ========================================
  // ZONE TARIFS (Association Zone + Transporteur)
  // ========================================

  /**
   * Récupère tous les tarifs de zones
   */
  async getZoneTarifs(): Promise<ZoneTarif[]> {
    return this.makeRequest<ZoneTarif[]>('/delivery/zone-tarifs');
  }

  /**
   * Récupère un tarif de zone par son ID
   */
  async getZoneTarifById(id: string): Promise<ZoneTarif> {
    return this.makeRequest<ZoneTarif>(`/delivery/zone-tarifs/${id}`);
  }

  /**
   * Crée un nouveau tarif de zone
   */
  async createZoneTarif(payload: CreateZoneTarifPayload): Promise<ZoneTarif> {
    return this.makeRequest<ZoneTarif>('/delivery/zone-tarifs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Met à jour un tarif de zone
   */
  async updateZoneTarif(
    id: string,
    payload: Partial<CreateZoneTarifPayload>
  ): Promise<ZoneTarif> {
    return this.makeRequest<ZoneTarif>(`/delivery/zone-tarifs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Supprime un tarif de zone
   */
  async deleteZoneTarif(id: string): Promise<void> {
    return this.makeRequest<void>(`/delivery/zone-tarifs/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Change le statut d'un tarif de zone (active/inactive)
   */
  async toggleZoneTarifStatus(id: string): Promise<ZoneTarif> {
    return this.makeRequest<ZoneTarif>(`/delivery/zone-tarifs/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // ========================================
  // CALCUL DE FRAIS DE LIVRAISON
  // ========================================

  /**
   * Calcule les frais de livraison pour une commande
   */
  async calculateDeliveryFee(
    cityId?: string,
    regionId?: string,
    internationalZoneId?: string
  ): Promise<{ fee: number; deliveryTime: string }> {
    const params = new URLSearchParams();
    if (cityId) params.append('cityId', cityId);
    if (regionId) params.append('regionId', regionId);
    if (internationalZoneId) params.append('internationalZoneId', internationalZoneId);

    return this.makeRequest<{ fee: number; deliveryTime: string }>(
      `/delivery/calculate-fee?${params.toString()}`
    );
  }
}

// Export singleton instance
export const deliveryService = new DeliveryService();
export default deliveryService;

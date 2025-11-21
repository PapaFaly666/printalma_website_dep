// Service API pour la gestion des zones de livraison
// Basé sur la documentation DELIVERY_API_GUIDE_FRONTEND.md
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

// ========================================
// TYPES TYPESCRIPT (selon la doc)
// ========================================

export interface City {
  id: string;
  name: string;
  category: string;
  zoneType: 'dakar-ville' | 'banlieue';
  status: 'active' | 'inactive';
  price: string; // L'API renvoie un Decimal en string (ex: "1500.00")
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
  price: string; // Decimal en string
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
  status: 'active' | 'inactive';
  price: string; // Decimal en string
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  countries: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Transporteur {
  id: string;
  name: string;
  logoUrl?: string | null;
  status: 'active' | 'inactive';
  deliveryZones: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ZoneTarif {
  id: string;
  zoneId: string;
  zoneName: string;
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: string; // Decimal en string
  prixStandardInternational: string; // Decimal en string
  delaiLivraisonMin: number;
  delaiLivraisonMax: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryFee {
  fee: number;
  deliveryTime: string;
}

// DTOs pour la création (price en number)
export interface CreateCityDto {
  name: string;
  category: string;
  zoneType: 'dakar-ville' | 'banlieue';
  status?: 'active' | 'inactive';
  price: number;
  isFree: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: 'heures' | 'jours';
}

export interface CreateRegionDto {
  name: string;
  status?: 'active' | 'inactive';
  price: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit?: string;
  mainCities?: string;
}

export interface CreateInternationalZoneDto {
  name: string;
  countries: string[];
  status?: 'active' | 'inactive';
  price: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}

export interface CreateTransporteurDto {
  name: string;
  logoUrl?: string;
  deliveryZones?: string[];
  status?: 'active' | 'inactive';
}

export interface CreateZoneTarifDto {
  zoneId: string;
  zoneName: string;
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: number;
  prixStandardInternational: number;
  delaiLivraisonMin: number;
  delaiLivraisonMax: number;
  status?: 'active' | 'inactive';
}

// ========================================
// API CLIENT AXIOS
// ========================================

export const deliveryApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token d'authentification
deliveryApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs globalement
deliveryApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          console.error('Non authentifié - Redirection vers /login');
          // window.location.href = '/login';
          break;
        case 403:
          console.error('Non autorisé - Permissions insuffisantes');
          break;
        case 404:
          console.error('Ressource non trouvée');
          break;
        case 409:
          console.error('Conflit - Ressource déjà existante');
          break;
        case 500:
          console.error('Erreur serveur');
          break;
      }
    }

    return Promise.reject(error);
  }
);

// ========================================
// SERVICE DE LIVRAISON
// ========================================

class DeliveryApiService {
  // ========== CITIES (Villes) ==========

  async getCities(zoneType?: 'dakar-ville' | 'banlieue'): Promise<City[]> {
    const params = zoneType ? { zoneType } : {};
    const response = await deliveryApiClient.get('/delivery/cities', { params });
    return response.data;
  }

  async getCityById(id: string): Promise<City> {
    const response = await deliveryApiClient.get(`/delivery/cities/${id}`);
    return response.data;
  }

  async createCity(data: CreateCityDto): Promise<City> {
    const response = await deliveryApiClient.post('/delivery/cities', data);
    return response.data;
  }

  async updateCity(id: string, data: Partial<CreateCityDto>): Promise<City> {
    const response = await deliveryApiClient.put(`/delivery/cities/${id}`, data);
    return response.data;
  }

  async deleteCity(id: string): Promise<void> {
    await deliveryApiClient.delete(`/delivery/cities/${id}`);
  }

  async toggleCityStatus(id: string): Promise<City> {
    const response = await deliveryApiClient.patch(`/delivery/cities/${id}/toggle-status`);
    return response.data;
  }

  // ========== REGIONS (Régions) ==========

  async getRegions(): Promise<Region[]> {
    const response = await deliveryApiClient.get('/delivery/regions');
    return response.data;
  }

  async getRegionById(id: string): Promise<Region> {
    const response = await deliveryApiClient.get(`/delivery/regions/${id}`);
    return response.data;
  }

  async createRegion(data: CreateRegionDto): Promise<Region> {
    const response = await deliveryApiClient.post('/delivery/regions', data);
    return response.data;
  }

  async updateRegion(id: string, data: Partial<CreateRegionDto>): Promise<Region> {
    const response = await deliveryApiClient.put(`/delivery/regions/${id}`, data);
    return response.data;
  }

  async deleteRegion(id: string): Promise<void> {
    await deliveryApiClient.delete(`/delivery/regions/${id}`);
  }

  async toggleRegionStatus(id: string): Promise<Region> {
    const response = await deliveryApiClient.patch(`/delivery/regions/${id}/toggle-status`);
    return response.data;
  }

  // ========== INTERNATIONAL ZONES ==========

  async getInternationalZones(): Promise<InternationalZone[]> {
    const response = await deliveryApiClient.get('/delivery/international-zones');
    return response.data;
  }

  async getInternationalZoneById(id: string): Promise<InternationalZone> {
    const response = await deliveryApiClient.get(`/delivery/international-zones/${id}`);
    return response.data;
  }

  async createInternationalZone(data: CreateInternationalZoneDto): Promise<InternationalZone> {
    const response = await deliveryApiClient.post('/delivery/international-zones', data);
    return response.data;
  }

  async updateInternationalZone(id: string, data: Partial<CreateInternationalZoneDto>): Promise<InternationalZone> {
    const response = await deliveryApiClient.put(`/delivery/international-zones/${id}`, data);
    return response.data;
  }

  async deleteInternationalZone(id: string): Promise<void> {
    await deliveryApiClient.delete(`/delivery/international-zones/${id}`);
  }

  async toggleInternationalZoneStatus(id: string): Promise<InternationalZone> {
    const response = await deliveryApiClient.patch(`/delivery/international-zones/${id}/toggle-status`);
    return response.data;
  }

  // ========== TRANSPORTEURS ==========

  async getTransporteurs(): Promise<Transporteur[]> {
    const response = await deliveryApiClient.get('/delivery/transporteurs');
    return response.data;
  }

  async getTransporteurById(id: string): Promise<Transporteur> {
    const response = await deliveryApiClient.get(`/delivery/transporteurs/${id}`);
    return response.data;
  }

  async createTransporteur(data: CreateTransporteurDto): Promise<Transporteur> {
    const response = await deliveryApiClient.post('/delivery/transporteurs', data);
    return response.data;
  }

  async updateTransporteur(id: string, data: Partial<CreateTransporteurDto>): Promise<Transporteur> {
    const response = await deliveryApiClient.put(`/delivery/transporteurs/${id}`, data);
    return response.data;
  }

  async deleteTransporteur(id: string): Promise<void> {
    await deliveryApiClient.delete(`/delivery/transporteurs/${id}`);
  }

  async toggleTransporteurStatus(id: string): Promise<Transporteur> {
    const response = await deliveryApiClient.patch(`/delivery/transporteurs/${id}/toggle-status`);
    return response.data;
  }

  // ========== ZONE TARIFS ==========

  async getZoneTarifs(): Promise<ZoneTarif[]> {
    const response = await deliveryApiClient.get('/delivery/zone-tarifs');
    return response.data;
  }

  async getZoneTarifById(id: string): Promise<ZoneTarif> {
    const response = await deliveryApiClient.get(`/delivery/zone-tarifs/${id}`);
    return response.data;
  }

  async createZoneTarif(data: CreateZoneTarifDto): Promise<ZoneTarif> {
    const response = await deliveryApiClient.post('/delivery/zone-tarifs', data);
    return response.data;
  }

  async updateZoneTarif(id: string, data: Partial<CreateZoneTarifDto>): Promise<ZoneTarif> {
    const response = await deliveryApiClient.put(`/delivery/zone-tarifs/${id}`, data);
    return response.data;
  }

  async deleteZoneTarif(id: string): Promise<void> {
    await deliveryApiClient.delete(`/delivery/zone-tarifs/${id}`);
  }

  async toggleZoneTarifStatus(id: string): Promise<ZoneTarif> {
    const response = await deliveryApiClient.patch(`/delivery/zone-tarifs/${id}/toggle-status`);
    return response.data;
  }

  // ========== CALCUL DE FRAIS ==========

  async calculateDeliveryFee(params: {
    cityId?: string;
    regionId?: string;
    internationalZoneId?: string;
  }): Promise<DeliveryFee> {
    const response = await deliveryApiClient.get('/delivery/calculate-fee', { params });
    return response.data;
  }
}

// Export singleton instance
export const deliveryApiService = new DeliveryApiService();
export default deliveryApiService;

// Types pour le système de livraison

export interface DeliveryCity {
  id: string;
  name: string;
  category: 'Centre' | 'Résidentiel' | 'Populaire' | 'Banlieue';
  zoneType: 'dakar-ville' | 'banlieue';
  price: number;
  status: 'active' | 'inactive';
}

export interface DeliveryRegion {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
}

export interface InternationalZone {
  id: string;
  name: string;
  price: number;
  countries: string[];
  status: 'active' | 'inactive';
}

export interface DeliveryResponse {
  fee: number;
  deliveryTime: string;
}

export interface DeliveryCalculationParams {
  cityId?: string;
  regionId?: string;
  internationalZoneId?: string;
}

export type DeliveryType = 'city' | 'region' | 'international';

export interface DeliveryInfo {
  type: DeliveryType;
  id: string;
  name: string;
  fee: number;
  deliveryTime: string;
}

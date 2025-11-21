// Hook personnalisé pour la gestion des zones de livraison
import { useState, useEffect, useCallback } from 'react';
import deliveryService, {
  City,
  Region,
  InternationalZone,
  Transporteur,
  ZoneTarif,
  CreateCityPayload,
  CreateRegionPayload,
  CreateInternationalZonePayload,
  CreateTransporteurPayload,
  CreateZoneTarifPayload,
} from '../services/deliveryService';

// ========================================
// HOOK POUR LES VILLES
// ========================================

export const useCities = (zoneType?: 'dakar-ville' | 'banlieue') => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getCities(zoneType);
      setCities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des villes');
    } finally {
      setLoading(false);
    }
  }, [zoneType]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const createCity = async (payload: CreateCityPayload) => {
    try {
      const newCity = await deliveryService.createCity(payload);
      setCities((prev) => [...prev, newCity]);
      return newCity;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  const updateCity = async (id: string, payload: Partial<CreateCityPayload>) => {
    try {
      const updatedCity = await deliveryService.updateCity(id, payload);
      setCities((prev) => prev.map((city) => (city.id === id ? updatedCity : city)));
      return updatedCity;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const deleteCity = async (id: string) => {
    try {
      await deliveryService.deleteCity(id);
      setCities((prev) => prev.filter((city) => city.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const toggleCityStatus = async (id: string) => {
    try {
      const updatedCity = await deliveryService.toggleCityStatus(id);
      setCities((prev) => prev.map((city) => (city.id === id ? updatedCity : city)));
      return updatedCity;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    }
  };

  return {
    cities,
    loading,
    error,
    refetch: fetchCities,
    createCity,
    updateCity,
    deleteCity,
    toggleCityStatus,
  };
};

// ========================================
// HOOK POUR LES RÉGIONS
// ========================================

export const useRegions = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getRegions();
      setRegions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des régions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const createRegion = async (payload: CreateRegionPayload) => {
    try {
      const newRegion = await deliveryService.createRegion(payload);
      setRegions((prev) => [...prev, newRegion]);
      return newRegion;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  const updateRegion = async (id: string, payload: Partial<CreateRegionPayload>) => {
    try {
      const updatedRegion = await deliveryService.updateRegion(id, payload);
      setRegions((prev) => prev.map((region) => (region.id === id ? updatedRegion : region)));
      return updatedRegion;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const deleteRegion = async (id: string) => {
    try {
      await deliveryService.deleteRegion(id);
      setRegions((prev) => prev.filter((region) => region.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const toggleRegionStatus = async (id: string) => {
    try {
      const updatedRegion = await deliveryService.toggleRegionStatus(id);
      setRegions((prev) => prev.map((region) => (region.id === id ? updatedRegion : region)));
      return updatedRegion;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    }
  };

  return {
    regions,
    loading,
    error,
    refetch: fetchRegions,
    createRegion,
    updateRegion,
    deleteRegion,
    toggleRegionStatus,
  };
};

// ========================================
// HOOK POUR LES ZONES INTERNATIONALES
// ========================================

export const useInternationalZones = () => {
  const [zones, setZones] = useState<InternationalZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getInternationalZones();
      setZones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des zones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const createZone = async (payload: CreateInternationalZonePayload) => {
    try {
      const newZone = await deliveryService.createInternationalZone(payload);
      setZones((prev) => [...prev, newZone]);
      return newZone;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  const updateZone = async (id: string, payload: Partial<CreateInternationalZonePayload>) => {
    try {
      const updatedZone = await deliveryService.updateInternationalZone(id, payload);
      setZones((prev) => prev.map((zone) => (zone.id === id ? updatedZone : zone)));
      return updatedZone;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const deleteZone = async (id: string) => {
    try {
      await deliveryService.deleteInternationalZone(id);
      setZones((prev) => prev.filter((zone) => zone.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const toggleZoneStatus = async (id: string) => {
    try {
      const updatedZone = await deliveryService.toggleInternationalZoneStatus(id);
      setZones((prev) => prev.map((zone) => (zone.id === id ? updatedZone : zone)));
      return updatedZone;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    }
  };

  return {
    zones,
    loading,
    error,
    refetch: fetchZones,
    createZone,
    updateZone,
    deleteZone,
    toggleZoneStatus,
  };
};

// ========================================
// HOOK POUR LES TRANSPORTEURS
// ========================================

export const useTransporteurs = () => {
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransporteurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getTransporteurs();
      setTransporteurs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des transporteurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransporteurs();
  }, [fetchTransporteurs]);

  const createTransporteur = async (payload: CreateTransporteurPayload) => {
    try {
      const newTransporteur = await deliveryService.createTransporteur(payload);
      setTransporteurs((prev) => [...prev, newTransporteur]);
      return newTransporteur;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  const updateTransporteur = async (id: string, payload: Partial<CreateTransporteurPayload>) => {
    try {
      const updatedTransporteur = await deliveryService.updateTransporteur(id, payload);
      setTransporteurs((prev) =>
        prev.map((t) => (t.id === id ? updatedTransporteur : t))
      );
      return updatedTransporteur;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const deleteTransporteur = async (id: string) => {
    try {
      await deliveryService.deleteTransporteur(id);
      setTransporteurs((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const toggleTransporteurStatus = async (id: string) => {
    try {
      const updatedTransporteur = await deliveryService.toggleTransporteurStatus(id);
      setTransporteurs((prev) =>
        prev.map((t) => (t.id === id ? updatedTransporteur : t))
      );
      return updatedTransporteur;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    }
  };

  return {
    transporteurs,
    loading,
    error,
    refetch: fetchTransporteurs,
    createTransporteur,
    updateTransporteur,
    deleteTransporteur,
    toggleTransporteurStatus,
  };
};

// ========================================
// HOOK POUR LES TARIFS DE ZONES
// ========================================

export const useZoneTarifs = () => {
  const [tarifs, setTarifs] = useState<ZoneTarif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTarifs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getZoneTarifs();
      setTarifs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tarifs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTarifs();
  }, [fetchTarifs]);

  const createTarif = async (payload: CreateZoneTarifPayload) => {
    try {
      const newTarif = await deliveryService.createZoneTarif(payload);
      setTarifs((prev) => [...prev, newTarif]);
      return newTarif;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  const updateTarif = async (id: string, payload: Partial<CreateZoneTarifPayload>) => {
    try {
      const updatedTarif = await deliveryService.updateZoneTarif(id, payload);
      setTarifs((prev) => prev.map((tarif) => (tarif.id === id ? updatedTarif : tarif)));
      return updatedTarif;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const deleteTarif = async (id: string) => {
    try {
      await deliveryService.deleteZoneTarif(id);
      setTarifs((prev) => prev.filter((tarif) => tarif.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const toggleTarifStatus = async (id: string) => {
    try {
      const updatedTarif = await deliveryService.toggleZoneTarifStatus(id);
      setTarifs((prev) => prev.map((tarif) => (tarif.id === id ? updatedTarif : tarif)));
      return updatedTarif;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    }
  };

  return {
    tarifs,
    loading,
    error,
    refetch: fetchTarifs,
    createTarif,
    updateTarif,
    deleteTarif,
    toggleTarifStatus,
  };
};

// ========================================
// HOOK POUR LE CALCUL DE FRAIS
// ========================================

export const useDeliveryFeeCalculator = () => {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateFee = async (
    cityId?: string,
    regionId?: string,
    internationalZoneId?: string
  ) => {
    try {
      setCalculating(true);
      setError(null);
      const result = await deliveryService.calculateDeliveryFee(
        cityId,
        regionId,
        internationalZoneId
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du calcul';
      setError(message);
      throw new Error(message);
    } finally {
      setCalculating(false);
    }
  };

  return {
    calculateFee,
    calculating,
    error,
  };
};

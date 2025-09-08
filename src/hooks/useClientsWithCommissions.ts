import { useState, useEffect } from 'react';
import { useClients } from './useClients';
import { commissionService, VendorCommissionData } from '../services/commissionService';
import { 
  ListClientsQuery, 
  ClientInfo
} from '../types/auth.types';

// Interface étendue pour les clients avec commissions
export interface ClientWithCommission extends ClientInfo {
  commissionRate: number;
  estimatedMonthlyRevenue?: number;
  lastUpdated?: string;
}

export const useClientsWithCommissions = (initialFilters: ListClientsQuery = {}) => {
  const clientsHook = useClients(initialFilters);
  const [commissions, setCommissions] = useState<VendorCommissionData[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [commissionsError, setCommissionsError] = useState<string | null>(null);

  // Charger les données de commission depuis le backend
  const loadCommissions = async () => {
    if (clientsHook.clients.length === 0) return;
    
    setCommissionsLoading(true);
    setCommissionsError(null);
    
    try {
      const commissionsData = await commissionService.getAllVendorCommissions();
      setCommissions(commissionsData);
    } catch (err: any) {
      console.warn('❌ Erreur lors du chargement des commissions:', err.message);
      setCommissionsError(err.message || 'Erreur lors du chargement des commissions');
      // En cas d'erreur, utiliser des valeurs par défaut
      setCommissions([]);
    } finally {
      setCommissionsLoading(false);
    }
  };

  // Recharger les commissions après mise à jour des clients
  const refreshAll = async () => {
    await clientsHook.refreshClients();
    await loadCommissions();
  };

  // Combiner les données des clients avec leurs commissions
  const clientsWithCommissions: ClientWithCommission[] = clientsHook.clients.map(client => {
    const commissionData = commissions.find(c => c.vendorId === client.id);
    
    return {
      ...client,
      commissionRate: commissionData?.commissionRate ?? 40, // Défaut 40% si pas trouvé
      estimatedMonthlyRevenue: commissionData?.estimatedMonthlyRevenue,
      lastUpdated: commissionData?.lastUpdated
    };
  });

  // Charger les commissions quand les clients changent
  useEffect(() => {
    if (clientsHook.clients.length > 0 && !clientsHook.loading) {
      loadCommissions();
    }
  }, [clientsHook.clients.length, clientsHook.loading]);

  // Fonction pour mettre à jour une commission
  const updateCommission = async (vendeurId: number, commissionRate: number) => {
    try {
      await commissionService.updateVendorCommission(vendeurId, commissionRate);
      
      // Mettre à jour localement la commission pour un feedback immédiat
      setCommissions(prev => {
        const existing = prev.find(c => c.vendorId === vendeurId);
        if (existing) {
          // Mettre à jour l'existant
          return prev.map(c => 
            c.vendorId === vendeurId 
              ? { ...c, commissionRate, lastUpdated: new Date().toISOString() }
              : c
          );
        } else {
          // Ajouter un nouvel élément si pas trouvé
          const client = clientsHook.clients.find(c => c.id === vendeurId);
          if (client) {
            const newCommission: VendorCommissionData = {
              vendorId: vendeurId,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              vendeur_type: client.vendeur_type,
              commissionRate,
              lastUpdated: new Date().toISOString()
            };
            return [...prev, newCommission];
          }
        }
        return prev;
      });
      
      // Optionnel: recharger toutes les données pour s'assurer de la synchronisation
      // setTimeout(() => loadCommissions(), 1000);
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la commission:', error);
      throw error;
    }
  };

  return {
    // Data combinée
    clients: clientsWithCommissions,
    pagination: clientsHook.pagination,
    loading: clientsHook.loading || commissionsLoading,
    error: clientsHook.error || commissionsError,
    filters: clientsHook.filters,
    
    // Data séparée pour debug
    commissions,
    commissionsLoading,
    commissionsError,
    
    // Actions des clients (héritées)
    loadClients: clientsHook.loadClients,
    toggleClientStatus: clientsHook.toggleClientStatus,
    resetClientPassword: clientsHook.resetClientPassword,
    unlockClient: clientsHook.unlockClient,
    updateFilters: clientsHook.updateFilters,
    goToPage: clientsHook.goToPage,
    resetFilters: clientsHook.resetFilters,
    clearError: clientsHook.clearError,
    
    // Actions spécifiques aux commissions
    updateCommission,
    refreshAll,
    refreshClients: refreshAll, // Alias pour compatibilité
    loadCommissions
  };
};
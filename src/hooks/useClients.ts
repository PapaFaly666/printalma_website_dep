import { useState, useEffect } from 'react';
import authService from '../services/auth.service';
import { 
  ListClientsQuery, 
  ClientInfo, 
  PaginationInfo,
  ClientStatusFilter,
  VendeurType 
} from '../types/auth.types';

export const useClients = (initialFilters: ListClientsQuery = {}) => {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListClientsQuery>(initialFilters);

  const loadClients = async (newFilters?: ListClientsQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = newFilters || filters;
      const response = await authService.listClients(filtersToUse);
      
      setClients(response.clients);
      setPagination(response.pagination);
      setFilters(filtersToUse);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (clientId: number) => {
    try {
      const result = await authService.toggleClientStatus(clientId);
      // Recharger la liste après modification
      await loadClients();
      return result;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification du statut');
      throw err;
    }
  };

  const resetClientPassword = async (email: string) => {
    try {
      const result = await authService.resetVendorPassword(email);
      // Recharger la liste pour mettre à jour les informations
      await loadClients();
      return result;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation du mot de passe');
      throw err;
    }
  };

  const unlockClient = async (clientId: number) => {
    try {
      const result = await authService.unlockUserAccount(clientId);
      
      // Recharger la liste pour mettre à jour les informations
      await loadClients();
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du déblocage du client');
      throw err;
    }
  };

  const updateFilters = (newFilters: Partial<ListClientsQuery>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset à la page 1
    loadClients(updatedFilters);
  };

  const goToPage = (page: number) => {
    loadClients({ ...filters, page });
  };

  const resetFilters = () => {
    const resetFilters = { page: 1, limit: 10 };
    loadClients(resetFilters);
  };

  const refreshClients = () => {
    loadClients();
  };

  useEffect(() => {
    loadClients();
  }, []);

  return {
    // Data
    clients,
    pagination,
    loading,
    error,
    filters,
    
    // Actions
    loadClients,
    toggleClientStatus,
    resetClientPassword,
    unlockClient,
    updateFilters,
    goToPage,
    resetFilters,
    refreshClients,
    
    // Utilities
    clearError: () => setError(null)
  };
}; 
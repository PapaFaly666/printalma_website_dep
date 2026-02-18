import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useClientsWithCommissions } from '../hooks/useClientsWithCommissions';
import { useClientStats } from '../hooks/useClientStats';
import CreateClientForm from '../components/auth/CreateClientForm';
import { ClientsFilters } from '../components/ClientsFilters';
import { ClientsTable } from '../components/ClientsTable';
import { Pagination } from '../components/Pagination';
import { ClientDetailsSheet } from '../components/admin/ClientDetailsSheet';
import { VendorTypesManagementModal } from '../components/admin/VendorTypesManagementModal';
import { AdminButton } from '../components/admin/AdminButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { UserPlus, Users, UserCheck, UserX, Activity, RefreshCw, Tag } from 'lucide-react';

import { RequireAuth } from '../components/auth/RequireAuth';

const ClientManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showVendorTypeModal, setShowVendorTypeModal] = useState(false);
  const { isAdmin, isSuperAdmin} = useAuth();
  
  const {
    clients,
    pagination,
    loading,
    error,
    filters,
    toggleClientStatus,
    resetClientPassword,
    unlockClient,
    updateFilters,
    goToPage,
    resetFilters,
    refreshClients,
    clearError,
    updateCommission
  } = useClientsWithCommissions({ page: 1, limit: 10 });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refreshStats
  } = useClientStats();

  // Frontend-only status filter state
  const [frontendStatus, setFrontendStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const mapFrontendStatusToBool = (s: 'all' | 'active' | 'inactive'): boolean | undefined => {
    if (s === 'all') return undefined;
    return s === 'active';
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refreshClients();
    refreshStats();
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleToggleStatus = async (clientId: number, currentStatus: boolean) => {
    await toggleClientStatus(clientId);
    refreshStats(); // Mettre à jour les statistiques
  };

  const handleResetPassword = async (email: string) => {
    return await resetClientPassword(email);
  };

  const handleUnlockClient = async (clientId: number) => unlockClient(clientId);

  const handleUpdateCommission = async (vendeurId: number, commission: number) => updateCommission(vendeurId, commission);

  const handleViewDetails = (client: any) => {
    setSelectedClientForDetails(client);
    setShowDetailsSheet(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsSheet(false);
    setSelectedClientForDetails(null);
  };

  const handleSoftDeleteVendor = async (vendorId: number) => {
    const { authService } = await import('../services/auth.service');
    await authService.softDeleteVendor(vendorId);
    await refreshClients();
  };

  const handleRefreshAll = () => {
    refreshClients();
    refreshStats();
  };

  // Wrap filters change to keep status filtering on frontend only
  const handleFiltersChange = (partial: any) => {
    if (Object.prototype.hasOwnProperty.call(partial, 'status')) {
      const incoming = partial.status as boolean | undefined;
      const nextFrontendStatus: 'all' | 'active' | 'inactive' = incoming === undefined ? 'all' : (incoming ? 'active' : 'inactive');
      setFrontendStatus(nextFrontendStatus);
      const { status, ...rest } = partial;
      updateFilters(rest);
    } else {
      updateFilters(partial);
    }
  };

  const handleReset = () => {
    setFrontendStatus('all');
    resetFilters();
  };

  // Compute displayed clients based on frontend status filter
  const displayedClients = clients.filter(c => {
    const s = mapFrontendStatusToBool(frontendStatus);
    if (s === undefined) return true;
    return !!c.status === s;
  });

  // Vérifier les permissions
  if (!isAdmin() && !isSuperAdmin()) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Accès refusé
            </h2>
            <p className="text-gray-600">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CreateClientForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-h-screen bg-gray-50">
        {/* En-tête simplifié */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6"
        >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gestion des vendeurs
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{pagination ? pagination.total : '...'}</span> vendeur{(pagination && pagination.total > 1) ? 's' : ''}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <span className="font-semibold text-green-600">{displayedClients.filter(c => c.status).length}</span> actif{(displayedClients.filter(c => c.status).length > 1) ? 's' : ''}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <span className="font-semibold text-red-600">{displayedClients.filter(c => !c.status).length}</span> inactif{(displayedClients.filter(c => !c.status).length > 1) ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={loading || statsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </AdminButton>

            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => setShowVendorTypeModal(true)}
            >
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Type vendeur</span>
            </AdminButton>

            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau vendeur</span>
            </AdminButton>
          </div>
        </div>
      </motion.div>

        {/* Contenu principal */}
        <div className="px-4 sm:px-6 py-8">
          {/* Erreurs */}
          {(error || statsError) && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-red-800">{error || statsError}</span>
                <button
                  onClick={() => {
                    clearError();
                  }}
                  className="text-red-600 hover:bg-red-100 rounded p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div className="mb-6">
            <ClientsFilters
              filters={{
                ...filters,
                status: mapFrontendStatusToBool(frontendStatus)
              } as any}
              onFiltersChange={handleFiltersChange}
              onReset={handleReset}
              loading={loading}
            />
          </div>

          {/* Tableau des vendeurs */}
          <Card className="shadow-sm border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Liste des vendeurs
                </h3>
                {pagination && (
                  <Badge variant="outline" className="bg-gray-50">
                    {pagination.total} vendeur{pagination.total > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-0">
              <ClientsTable
                clients={displayedClients}
                loading={loading}
                onToggleStatus={handleToggleStatus}
                onResetPassword={handleResetPassword}
                onUnlockClient={handleUnlockClient}
                onUpdateCommission={handleUpdateCommission}
                onViewDetails={handleViewDetails}
                onSoftDelete={handleSoftDeleteVendor}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 p-4">
                  <Pagination
                    pagination={pagination}
                    onPageChange={goToPage}
                    loading={loading}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sheet de détails du client */}
      <ClientDetailsSheet
        client={selectedClientForDetails}
        isOpen={showDetailsSheet}
        onClose={handleCloseDetails}
        onUpdateCommission={handleUpdateCommission}
      />

      {/* Modal de gestion des types de vendeur */}
      <VendorTypesManagementModal
        open={showVendorTypeModal}
        onOpenChange={setShowVendorTypeModal}
        onSuccess={() => {
          console.log('Type de vendeur géré avec succès');
        }}
      />
    </>
  );
};

export default ClientManagement; 
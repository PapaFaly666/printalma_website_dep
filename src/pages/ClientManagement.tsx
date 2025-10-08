import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClientsWithCommissions } from '../hooks/useClientsWithCommissions';
import { useClientStats } from '../hooks/useClientStats';
import CreateClientForm from '../components/auth/CreateClientForm';
import { ClientsFilters } from '../components/ClientsFilters';
import { ClientsTable } from '../components/ClientsTable';
import { Pagination } from '../components/Pagination';
import { ClientDetailsSheet } from '../components/admin/ClientDetailsSheet';
import { VendorTypesManagementModal } from '../components/admin/VendorTypesManagementModal';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { UserPlus, Users, UserCheck, UserX, Activity, RefreshCw, Info, Shield, AlertTriangle, Clock, Tag } from 'lucide-react';

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
        <div className="w-full px-8 py-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="mb-4 border-gray-300 hover:bg-gray-50"
            >
              ← Retour à la gestion des vendeurs
            </Button>
          </div>
          <div className="max-w-2xl">
            <CreateClientForm
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestion des Vendeurs
                </h1>
                <p className="text-gray-600 mt-1">
                  Créez et gérez les comptes vendeurs de la plateforme
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefreshAll}
                  disabled={loading || statsLoading}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowVendorTypeModal(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Créer Type Vendeur
                </Button>

                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un nouveau vendeur
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="w-full px-8 py-8">
          {/* Erreurs */}
          {(error || statsError) && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error || statsError}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearError();
                  }}
                  className="ml-2 h-auto p-1 text-red-600 hover:bg-red-100"
                >
                  ✕
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Statistiques simplifiées */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vendeurs</CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pagination ? pagination.total : '...'}
                </div>
                <p className="text-xs text-gray-600">Nombre total de vendeurs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendeurs de ce mois</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {displayedClients.length}
                </div>
                <p className="text-xs text-gray-600">Vendeurs affichés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {displayedClients.filter(c => c.status).length}
                </div>
                <p className="text-xs text-gray-600">Comptes actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {displayedClients.filter(c => !c.status).length}
                </div>
                <p className="text-xs text-gray-600">Comptes désactivés</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <ClientsFilters
            filters={{
              ...filters,
              status: mapFrontendStatusToBool(frontendStatus)
            } as any}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            loading={loading}
          />

          {/* Tableau des vendeurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Liste des Vendeurs</span>
                {pagination && (
                  <span className="text-sm font-normal text-gray-600">
                    {pagination.total} vendeur{pagination.total > 1 ? 's' : ''} au total
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Gérez les comptes vendeurs et leurs statuts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ClientsTable
                clients={displayedClients}
                loading={loading}
                onToggleStatus={handleToggleStatus}
                onResetPassword={handleResetPassword}
                onUnlockClient={handleUnlockClient}
                onUpdateCommission={handleUpdateCommission}
                onViewDetails={handleViewDetails}
              />
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <Pagination
                  pagination={pagination}
                  onPageChange={goToPage}
                  loading={loading}
                />
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
    </div>
  );
};

export default ClientManagement; 
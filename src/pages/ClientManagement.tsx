import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClients } from '../hooks/useClients';
import { useClientStats } from '../hooks/useClientStats';
import CreateClientForm from '../components/auth/CreateClientForm';
import { ClientsFilters } from '../components/ClientsFilters';
import { ClientsTable } from '../components/ClientsTable';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { UserPlus, Users, UserCheck, UserX, Activity, RefreshCw, Info, Shield, AlertTriangle, Clock } from 'lucide-react';

const ClientManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { isAdmin, isSuperAdmin } = useAuth();
  
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
    clearError
  } = useClients({ page: 1, limit: 10 });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refreshStats
  } = useClientStats();

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

  const handleUnlockClient = async (clientId: number) => {
    try {
      const result = await unlockClient(clientId);
      return result;
    } catch (error: any) {
      // Afficher un message plus convivial pour les fonctionnalités non disponibles
      alert('Cette fonctionnalité sera bientôt disponible.\nL\'endpoint backend n\'est pas encore implémenté.');
      throw error;
    }
  };

  const handleRefreshAll = () => {
    refreshClients();
    refreshStats();
  };

  // 🆕 Calcul des statistiques de sécurité selon la documentation
  const securityStats = {
    lockedAccounts: clients.filter(client => 
      client.locked_until && new Date(client.locked_until) > new Date()
    ).length,
    failedAttempts: clients.filter(client => 
      client.login_attempts > 0
    ).length,
    mustChangePassword: clients.filter(client => 
      client.must_change_password
    ).length,
    totalSecurityIssues: clients.filter(client =>
      (client.locked_until && new Date(client.locked_until) > new Date()) ||
      client.login_attempts > 0 ||
      client.must_change_password
    ).length
  };

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
                <CardTitle className="text-sm font-medium">Sur cette page</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {clients.length}
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
                  {clients.filter(c => c.status).length}
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
                  {clients.filter(c => !c.status).length}
                </div>
                <p className="text-xs text-gray-600">Comptes désactivés</p>
              </CardContent>
            </Card>
          </div>

          {/* 🆕 Section de sécurité selon la documentation */}
          {securityStats.totalSecurityIssues > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">État de la Sécurité</h3>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {securityStats.totalSecurityIssues} problème(s) détecté(s)
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className={securityStats.lockedAccounts > 0 ? "border-red-200 bg-red-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className={`h-8 w-8 ${securityStats.lockedAccounts > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-2xl font-bold ${securityStats.lockedAccounts > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {securityStats.lockedAccounts}
                        </div>
                        <p className="text-sm text-gray-600">Comptes verrouillés</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={securityStats.failedAttempts > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-8 w-8 ${securityStats.failedAttempts > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-2xl font-bold ${securityStats.failedAttempts > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {securityStats.failedAttempts}
                        </div>
                        <p className="text-sm text-gray-600">Tentatives échouées</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={securityStats.mustChangePassword > 0 ? "border-blue-200 bg-blue-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Shield className={`h-8 w-8 ${securityStats.mustChangePassword > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-2xl font-bold ${securityStats.mustChangePassword > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {securityStats.mustChangePassword}
                        </div>
                        <p className="text-sm text-gray-600">Doivent changer leur mot de passe</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerte de sécurité selon la documentation */}
              {securityStats.lockedAccounts > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <Clock className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Attention :</strong> {securityStats.lockedAccounts} compte(s) temporairement verrouillé(s) suite à de multiples tentatives de connexion échouées. 
                    Vous pouvez les débloquer manuellement via le menu d'actions. 
                    <em className="text-red-600 ml-1">
                      ⚠️ Note : Les comptes SUPERADMIN ne peuvent jamais être verrouillés automatiquement.
                    </em>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Filtres */}
          <ClientsFilters
            filters={filters}
            onFiltersChange={updateFilters}
            onReset={resetFilters}
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
                clients={clients}
                loading={loading}
                onToggleStatus={handleToggleStatus}
                onResetPassword={handleResetPassword}
                onUnlockClient={handleUnlockClient}
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
    </div>
  );
};

export default ClientManagement; 
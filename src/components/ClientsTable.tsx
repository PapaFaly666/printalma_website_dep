import React, { useState } from 'react';
import { Client } from '../types/client.types';
import { ClientWithCommission } from '../hooks/useClientsWithCommissions';
import { VendeurType, VENDEUR_TYPE_METADATA } from '../types/auth.types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { PageLoading, LoadingSpinner, ClientsTableSkeleton } from './ui/loading';
import { 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  RotateCcw, 
  Unlock,
  AlertTriangle,
  Clock,
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
  Key,
  Mail
} from 'lucide-react';
import { StatusConfirmModal } from './StatusConfirmModal';
import { SuccessToast } from './SuccessToast';
import { ResetPasswordModal } from './admin/ResetPasswordModal';
import { MiniCommissionSlider } from './admin/MiniCommissionSlider';
import { 
  ClientInfo, 
  getSellerTypeIcon, 
  getSellerTypeLabel, 
  formatLastLoginDate
} from '../types/auth.types';

interface ClientsTableProps {
  clients: ClientWithCommission[];
  loading: boolean;
  onToggleStatus: (clientId: number, currentStatus: boolean) => Promise<void>;
  onResetPassword?: (email: string) => Promise<{ message: string }>;
  onUnlockClient?: (clientId: number) => Promise<{
    message: string;
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      status: 'unlocked' | 'already_unlocked';
    };
    unlockedAt?: string;
  }>;
  onUpdateCommission?: (vendeurId: number, commission: number) => Promise<void>;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  loading,
  onToggleStatus,
  onResetPassword,
  onUnlockClient,
  onUpdateCommission
}) => {
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithCommission | null>(null);
  const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });

  const showSuccessToast = (message: string) => {
    setSuccessToast({ visible: true, message });
  };

  const hideSuccessToast = () => {
    setSuccessToast({ visible: false, message: '' });
  };

  const handleToggleStatusClick = (client: ClientWithCommission) => {
    setSelectedClient(client);
    setStatusModalOpen(true);
  };

  const handleToggleStatusConfirm = async () => {
    if (!selectedClient) return;

    setActionLoading(selectedClient.id);
    try {
      await onToggleStatus(selectedClient.id, selectedClient.status);
      
      const message = selectedClient.status 
        ? `Le compte de ${selectedClient.firstName} ${selectedClient.lastName} a été désactivé avec succès.`
        : `Le compte de ${selectedClient.firstName} ${selectedClient.lastName} a été activé avec succès.`;
      
      showSuccessToast(message);
      setStatusModalOpen(false);
      setSelectedClient(null);
    } catch (error: any) {
      const action = selectedClient.status ? 'désactivation' : 'activation';
      alert(`Erreur lors de la ${action} : ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (client: ClientWithCommission) => {
    setSelectedClient(client);
    setResetPasswordModalOpen(true);
  };

  const handleResetPasswordConfirm = async (email: string) => {
    if (!onResetPassword) return { message: 'Aucune action définie' };
    
    try {
      const result = await onResetPassword(email);
      showSuccessToast(result.message);
      setResetPasswordModalOpen(false);
      setSelectedClient(null);
      return result;
    } catch (error: any) {
      // Le modal gère déjà l'erreur et l'affiche
      throw error; // Relancer pour que le modal puisse gérer l'état de chargement
    }
  };

  const handleUnlockClient = async (client: ClientWithCommission) => {
    if (!onUnlockClient) return;

    setActionLoading(client.id);
    
    try {
      // 🆕 Appel de la nouvelle méthode de déblocage avec réponse détaillée
      const result = await onUnlockClient(client.id);
      
      // 🆕 Affichage de messages différenciés selon le statut retourné
      if (result && typeof result === 'object' && 'user' in result) {
        if (result.user.status === 'unlocked') {
          showSuccessToast(`✅ Compte de ${result.user.firstName} ${result.user.lastName} débloqué avec succès`);
        } else if (result.user.status === 'already_unlocked') {
          showSuccessToast(`ℹ️ Le compte de ${result.user.firstName} ${result.user.lastName} n'était pas verrouillé`);
        }
      } else {
        // Fallback pour l'ancienne API
        showSuccessToast(`✅ Compte de ${client.firstName} ${client.lastName} débloqué`);
      }
    } catch (error: any) {
      console.error('Erreur lors du déblocage:', error);
      // Le message d'erreur sera affiché par le hook useClients
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCommission = async (vendeurId: number, commission: number) => {
    if (!onUpdateCommission) {
      throw new Error('Fonction de mise à jour des commissions non disponible');
    }

    try {
      await onUpdateCommission(vendeurId, commission);
      showSuccessToast(`Commission mise à jour: ${commission}% pour le vendeur #${vendeurId}`);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la commission:', error);
      throw error;
    }
  };

  const isClientLocked = (client: ClientWithCommission): boolean => {
    return client.locked_until ? new Date(client.locked_until) > new Date() : false;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <ClientsTableSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Mail className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun client trouvé</h3>
          <p className="text-gray-600">Aucun client ne correspond aux critères de recherche.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map(client => (
                <tr 
                  key={client.id} 
                  className={`${!client.status ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'} transition-colors`}
                >
                  {/* Client Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {client.must_change_password && (
                          <Badge variant="secondary" className="text-xs">
                            🔑 Doit changer son mot de passe
                          </Badge>
                        )}
                        {isClientLocked(client) && (
                          <Badge variant="destructive" className="text-xs">
                            🔒 Compte verrouillé
                          </Badge>
                        )}
                        {client.login_attempts > 0 && !isClientLocked(client) && (
                          <Badge variant="outline" className="text-xs">
                            ⚠️ {client.login_attempts} tentatives échouées
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getSellerTypeIcon(client.vendeur_type)}</span>
                      <span className="text-sm text-gray-900">{getSellerTypeLabel(client.vendeur_type)}</span>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={`mailto:${client.email}`} 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {client.email}
                    </a>
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={client.status ? "default" : "secondary"}
                      className={client.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {client.status ? '✅ Actif' : '❌ Inactif'}
                    </Badge>
                  </td>

                  {/* Dernière connexion */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatLastLoginDate(client.last_login_at)}
                    </div>
                  </td>

                  {/* Date de création */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>

                  {/* Commission Slider */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {onUpdateCommission ? (
                      <div className="space-y-1">
                        <MiniCommissionSlider
                          vendeurId={client.id}
                          vendeurType={client.vendeur_type}
                          initialValue={client.commissionRate} // Vraie valeur depuis le backend
                          onSave={handleUpdateCommission}
                        />
                        {client.lastUpdated && (
                          <div className="text-xs text-gray-500">
                            Mise à jour: {new Date(client.lastUpdated).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Non disponible
                      </Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === client.id}
                        >
                          {actionLoading === client.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatusClick(client)}
                          className={client.status ? "text-red-600" : "text-green-600"}
                        >
                          {client.status ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        {onResetPassword && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleResetPassword(client)}
                              className="text-orange-600"
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Réinitialiser le mot de passe
                              <span className="ml-2 text-xs text-gray-500">
                                (Envoie un email)
                              </span>
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {onUnlockClient && isClientLocked(client) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUnlockClient(client)}
                              className="text-blue-600"
                            >
                              <Unlock className="mr-2 h-4 w-4" />
                              Débloquer le compte
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmation de changement de statut */}
      <StatusConfirmModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedClient(null);
        }}
        onConfirm={handleToggleStatusConfirm}
        client={selectedClient}
        loading={actionLoading === selectedClient?.id}
      />

      {/* Modal de réinitialisation du mot de passe */}
      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedClient(null);
        }}
        onConfirm={handleResetPasswordConfirm}
        client={selectedClient}
      />

      {/* Toast de succès */}
      <SuccessToast
        isVisible={successToast.visible}
        message={successToast.message}
        onClose={hideSuccessToast}
      />
    </>
  );
}; 
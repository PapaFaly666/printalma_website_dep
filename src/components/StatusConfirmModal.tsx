import React from 'react';
import { Modal } from './ui/modal';
import { Badge } from './ui/badge';
import { Shield, ShieldOff } from 'lucide-react';
import { ClientInfo, getSellerTypeIcon, getSellerTypeLabel } from '../types/auth.types';

interface StatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  client: ClientInfo | null;
  loading?: boolean;
}

export const StatusConfirmModal: React.FC<StatusConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  client,
  loading = false
}) => {
  if (!client) return null;

  const isActivating = !client.status;
  const action = isActivating ? 'activer' : 'désactiver';
  const actionPast = isActivating ? 'activé' : 'désactivé';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${isActivating ? 'Activer' : 'Désactiver'} le compte`}
      description={`Êtes-vous sûr de vouloir ${action} le compte de ce client ?`}
      confirmText={isActivating ? 'Activer' : 'Désactiver'}
      confirmVariant={isActivating ? 'default' : 'destructive'}
      loading={loading}
    >
      {/* Informations du client */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <span className="text-2xl">{getSellerTypeIcon(client.vendeur_type)}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {client.firstName} {client.lastName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {getSellerTypeLabel(client.vendeur_type)}
              </Badge>
              <Badge 
                variant={client.status ? "default" : "secondary"}
                className={`text-xs ${client.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {client.status ? '✅ Actif' : '❌ Inactif'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {client.email}
            </p>
          </div>
        </div>
      </div>

      {/* Détails de l'action */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          {isActivating ? (
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          ) : (
            <ShieldOff className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Conséquences de cette action :
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {isActivating ? (
                <>
                  <li>• Le client pourra se connecter à son compte</li>
                  <li>• Accès complet aux fonctionnalités de la plateforme</li>
                  <li>• Notifications réactivées</li>
                </>
              ) : (
                <>
                  <li>• Le client ne pourra plus se connecter</li>
                  <li>• Accès bloqué à toutes les fonctionnalités</li>
                  <li>• Sessions actuelles terminées</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Message d'avertissement pour la désactivation */}
      {!isActivating && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start gap-3">
            <ShieldOff className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">
                ⚠️ Attention
              </h4>
              <p className="text-sm text-red-800">
                Cette action désactivera immédiatement le compte. Le client perdra l'accès à toutes ses données et ne pourra plus se connecter.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StatusConfirmModal; 
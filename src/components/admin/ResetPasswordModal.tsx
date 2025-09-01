import React, { useState } from 'react';
import { Key, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/modal';
import type { ClientInfo } from '../../types/auth.types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientInfo | null;
  onConfirm: (email: string) => Promise<{ message: string }>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  client,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      await onConfirm(client.email);
      setSuccess(true);
      // Fermer automatiquement après 2 secondes
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      // Erreur gérée par le composant parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      onClose();
    }
  };

  if (!client) return null;

  // État de succès
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 backdrop-blur-sm transition-opacity" />
        
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 z-10">
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Email envoyé
            </h2>
            <p className="text-gray-600 text-sm">
              Un lien de réinitialisation a été envoyé à {client.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Réinitialiser le mot de passe"
      description=""
      confirmText="Envoyer le lien"
      cancelText="Annuler"
      confirmVariant="default"
      loading={loading}
    >
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {/* Informations du client */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {client.firstName} {client.lastName}
              </p>
              <p className="text-xs text-gray-600">{client.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Statut :</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                client.status 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {client.status ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Type :</span>
              <span className="ml-2 text-gray-900">{client.vendeur_type}</span>
            </div>
          </div>
        </div>

        {/* Détails de l'action */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <Key className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-blue-900 mb-1">
                Processus de réinitialisation :
              </p>
              <ul className="text-blue-800 space-y-0.5">
                <li>• Email envoyé à {client.email}</li>
                <li>• Lien expire dans 1 heure</li>
                <li>• Client définit nouveau mot de passe</li>
                <li>• Ancien mot de passe invalidé</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Informations de sécurité */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-green-900 mb-1">
                Sécurité garantie :
              </p>
              <ul className="text-green-800 space-y-0.5">
                <li>• Token unique et chiffré</li>
                <li>• Lien utilisable une seule fois</li>
                <li>• Traçabilité complète</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Avertissement */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-yellow-900 mb-1">
                Important :
              </p>
              <p className="text-yellow-800">
                Vérifiez que l'email est correct. Le client doit vérifier sa boîte de réception et ses spams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal; 
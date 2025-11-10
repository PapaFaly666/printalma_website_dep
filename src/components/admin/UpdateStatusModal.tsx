import React, { useState } from 'react';
import { OrderStatus } from '../../types/order';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  Home,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react';

// Configuration des statuts selon la documentation API
const STATUS_CONFIG = {
  PENDING: {
    color: '#FFA500',
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    icon: Clock,
    text: 'En attente',
    description: 'Commande créée, en attente de validation'
  },
  CONFIRMED: {
    color: '#28A745',
    backgroundColor: '#D4EDDA',
    borderColor: '#C3E6CB',
    icon: CheckCircle,
    text: 'Confirmée',
    description: 'Commande confirmée et payée'
  },
  PROCESSING: {
    color: '#17A2B8',
    backgroundColor: '#D1ECF1',
    borderColor: '#BEE5EB',
    icon: Package,
    text: 'En traitement',
    description: 'Commande en cours de préparation'
  },
  SHIPPED: {
    color: '#007BFF',
    backgroundColor: '#CCE5FF',
    borderColor: '#B3D9FF',
    icon: Truck,
    text: 'Expédiée',
    description: 'Commande expédiée au client'
  },
  DELIVERED: {
    color: '#6C757D',
    backgroundColor: '#E2E3E5',
    borderColor: '#D6D8DB',
    icon: Home,
    text: 'Livrée',
    description: 'Commande livrée au client'
  },
  CANCELLED: {
    color: '#DC3545',
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB',
    icon: XCircle,
    text: 'Annulée',
    description: 'Commande annulée'
  },
  REJECTED: {
    color: '#6F42C1',
    backgroundColor: '#E2D9F3',
    borderColor: '#D4C9F1',
    icon: AlertTriangle,
    text: 'Rejetée',
    description: 'Commande rejetée'
  }
} as const;

// Fonction pour obtenir les statuts suivants possibles selon le workflow
const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  switch (currentStatus) {
    case 'PENDING':
      return ['CONFIRMED', 'REJECTED'];
    case 'CONFIRMED':
      return ['PROCESSING', 'CANCELLED'];
    case 'PROCESSING':
      return ['SHIPPED', 'CANCELLED'];
    case 'SHIPPED':
      return ['DELIVERED'];
    case 'DELIVERED':
      return []; // Statut final
    case 'CANCELLED':
    case 'REJECTED':
      return []; // Statuts terminaux
    default:
      return [];
  }
};

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: OrderStatus, notes?: string) => Promise<void>;
  currentStatus: OrderStatus;
  orderNumber: string;
  orderDetails?: {
    customerName?: string;
    totalAmount?: number;
    itemsCount?: number;
  };
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  orderNumber,
  orderDetails
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = getNextStatuses(currentStatus);
  const currentConfig = STATUS_CONFIG[currentStatus];
  const CurrentIcon = currentConfig.icon;

  const handleConfirm = async () => {
    if (!selectedStatus) {
      setError('Veuillez sélectionner un nouveau statut');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(selectedStatus, notes || undefined);

      // Réinitialiser et fermer
      setSelectedStatus(null);
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStatus(null);
      setNotes('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            Mettre à jour le statut
          </DialogTitle>
          <DialogDescription className="text-base">
            Commande <span className="font-mono font-semibold text-slate-900">#{orderNumber}</span>
            {orderDetails?.customerName && (
              <span className="block mt-1 text-sm">
                Client: <span className="font-medium">{orderDetails.customerName}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Statut actuel */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Statut actuel
            </label>
            <div
              className="flex items-center gap-3 p-4 rounded-lg border-2"
              style={{
                backgroundColor: currentConfig.backgroundColor,
                borderColor: currentConfig.borderColor
              }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: currentConfig.color }}
              >
                <CurrentIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{currentConfig.text}</p>
                <p className="text-sm text-slate-600">{currentConfig.description}</p>
              </div>
            </div>
          </div>

          {/* Sélection du nouveau statut */}
          {availableStatuses.length > 0 ? (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Nouveau statut
              </label>
              <div className="grid grid-cols-1 gap-3">
                {availableStatuses.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  const isSelected = selectedStatus === status;

                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                        isSelected
                          ? 'ring-2 ring-slate-900 ring-offset-2'
                          : 'hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: config.backgroundColor,
                        borderColor: isSelected ? config.color : config.borderColor
                      }}
                    >
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center transition-transform ${
                          isSelected ? 'scale-110' : ''
                        }`}
                        style={{ backgroundColor: config.color }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-slate-900">{config.text}</p>
                        <p className="text-sm text-slate-600">{config.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-slate-900 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aucune transition de statut n'est possible depuis le statut actuel.
                {(currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') && (
                  <span className="block mt-1 text-sm">
                    Cette commande est dans un état terminal.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Notes optionnelles */}
          {selectedStatus && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Notes (optionnel)
              </label>
              <Textarea
                placeholder="Ajoutez des notes sur ce changement de statut..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Ces notes seront enregistrées dans l'historique de la commande
              </p>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStatus || isSubmitting || availableStatuses.length === 0}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

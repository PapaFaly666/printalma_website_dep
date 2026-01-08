// src/components/categories/DeleteConfirmDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Button from '@/components/ui/Button';
import { AlertCircle, Package, AlertTriangle, Trash2 } from 'lucide-react';
import { DeleteCategoryResult } from '@/services/categoryDeleteService';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  element: {
    id: number;
    name: string;
    type: 'category' | 'subcategory' | 'variation';
  };
  usageInfo?: {
    productsCount: number;
  };
  loading?: boolean;
  error?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  element,
  usageInfo,
  loading = false,
  error
}) => {
  const canDelete = !usageInfo || usageInfo.productsCount === 0;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'category': return 'Catégorie';
      case 'subcategory': return 'Sous-catégorie';
      case 'variation': return 'Variation';
      default: return 'Élément';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'category': return '📁';
      case 'subcategory': return '📂';
      case 'variation': return '🏷️';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'category': return 'text-blue-600 dark:text-blue-400';
      case 'subcategory': return 'text-green-600 dark:text-green-400';
      case 'variation': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Confirmer la suppression
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer {element.type === 'category' ? 'cette catégorie' : element.type === 'subcategory' ? 'cette sous-catégorie' : 'cette variation'} ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations sur l'élément */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-2xl">{getTypeIcon(element.type)}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Type:</p>
              <p className={`font-medium ${getTypeColor(element.type)}`}>
                {getTypeLabel(element.type)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Nom:</p>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {element.name}
              </p>
            </div>
          </div>

          {/* Message de confirmation */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer la {getTypeLabel(element.type).toLowerCase()}{' '}
            <span className="font-semibold text-gray-900 dark:text-white">"{element.name}"</span> ?
          </p>

          {/* Erreur de suppression */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium text-sm">
                    Erreur lors de la suppression
                  </h4>
                  <p className="text-red-700 text-sm mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Avertissement si l'élément est utilisé */}
          {!canDelete && usageInfo && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium text-sm">
                    Suppression impossible
                  </h4>
                  <p className="text-red-700 text-sm mt-1">
                    Cette {getTypeLabel(element.type).toLowerCase()} est utilisée par{' '}
                    <span className="font-semibold">{usageInfo.productsCount}</span>
                    {usageInfo.productsCount === 1 ? ' produit' : ' produits'}.
                  </p>
                  <p className="text-red-600 text-xs mt-2">
                    💡 Pour supprimer cet élément, vous devez d'abord supprimer ou déplacer les produits associés.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Avertissement pour les éléments supprimables */}
          {canDelete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-amber-800 text-sm">
                  ⚠️ Cette action est irréversible. Toutes les données associées seront définitivement perdues.
                </p>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant={canDelete ? "destructive" : "outline"}
              onClick={handleConfirm}
              disabled={!canDelete || loading}
              className={canDelete ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Suppression...
                </span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
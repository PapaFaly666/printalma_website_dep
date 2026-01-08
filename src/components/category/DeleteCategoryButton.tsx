/**
 * Bouton de suppression de catégorie avec protection intégrée
 * Basé sur la documentation CATEGORY_PROTECTION_VISUAL.md
 */

import React, { useState } from 'react';
import { useCategoryDeletion, DeletionResult } from '../../hooks/useCategoryDeletion';
import { MigrationDialog } from './MigrationDialog';
import Button from '../ui/Button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteCategoryButtonProps {
  categoryId: number;
  categoryName: string;
  type?: 'category' | 'subcategory' | 'variation';
  onDeleteSuccess?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const DeleteCategoryButton: React.FC<DeleteCategoryButtonProps> = ({
  categoryId,
  categoryName,
  type = 'category',
  onDeleteSuccess,
  variant = 'destructive',
  size = 'default',
  className = '',
  showIcon = true,
  children
}) => {
  const { deleteCategory, deleteSubCategory, deleteVariation, loading } = useCategoryDeletion();
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [blockerInfo, setBlockerInfo] = useState<any>(null);

  const handleDelete = async () => {
    let result: DeletionResult;

    // Appeler la bonne fonction selon le type
    switch (type) {
      case 'subcategory':
        result = await deleteSubCategory(categoryId);
        break;
      case 'variation':
        result = await deleteVariation(categoryId);
        break;
      case 'category':
      default:
        result = await deleteCategory(categoryId);
        break;
    }

    if (result.success) {
      // Succès - actualiser la liste
      toast.success(`${type === 'category' ? 'Catégorie' : type === 'subcategory' ? 'Sous-catégorie' : 'Variation'} "${categoryName}" supprimée avec succès !`);
      onDeleteSuccess?.();
    } else if (result.blockers && result.blockers.total && result.blockers.total > 0) {
      // Suppression bloquée - proposer la migration
      setBlockerInfo({
        blockers: result.blockers,
        message: result.error || 'Cette catégorie ne peut pas être supprimée car des produits l\'utilisent.'
      });
      setShowMigrationDialog(true);
    } else if (!result.cancelled && result.error) {
      // Erreur
      toast.error(result.error);
    }
  };

  const handleMigrationComplete = () => {
    setShowMigrationDialog(false);
    toast.success('Migration réussie ! Vous pouvez maintenant supprimer la catégorie.');

    // Rafraîchir les données
    onDeleteSuccess?.();
  };

  return (
    <>
      <Button
        onClick={handleDelete}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Suppression...
          </>
        ) : (
          <>
            {showIcon && <Trash2 className="h-4 w-4 mr-2" />}
            {children || 'Supprimer'}
          </>
        )}
      </Button>

      {showMigrationDialog && blockerInfo && (
        <MigrationDialog
          categoryId={categoryId}
          categoryName={categoryName}
          blockerInfo={blockerInfo}
          onClose={() => setShowMigrationDialog(false)}
          onMigrationComplete={handleMigrationComplete}
        />
      )}
    </>
  );
};

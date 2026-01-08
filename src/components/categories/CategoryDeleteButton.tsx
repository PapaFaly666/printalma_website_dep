import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { AlertTriangle, Trash2, Loader2, XCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import categoryService from '../../services/categoryService';
import { Category } from '../../types/category.types';

interface CategoryDeleteButtonProps {
  category: Category;
  onSuccess: () => void;
}

export const CategoryDeleteButton: React.FC<CategoryDeleteButtonProps> = ({
  category,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProductCount();
  }, [category.id]);

  const fetchProductCount = async () => {
    setLoadingCount(true);
    try {
      const count = await categoryService.getCategoryProductCount(category.id);
      setProductCount(count);
    } catch (error) {
      console.error('Error fetching product count:', error);
      setProductCount(category.productCount || 0);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await categoryService.deleteCategory(category.id);

      toast.success(response.message, {
        description: response.deletedCount > 1
          ? `${response.deletedCount} catégories supprimées (incluant les sous-catégories)`
          : 'Catégorie supprimée avec succès',
        icon: <CheckCircle className="h-4 w-4" />
      });

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      const errorMessage = error.message || 'Erreur lors de la suppression';
      setError(errorMessage);

      toast.error('Impossible de supprimer', {
        description: errorMessage,
        icon: <XCircle className="h-4 w-4" />
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // 🚫 Si la catégorie a des produits, afficher un message bloquant
  if (productCount > 0 && !loadingCount) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>🚫 Suppression impossible</strong>
            <br />
            Cette catégorie (ou ses sous-catégories) est liée à{' '}
            <strong>{productCount} produit(s)</strong>.
            <br />
            <span className="text-sm">
              Veuillez d'abord déplacer les produits vers une autre catégorie.
            </span>
          </AlertDescription>
        </Alert>

        <Button
          variant="destructive"
          disabled
          className="w-full opacity-50 cursor-not-allowed"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Suppression bloquée
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
        disabled={loadingCount}
        className="w-full"
      >
        {loadingCount ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer la catégorie{' '}
                <strong className="text-foreground">"{category.name}"</strong> ?
              </p>

              {category.children && category.children.length > 0 && (
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    Cette catégorie contient{' '}
                    <strong>{category.children.length} sous-catégorie(s)</strong>.
                    <br />
                    Toutes seront également supprimées.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground pt-2">
                Cette action est irréversible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
